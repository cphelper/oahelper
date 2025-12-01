<?php
// public/resend-code.php

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

// Check if user exists and is not verified
$user = supabaseGetUserByEmail($email);

if (!$user) {
    echo json_encode([
        "status" => "error",
        "message" => "No user found with this email."
    ]);
    exit();
}

$id = $user['id'];
$name = $user['name'];
$verified = $user['verified'];

// Check if already verified
if ($verified) {
    echo json_encode([
        "status" => "error",
        "message" => "Email is already verified. You can login now."
    ]);
    exit();
}

// Generate new 4-digit verification code
$verificationCode = sprintf('%04d', rand(0, 9999));

// Update user with new verification code
$updateData = [
    'verification_code' => $verificationCode,
    'updated_at' => gmdate('c')
];

if (supabasePatch('Users', ['id' => 'eq.' . $id], $updateData)) {
    // Send verification email
    try {
        $mail = getMailer();
        $mail->addAddress($email, $name);
        
        $mail->isHTML(true);
        $mail->Subject = 'New Verification Code - OAHelper';
        $mail->Body = "
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
                <div style='text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;'>
                    <h1 style='margin: 0; font-size: 28px;'>New Verification Code</h1>
                    <p style='margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;'>Your new verification code is ready</p>
                </div>
                
                <div style='background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;'>
                    <p style='font-size: 16px; color: #333; margin-bottom: 20px;'>Hi <strong>{$name}</strong>,</p>
                    
                    <p style='font-size: 16px; color: #333; line-height: 1.5; margin-bottom: 30px;'>
                        Here's your new verification code:
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
                </div>
                
                <div style='text-align: center; padding: 20px; color: #666; font-size: 12px;'>
                    <p style='margin: 0;'>© 2025 OAHelper. All rights reserved.</p>
                </div>
            </div>";
        
        $mail->send();
        
        echo json_encode([
            "status" => "success",
            "message" => "New verification code sent to your email!"
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            "status" => "error",
            "message" => "Failed to send verification email. Please try again."
        ]);
    }
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Failed to generate new code. Please try again."
    ]);
}
?>