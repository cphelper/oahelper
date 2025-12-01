<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Include database configuration first to get CORS functions and validateApiKey
require_once __DIR__ . '/../db/config.php';
require_once __DIR__ . '/../db/supabase_client.php';

// Include PHPMailer
require_once __DIR__ . '/phpmailer/src/PHPMailer.php';
require_once __DIR__ . '/phpmailer/src/SMTP.php';
require_once __DIR__ . '/phpmailer/src/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

// Set CORS headers based on environment
setCorsHeaders();

// Validate API key
validateApiKey();

// RPC secret key for banned email functions
define('SUPABASE_SECRET_RPC_KEY', 'oa_helper_supa_secret_2024');

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

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $action = isset($_GET['action']) ? $_GET['action'] : 'get_submissions';
        
        if ($action === 'get_users') {
            // Fetch all registered users from Users table
            $users = supabaseSelect('Users', ['order' => 'created_at.desc']);
            
            if ($users === false) {
                throw new Exception("Failed to fetch users");
            }
            
            echo json_encode([
                'status' => 'success',
                'data' => $users,
                'total' => count($users)
            ]);
            exit();
        }
        
        if ($action === 'search_user') {
            // Search for a user by email
            $email = isset($_GET['email']) ? trim($_GET['email']) : '';
            
            if (empty($email)) {
                throw new Exception("Email is required");
            }
            
            $user = supabaseSelect('Users', ['email' => 'eq.' . $email], '*', true);
            
            if ($user === false || !$user) {
                echo json_encode([
                    'status' => 'error',
                    'message' => 'User not found'
                ]);
                exit();
            }
            
            echo json_encode([
                'status' => 'success',
                'user' => $user
            ]);
            exit();
        }
        
        if ($action === 'get_banned_emails') {
            // Fetch from Supabase via RPC
            $banned_emails = supabaseRpc('admin_list_banned_emails', [
                'secret_key' => SUPABASE_SECRET_RPC_KEY
            ]);
            
            if ($banned_emails === null) {
                // If null, it might be error or empty. 
                // RPC usually returns array.
                $banned_emails = [];
            }
            
            echo json_encode([
                'status' => 'success',
                'data' => $banned_emails,
                'total' => count($banned_emails)
            ]);
            exit();
        }
        
        if ($action === 'check_user_banned') {
            // Get user email from request
            $userEmail = isset($_GET['email']) ? trim(strtolower($_GET['email'])) : '';
            
            if (empty($userEmail)) {
                throw new Exception("Email is required");
            }
            
            // Check via Supabase RPC
            $isBanned = supabaseRpc('is_email_banned', [
                'check_email' => $userEmail
            ]);
            
            echo json_encode([
                'status' => 'success',
                'is_banned' => (bool)$isBanned,
                'email' => $userEmail
            ]);
            exit();
        }
        
        // Default action: Fetch all user submissions with their images
        // Supabase: fetch UserQuestionSubmissions with embedded UserSubmissionImages
        // Relation name likely UserSubmissionImages
        $submissions = supabaseSelect('UserQuestionSubmissions', [
            'order' => 'submitted_at.desc',
            'select' => '*,UserSubmissionImages(*)'
        ]);
        
        if ($submissions === false) {
            throw new Exception("Failed to fetch submissions");
        }
        
        // Transform data to match expected format (flatten images)
        $baseUrl = getBaseUrl();
        foreach ($submissions as &$sub) {
            $images = [];
            if (isset($sub['UserSubmissionImages']) && is_array($sub['UserSubmissionImages'])) {
                foreach ($sub['UserSubmissionImages'] as $img) {
                    $images[] = [
                        'path' => $img['image_path'],
                        'url' => $img['image_url'] ?: ($baseUrl . '/' . $img['image_path']),
                        'original_filename' => $img['original_filename']
                    ];
                }
            }
            $sub['images'] = $images;
            $sub['image_count'] = count($images);
            unset($sub['UserSubmissionImages']);
        }
        
        echo json_encode([
            "status" => "success",
            "data" => $submissions
        ]);
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Handle status updates and admin actions
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['action'])) {
            throw new Exception("Action is required");
        }
        
        $action = $input['action'];
        
        switch ($action) {
            case 'update_status':
                if (!isset($input['submission_id']) || !isset($input['status'])) {
                    throw new Exception("Submission ID and status are required");
                }
                
                $submission_id = intval($input['submission_id']);
                $status = $input['status'];
                $admin_notes = isset($input['admin_notes']) ? $input['admin_notes'] : null;
                
                // Validate status
                $valid_statuses = ['pending', 'in_progress', 'completed', 'cancelled'];
                if (!in_array($status, $valid_statuses)) {
                    throw new Exception("Invalid status");
                }
                
                $payload = [
                    'status' => $status,
                    'updated_at' => gmdate('c')
                ];
                
                if ($admin_notes !== null) {
                    $payload['admin_notes'] = $admin_notes;
                }
                
                if ($status === 'completed') {
                    $payload['solved_at'] = gmdate('c');
                }
                
                $updated = supabasePatch('UserQuestionSubmissions', ['id' => 'eq.' . $submission_id], $payload);
                
                if ($updated) {
                    echo json_encode([
                        "status" => "success",
                        "message" => "Submission status updated successfully"
                    ]);
                } else {
                    throw new Exception("Failed to update submission status");
                }
                break;
                
            case 'mark_solution_sent':
                if (!isset($input['submission_id'])) {
                    throw new Exception("Submission ID is required");
                }
                
                $submission_id = intval($input['submission_id']);
                
                $payload = [
                    'solution_sent' => true,
                    'updated_at' => gmdate('c')
                ];
                
                $updated = supabasePatch('UserQuestionSubmissions', ['id' => 'eq.' . $submission_id], $payload);
                
                if ($updated) {
                    echo json_encode([
                        "status" => "success",
                        "message" => "Marked as solution sent"
                    ]);
                } else {
                    throw new Exception("Failed to update solution sent status");
                }
                break;
                
            case 'delete':
                if (!isset($input['submission_id'])) {
                    throw new Exception("Submission ID is required");
                }
                
                $submission_id = intval($input['submission_id']);
                
                // Fetch images first if we need to delete them (skipping file deletion logic for now as we move to Supabase)
                // Assuming Supabase cascade handles DB records. 
                // If files are local, we can't delete them easily if we don't query them first.
                // But for now let's just delete the record from DB.
                
                $deleted = supabaseDelete('UserQuestionSubmissions', ['id' => 'eq.' . $submission_id]);
                
                if ($deleted) {
                    echo json_encode([
                        "status" => "success",
                        "message" => "Submission deleted successfully"
                    ]);
                } else {
                    throw new Exception("Failed to delete submission");
                }
                break;
                
            case 'ban_email':
                if (!isset($input['email'])) {
                    throw new Exception("Email is required");
                }
                
                $email = trim(strtolower($input['email']));
                
                // Validate email format
                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    throw new Exception("Invalid email format");
                }
                
                // Ban email in Supabase
                $result = supabaseRpc('admin_manage_ban', [
                    'email_input' => $email,
                    'is_ban' => true,
                    'secret_key' => SUPABASE_SECRET_RPC_KEY
                ]);
                
                echo json_encode([
                    "status" => "success",
                    "message" => "Email banned successfully"
                ]);
                break;
                
            case 'unban_email':
                if (!isset($input['email_id'])) {
                    throw new Exception("Email ID is required");
                }
                
                $email_id = intval($input['email_id']);
                
                // Unban email in Supabase
                $result = supabaseRpc('admin_unban_by_id', [
                    'id_input' => $email_id,
                    'secret_key' => SUPABASE_SECRET_RPC_KEY
                ]);
                
                echo json_encode([
                    "status" => "success",
                    "message" => "Email unbanned successfully"
                ]);
                break;
                
            case 'send_ban_notification':
                // Send email (no DB change)
                if (!isset($input['email'])) {
                    throw new Exception("Email is required");
                }
                
                $email = trim($input['email']);
                
                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    throw new Exception("Invalid email format");
                }
                
                $mail = new PHPMailer(true);
                
                try {
                    $mail->isSMTP();
                    $mail->Host = 'smtp.hostinger.com';
                    $mail->SMTPAuth = true;
                    $mail->Username = 'support@oahelper.in';
                    $mail->Password = 'Kam25hai@123';
                    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
                    $mail->Port = 465;
                    
                    $mail->setFrom('support@oahelper.in', 'OAHelper Team');
                    $mail->addAddress($email);
                    
                    $mail->isHTML(true);
                    $mail->Subject = 'Account Ban Notification - OAHelper';
                    $mail->Body = '
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                            <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <h2 style="color: #dc2626; margin-bottom: 20px;">Account Ban Notification</h2>
                                <p style="color: #333; line-height: 1.6; margin-bottom: 15px;">Hello,</p>
                                <p style="color: #333; line-height: 1.6; margin-bottom: 15px;">We regret to inform you that your email has been banned due to the use of an incorrect payment method.</p>
                                <p style="color: #333; line-height: 1.6; margin-bottom: 15px;">If you believe this is a mistake, please reply to this email, and we will look into the matter.</p>
                                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
                                    <p style="color: #666; font-size: 14px; margin: 0;">Best regards,<br><strong>OAHelper Team</strong></p>
                                </div>
                            </div>
                        </div>
                    ';
                    
                    $mail->send();
                    
                    echo json_encode([
                        "status" => "success",
                        "message" => "Ban notification email sent successfully"
                    ]);
                } catch (PHPMailerException $e) {
                    throw new Exception("Failed to send email: " . $mail->ErrorInfo);
                }
                break;
                
            case 'delete_user':
                if (!isset($input['user_id'])) {
                    throw new Exception("User ID is required");
                }
                
                $userId = $input['user_id'];
                
                // Delete from Users table directly
                $deleted = supabaseDelete('Users', ['id' => 'eq.' . $userId]);
                
                if ($deleted) {
                    echo json_encode([
                        "status" => "success",
                        "message" => "User deleted successfully"
                    ]);
                } else {
                    throw new Exception("Failed to delete user");
                }
                break;
                
            default:
                throw new Exception("Invalid action");
        }
        
    } else {
        throw new Exception("Invalid request method");
    }
    
} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
?>


