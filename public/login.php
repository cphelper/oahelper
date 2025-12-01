<?php
// public/login.php

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Include database configuration first to get CORS functions
require_once __DIR__ . '/../db/config.php';

// Set CORS headers based on environment
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Validate API key
validateApiKey();

// Get the POST data
$input = json_decode(file_get_contents('php://input'), true);

$email = isset($input['email']) ? trim($input['email']) : '';
$password = isset($input['password']) ? $input['password'] : '';

// Basic validation
if (empty($email) || empty($password)) {
    echo json_encode([
        "status" => "error",
        "message" => "Please fill in all fields."
    ]);
    exit();
}

// Check if email is banned
// Check both 'banned_emails' and 'BannedEmails' just in case, or assume lowercase based on migration patterns
$banned = supabaseSelect('banned_emails', ['email' => 'eq.' . $email], 'id', true);
if ($banned) {
    echo json_encode([
        "status" => "error",
        "message" => "This email address has been banned from the platform."
    ]);
    exit();
}

// Authenticate with Supabase Auth (DEPRECATED - Moved to custom Users table auth)
// $authResponse = supabaseSignIn($email, $password);

// Fetch User from public.Users
$userRecord = supabaseGetUserByEmail($email);

if (!$userRecord) {
    echo json_encode([
        "status" => "error",
        "message" => "Invalid credentials." // Generic error for security
    ]);
    exit();
}

// Verify Password
// Check if password matches (assuming password_hash() was used in MySQL)
// Note: If MySQL passwords were not hashed or used different algo, this needs adjustment.
// Migration script copied 'password' column directly.
if (!password_verify($password, $userRecord['password'])) {
    // If verification fails, and it's a legacy password (maybe plain text?), check that?
    // But standard practice is hash. If simple check fails, return error.
    
    // DEBUG: Uncomment if needed
    // error_log("Password verify failed for " . $email);
    
    echo json_encode([
        "status" => "error",
        "message" => "Invalid credentials."
    ]);
    exit();
}

// Auth successful
// $userUuid = $authResponse['data']['user']['id'];
// $accessToken = $authResponse['data']['access_token'];
// Use User ID as the identifier
$userId = $userRecord['id'];
$accessToken = "custom-session-" . bin2hex(random_bytes(16)); // Dummy token or JWT implementation needed if frontend requires valid JWT

// Fetch Profile - NO, we use Users now
// $profile = supabaseSelect('profiles', ['id' => 'eq.' . $userUuid], '*', true);
$profile = $userRecord; // Map user record to profile variable for minimal changes

if (!$profile) {
    // Profile missing - this shouldn't happen for migrated users
    echo json_encode([
        "status" => "error",
        "message" => "User profile not found."
    ]);
    exit();
}

// Check verification status
// Use profile 'verified' flag as it carries over legacy status
if (!$profile['verified']) {
    echo json_encode([
        "status" => "error",
        "message" => "Please verify your email before logging in. Check your email for the verification code."
    ]);
    exit();
}

// Prepare user data
$user = [
    "id" => $profile['id'], 
    "name" => $profile['name'],
    "email" => $profile['email'],
    "verified" => $profile['verified'] ? 1 : 0,
    "used_temp_password" => false, 
    "oacoins" => $profile['oacoins'] ?? 0,
    "uuid" => (string)$profile['id'], // Use ID as UUID placeholder
    "token" => $accessToken // Send token for future authenticated requests
];

echo json_encode([
    "status" => "success",
    "message" => "Login successful.",
    "user" => $user
]);
?>