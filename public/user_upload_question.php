<?php
// public/user_upload_question.php
// Supabase-only version

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Include database configuration first to get CORS functions
require_once __DIR__ . '/../db/config.php';

// Set CORS headers based on environment
setCorsHeaders();

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
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

// Set a reasonable execution time limit for image processing
set_time_limit(300);

// Create upload directory if it doesn't exist
$upload_dir = __DIR__ . "/user_question_images/";
$web_upload_dir = "user_question_images/";

if (!file_exists($upload_dir)) {
    if (!mkdir($upload_dir, 0755, true)) {
        throw new Exception("Failed to create upload directory.");
    }
}

if (!is_writable($upload_dir)) {
    chmod($upload_dir, 0755);
}

// Function to get the base URL of the site
function getBaseUrl() {
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https://' : 'http://';
    $host = $_SERVER['HTTP_HOST'];
    $baseUrl = $protocol . $host;
    $scriptPath = dirname($_SERVER['SCRIPT_NAME']);
    if ($scriptPath !== '/' && $scriptPath !== '\\') {
        $scriptPath = str_replace('\\', '/', $scriptPath);
        $scriptPath = rtrim($scriptPath, '/');
        $baseUrl .= $scriptPath;
    }
    return $baseUrl;
}

// Send email notification to admin
function notifyAdminNewSubmission($submission_id, $user_email, $company_name) {
    try {
        $mail = getMailer();
        $mail->addAddress('saktawatshyam@gmail.com', 'Admin');
        $mail->Subject = 'New Question Submission - OA Helper';
        $mail->isHTML(true);

        $emailBody = "
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                <div style='background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;'>
                    <h1 style='color: white; margin: 0;'>New Question Submission</h1>
                </div>
                <div style='background: #ffffff; padding: 30px;'>
                    <p><strong>User Email:</strong> " . htmlspecialchars($user_email) . "</p>
                    <p><strong>Company:</strong> " . htmlspecialchars($company_name) . "</p>
                    <p><strong>Submission ID:</strong> #" . $submission_id . "</p>
                    <p><strong>Submitted At:</strong> " . date('Y-m-d H:i:s') . "</p>
                    <div style='text-align: center; margin: 30px 0;'>
                        <a href='https://oahelper.in/admin' style='background: #16a34a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px;'>Open Admin Panel</a>
                    </div>
                </div>
            </div>";

        $mail->Body = $emailBody;
        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Failed to send admin notification email: " . $e->getMessage());
        return false;
    }
}

// Send confirmation email to user
function sendUserConfirmationEmail($user_email, $submission_id, $company_name) {
    try {
        $mail = getMailer();
        $mail->addAddress($user_email);
        $mail->Subject = 'Question Submission Received - OA Helper';
        $mail->isHTML(true);

        $emailBody = "
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                <div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;'>
                    <h1 style='color: white; margin: 0;'>Submission Received!</h1>
                </div>
                <div style='background: #ffffff; padding: 30px;'>
                    <p>Thank you for your submission!</p>
                    <p><strong>Company:</strong> " . htmlspecialchars($company_name) . "</p>
                    <p><strong>Submission ID:</strong> #" . $submission_id . "</p>
                    <p>Our team will review your question and provide a solution within 30 minutes to 1 hour.</p>
                </div>
            </div>";

        $mail->Body = $emailBody;
        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Failed to send user confirmation email: " . $e->getMessage());
        return false;
    }
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Only POST method is allowed");
    }
    
    // Get form data
    $user_email = isset($_POST['user_email']) ? trim($_POST['user_email']) : '';
    $company_name = isset($_POST['company_name']) ? trim($_POST['company_name']) : '';
    $additional_info = isset($_POST['additional_info']) ? trim($_POST['additional_info']) : '';
    
    // Validate required fields
    if (empty($user_email)) {
        throw new Exception("User email is required");
    }
    
    if (!filter_var($user_email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception("Invalid email format");
    }
    
    if (empty($company_name)) {
        throw new Exception("Company name is required");
    }
    
    // Check for images
    if (empty($_FILES) || !isset($_FILES['images'])) {
        throw new Exception("At least one image is required");
    }
    
    // Process uploaded images
    $uploaded_images = [];
    $files = $_FILES['images'];
    
    // Handle both single and multiple file uploads
    if (is_array($files['name'])) {
        $file_count = count($files['name']);
        for ($i = 0; $i < $file_count; $i++) {
            if ($files['error'][$i] === 0) {
                $original_name = $files['name'][$i];
                $new_filename = uniqid() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', $original_name);
                $target_path = $upload_dir . $new_filename;
                $web_path = $web_upload_dir . $new_filename;
                
                if (move_uploaded_file($files['tmp_name'][$i], $target_path)) {
                    $uploaded_images[] = [
                        'path' => $web_path,
                        'url' => getBaseUrl() . '/' . $web_path,
                        'original_filename' => $original_name
                    ];
                }
            }
        }
    } else {
        if ($files['error'] === 0) {
            $original_name = $files['name'];
            $new_filename = uniqid() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', $original_name);
            $target_path = $upload_dir . $new_filename;
            $web_path = $web_upload_dir . $new_filename;
            
            if (move_uploaded_file($files['tmp_name'], $target_path)) {
                $uploaded_images[] = [
                    'path' => $web_path,
                    'url' => getBaseUrl() . '/' . $web_path,
                    'original_filename' => $original_name
                ];
            }
        }
    }
    
    if (empty($uploaded_images)) {
        throw new Exception("Failed to upload images");
    }
    
    // Create submission using Supabase
    $submissionData = [
        'user_email' => $user_email,
        'company_name' => $company_name,
        'additional_info' => $additional_info,
        'status' => 'pending'
    ];
    
    $submission = supabaseInsertUserQuestionSubmission($submissionData);
    
    if (!$submission) {
        throw new Exception("Failed to create submission");
    }
    
    $submission_id = $submission['id'];
    
    // Insert image references using Supabase
    foreach ($uploaded_images as $image) {
        supabaseInsertUserSubmissionImage(
            $submission_id,
            $image['path'],
            $image['url'],
            $image['original_filename']
        );
    }
    
    // Send notification emails
    notifyAdminNewSubmission($submission_id, $user_email, $company_name);
    sendUserConfirmationEmail($user_email, $submission_id, $company_name);
    
    echo json_encode([
        "status" => "success",
        "message" => "Your question has been submitted successfully! Our team will review and provide a solution within 30 minutes to 1 hour.",
        "submission_id" => $submission_id,
        "images_uploaded" => count($uploaded_images)
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
?>
