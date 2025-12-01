<?php
// public/verify-code.php
// Supabase-only version

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
$code = isset($input['code']) ? trim($input['code']) : '';

// Basic validation
if (empty($email) || empty($code)) {
    echo json_encode([
        "status" => "error",
        "message" => "Please provide both email and verification code."
    ]);
    exit();
}

// Validate code format (4 digits)
if (!preg_match('/^\d{4}$/', $code)) {
    echo json_encode([
        "status" => "error",
        "message" => "Verification code must be 4 digits."
    ]);
    exit();
}

// Check if user exists with this email using public.Users table
$profile = supabaseGetUserByEmail($email);

if (!$profile) {
    echo json_encode([
        "status" => "error",
        "message" => "No user found with this email."
    ]);
    exit();
}

$id = $profile['id']; // This is now the main ID (BigInt)
$name = $profile['name'];
$verificationCode = $profile['verification_code'] ?? null;
$passwordResetCode = $profile['password_reset_code'] ?? null;
$passwordResetExpires = $profile['password_reset_expires'] ?? null;
$verified = $profile['verified'] ?? false;
$legacyId = $profile['id']; // Same as ID now

// Check if this is a password reset request (has password_reset_code and it's not expired)
if (!empty($passwordResetCode) && !empty($passwordResetExpires) && strtotime($passwordResetExpires) > time()) {
    // This is a password reset verification
    if ($code !== $passwordResetCode) {
        echo json_encode([
            "status" => "error",
            "message" => "Invalid verification code. Please check and try again."
        ]);
        exit();
    }

    // Code is valid for password reset
    echo json_encode([
        "status" => "success",
        "message" => "Verification code is valid. You can now reset your password.",
        "reset_verified" => true,
        "user_id" => $legacyId // Return ID for frontend compatibility
    ]);
    exit();
}

// Check if this is for email verification (signup verification)
if (!$verified && !empty($verificationCode)) {
    // This is for email verification during signup
    if ($code !== $verificationCode) {
        echo json_encode([
            "status" => "error",
            "message" => "Invalid verification code. Please check and try again."
        ]);
        exit();
    }

    // Update user as verified and clear the verification code in Supabase
    $updateSuccess = supabaseUpdateProfile($id, [
        'verified' => true,
        'verification_code' => null
    ]);

    if ($updateSuccess) {
        echo json_encode([
            "status" => "success",
            "message" => "Email verified successfully! You can now login.",
            "user" => [
                "id" => $legacyId,
                "name" => $name,
                "email" => $email,
                "verified" => true
            ]
        ]);
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "Failed to verify email. Please try again."
        ]);
    }
    exit();
}

// If we get here, the code doesn't match either verification type
echo json_encode([
    "status" => "error",
    "message" => "Invalid verification code or code has expired. Please request a new code."
]);
?>
