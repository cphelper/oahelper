<?php
// public/reset-password.php

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
$password = isset($input['password']) ? $input['password'] : '';

// Basic validation
if (empty($email) || empty($password)) {
    echo json_encode([
        "status" => "error",
        "message" => "Please provide both email and password."
    ]);
    exit();
}

// Validate password strength (at least 6 characters)
if (strlen($password) < 6) {
    echo json_encode([
        "status" => "error",
        "message" => "Password must be at least 6 characters long."
    ]);
    exit();
}

// Check if user exists and has a valid reset code
$user = supabaseGetUserByEmail($email);

if (!$user) {
    echo json_encode([
        "status" => "error",
        "message" => "No user found with this email."
    ]);
    exit();
}

$id = $user['id'];
$resetCode = $user['password_reset_code'];
$resetExpires = $user['password_reset_expires'];

// Check if reset code exists and hasn't expired
if (empty($resetCode) || strtotime($resetExpires) < time()) {
    echo json_encode([
        "status" => "error",
        "message" => "Password reset code has expired or is invalid. Please request a new code."
    ]);
    exit();
}

// Hash the new password and update in Users table
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

$updated = supabasePatch('Users', ['id' => 'eq.' . $id], [
    'password' => $hashedPassword,
    'password_reset_code' => null,
    'password_reset_expires' => null,
    'updated_at' => gmdate('c')
]);

if ($updated) {
    echo json_encode([
        "status" => "success",
        "message" => "Password has been successfully updated. You can now login with your new password."
    ]);
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Failed to update password. Please try again."
    ]);
}
?>


