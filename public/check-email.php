<?php
// public/check-email.php

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Include database configuration first to get CORS functions
require_once __DIR__ . '/../db/config.php';
require_once __DIR__ . '/../db/supabase_client.php';

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

// Basic validation
if (empty($email)) {
    echo json_encode([
        "status" => "error",
        "message" => "Please provide email address."
    ]);
    exit();
}

// Validate email format and ensure it's Gmail
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !preg_match('/@gmail\.com$/', $email)) {
    echo json_encode([
        "status" => "error",
        "message" => "Please use a valid Gmail address (@gmail.com)"
    ]);
    exit();
}

// Check if email exists and get verification status
// Using public.Users table
$profile = supabaseGetUserByEmail($email);

if (!$profile) {
    // Email doesn't exist - can proceed with signup
    echo json_encode([
        "status" => "available",
        "message" => "Email is available for registration",
        "action" => "signup"
    ]);
} else {
    // Email exists - check verification status
    if ($profile['verified']) {
        // Email exists and is verified - user should login
        echo json_encode([
            "status" => "exists_verified",
            "message" => "This email is already registered and verified. Please login instead.",
            "action" => "login",
            "user_name" => $profile['name']
        ]);
    } else {
        // Email exists but not verified - user should verify
        echo json_encode([
            "status" => "exists_unverified",
            "message" => "This email is already registered but not verified. Please verify your email.",
            "action" => "verify",
            "user_name" => $profile['name']
        ]);
    }
}
?>

