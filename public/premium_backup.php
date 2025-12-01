<?php
// public/signup.php

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

// Include PHPMailer
require_once __DIR__ . '/phpmailer/src/Exception.php';
require_once __DIR__ . '/phpmailer/src/PHPMailer.php';
require_once __DIR__ . '/phpmailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

function getMailer() {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = 'smtp.hostinger.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'support@oahelper.in';
    $mail->Password = 'Kam25hai@123';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port = 465;
    
    $mail->setFrom('support@oahelper.in', 'OAHelper');
    
    return $mail;
}

// Database connection is managed via db/config.php
if (!isset($conn) || !$conn instanceof mysqli || $conn->connect_error) {
    die(json_encode([
        "status" => "error",
        "message" => "Database connection failed"
    ]));
}

// Get the POST data
$input = json_decode(file_get_contents('php://input'), true);

$name = isset($input['name']) ? trim($input['name']) : '';
$email = isset($input['email']) ? trim($input['email']) : '';
$password = isset($input['password']) ? $input['password'] : '';

// Basic validation
if (empty($name) || empty($email) || empty($password)) {
    echo json_encode([
        "status" => "error",
        "message" => "Please fill in all fields."
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

// Check if email already exists
$stmt = $conn->prepare("SELECT id FROM Users WHERE email = ?");
if (!$stmt) {
    echo json_encode([
        "status" => "error",
        "message" => "Database prepare error: " . $conn->error
    ]);
    exit();
}
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    echo json_encode([
        "status" => "error",
        "message" => "Email is already registered. Please use a different email."
    ]);
    $stmt->close();
    $conn->close();
    exit();
}
$stmt->close();

// Hash the password
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

// Generate 4-digit verification code
$verificationCode = sprintf('%04d', rand(0, 9999));

// Insert user as unverified with verification code
$stmt = $conn->prepare("INSERT INTO Users (name, email, password, verified, verification_code) VALUES (?, ?, ?, 0, ?)");
if (!$stmt) {
    echo json_encode([
        "status" => "error",
        "message" => "Database prepare error: " . $conn->error
    ]);
    exit();
}
$stmt->bind_param("ssss", $name, $email, $hashedPassword, $verificationCode);

if ($stmt->execute()) {
    $userId = $conn->insert_id;
    
    // Send verification email
    try {
        $mail = getMailer();
        $mail->addAddress($email, $name);
        
        $mail->isHTML(true);
        $mail->Subject = 'Verify Your Email - OAHelper';
        $mail->Body = "
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
                <div style='text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;'>
                    <h1 style='margin: 0; font-size: 28px;'>Welcome to OAHelper!</h1>
                    <p style='margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;'>Verify your email to get started</p>
                </div>
                
                <div style='background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;'>
                    <p style='font-size: 16px; color: #333; margin-bottom: 20px;'>Hi <strong>{$name}</strong>,</p>
                    
                    <p style='font-size: 16px; color: #333; line-height: 1.5; margin-bottom: 30px;'>
                        Thank you for signing up! Please enter the verification code below to complete your registration:
                    </p>
                    
                    <div style='text-align: center; margin: 30px 0;'>
                        <div style='display: inline-block; background: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 20px 30px;'>
                            <div style='font-size: 14px; color: #666; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px;'>Verification Code</div>
                            <div style='font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 4px; font-family: monospace;'>{$verificationCode}</div>
                        </div>
                    </div>
                    
                    <p style='font-size: 14px; color: #666; text-align: center; margin-top: 30px;'>
                        This code will expire in 10 minutes for security reasons.
                    </p>
                    
                    <p style='font-size: 14px; color: #666; text-align: center; margin-top: 20px;'>
                        If you didn't request this verification, please ignore this email.
                    </p>
                </div>
                
                <div style='text-align: center; padding: 20px; color: #666; font-size: 12px;'>
                    <p style='margin: 0;'>© 2025 OAHelper. All rights reserved.</p>
                </div>
            </div>";
        
        $mail->send();
        
        echo json_encode([
            "status" => "success",
            "message" => "Registration successful! Please check your email for the verification code.",
            "user" => [
                "id" => $userId,
                "name" => $name,
                "email" => $email,
                "verified" => false
            ],
            "requires_verification" => true
        ]);
        
    } catch (Exception $e) {
        // Delete the user if email sending fails
        $deleteStmt = $conn->prepare("DELETE FROM Users WHERE id = ?");
        $deleteStmt->bind_param("i", $userId);
        $deleteStmt->execute();
        
        echo json_encode([
            "status" => "error",
            "message" => "Failed to send verification email. Please try again."
        ]);
    }
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Registration failed: " . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>