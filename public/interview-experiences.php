<?php
// public/interview-experiences.php
// Supabase-only version

// Suppress PHP errors from being output (they break JSON)
error_reporting(0);
ini_set('display_errors', 0);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../db/config.php';

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

// Get action from GET, POST, or JSON body
$action = $_GET['action'] ?? $_POST['action'] ?? '';

// If no action found, try to get it from JSON body
if (empty($action)) {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    if ($data && isset($data['action'])) {
        $action = $data['action'];
    }
}

try {
    switch ($action) {
        case 'submit':
            handleSubmit();
            break;
        
        case 'get_all':
            getAllExperiences();
            break;
        
        case 'get_unverified':
            getUnverifiedExperiences();
            break;
        
        case 'verify_experience':
            verifyExperience();
            break;
        
        case 'delete_experience':
            deleteExperience();
            break;
        
        default:
            echo json_encode([
                'status' => 'error',
                'message' => 'Invalid action'
            ]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}

function handleSubmit() {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $required = ['company', 'role', 'college', 'interview_type', 'result', 'experience', 'user_email'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            echo json_encode([
                'status' => 'error',
                'message' => "Field '$field' is required"
            ]);
            return;
        }
    }
    
    // Validate email format
    if (!filter_var($data['user_email'], FILTER_VALIDATE_EMAIL)) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid email address'
        ]);
        return;
    }
    
    // Prepare data for Supabase
    $experienceData = [
        'company' => $data['company'],
        'role' => $data['role'],
        'college' => $data['college'],
        'interview_date' => $data['interview_date'] ?? null,
        'interview_type' => $data['interview_type'],
        'result' => $data['result'],
        'difficulty' => $data['difficulty'] ?? null,
        'rounds' => $data['rounds'] ?? null,
        'topics_asked' => $data['topics_asked'] ?? null,
        'experience' => $data['experience'],
        'user_email' => $data['user_email'],
        'status' => 'pending'
    ];
    
    $result = supabaseInsertInterviewExperience($experienceData);
    
    if ($result) {
        echo json_encode([
            'status' => 'success',
            'message' => 'Thank you! Your experience is under review. You will earn OACoins once verified.',
            'id' => $result['id']
        ]);
    } else {
        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to submit experience'
        ]);
    }
}

function getAllExperiences() {
    // Get pagination parameters
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
    $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    
    // Ensure valid values
    $limit = max(1, min(50, $limit)); // Between 1 and 50
    $offset = max(0, $offset);
    
    // Get total count
    $totalCount = supabaseCountInterviewExperiences('approved', $search ?: null);
    
    // Get experiences
    $experiences = supabaseGetInterviewExperiences($limit, $offset, 'approved', $search ?: null);
    
    // Format timestamp for each experience
    foreach ($experiences as &$exp) {
        if (isset($exp['created_at'])) {
            $exp['timestamp'] = date('d M Y', strtotime($exp['created_at']));
        }
    }
    
    echo json_encode([
        'status' => 'success',
        'data' => $experiences,
        'count' => count($experiences),
        'total' => $totalCount,
        'offset' => $offset,
        'limit' => $limit,
        'hasMore' => ($offset + $limit) < $totalCount,
        'search' => $search
    ]);
}

function getUnverifiedExperiences() {
    $experiences = supabaseGetInterviewExperiences(100, 0, 'pending', null);
    
    echo json_encode([
        'status' => 'success',
        'data' => $experiences,
        'count' => count($experiences)
    ]);
}

function verifyExperience() {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['experience_id'])) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Experience ID is required'
        ]);
        return;
    }
    
    // Get experience data
    $experience = supabaseGetInterviewExperienceById((int)$data['experience_id']);
    
    if (!$experience || empty($experience['user_email'])) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Experience not found or no user email associated'
        ]);
        return;
    }
    
    // Update experience as approved
    $updateSuccess = supabaseUpdateInterviewExperience((int)$data['experience_id'], ['status' => 'approved']);
    
    if (!$updateSuccess) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to verify experience'
        ]);
        return;
    }
    
    // If OACoins amount is provided, add coins to user
    if (isset($data['oacoins_amount']) && $data['oacoins_amount'] > 0) {
        $oacoins_amount = intval($data['oacoins_amount']);
        
        // Get user details from email using Supabase profiles
        $user = supabaseGetProfileByEmail($experience['user_email']);
        
        if ($user) {
            $userId = $user['mysql_user_id'] ?? null;
            $userUuid = $user['id'];
            $currentCoins = $user['oacoins'] ?? 0;
            $newBalance = $currentCoins + $oacoins_amount;
            
            // Update user's OACoins in profiles
            supabaseUpdateProfile($userUuid, ['oacoins' => $newBalance]);
            
            // Record transaction
            if ($userId) {
                supabaseInsertOacoinsTransaction(
                    $userId,
                    $oacoins_amount,
                    'credit',
                    'Interview experience verification reward',
                    $newBalance
                );
            }
            
            // Send email notification
            try {
                $mail = getMailer();
                $mail->addAddress($user['email'], $user['name']);
                $mail->isHTML(true);
                $mail->Subject = 'Interview Experience Verified - OACoins Reward - OAHelper';
                $mail->Body = "
                    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
                        <div style='text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;'>
                            <h1 style='margin: 0; font-size: 28px;'>🎉 Interview Experience Verified!</h1>
                        </div>
                        <div style='background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;'>
                            <p style='font-size: 16px; color: #333; margin-bottom: 20px;'>Hi <strong>{$user['name']}</strong>,</p>
                            <p style='font-size: 16px; color: #333; line-height: 1.5; margin-bottom: 20px;'>
                                Thank you for contributing to the OAHelper community! Your interview experience submission has been verified and approved.
                            </p>
                            <div style='background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;'>
                                <h3 style='margin: 0 0 15px 0; color: #10b981;'>Verified Submission</h3>
                                <p style='margin: 5px 0;'><strong>Company:</strong> {$experience['company']}</p>
                                <p style='margin: 5px 0;'><strong>College:</strong> {$experience['college']}</p>
                                " . (!empty($experience['role']) ? "<p style='margin: 5px 0;'><strong>Role:</strong> {$experience['role']}</p>" : "") . "
                            </div>
                            <div style='background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;'>
                                <h3 style='margin: 0 0 10px 0; color: white;'>💰 OACoins Reward</h3>
                                <p style='font-size: 32px; font-weight: bold; color: white; margin: 10px 0;'>+{$oacoins_amount} OACoins</p>
                                <p style='margin: 5px 0; color: white;'><strong>New Balance:</strong> {$newBalance} OACoins</p>
                            </div>
                            <p style='font-size: 14px; color: #666; line-height: 1.5; margin-top: 20px;'>
                                Your contribution helps students across India prepare better for placements. You can use your OACoins to purchase premium plans or extend your subscription.
                            </p>
                            <div style='text-align: center; margin: 30px 0;'>
                                <a href='https://oahelper.in/premium' style='display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-right: 10px;'>Use OACoins</a>
                                <a href='https://oahelper.in/interview-experiences' style='display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: 500;'>View Experiences</a>
                            </div>
                        </div>
                    </div>";
                $mail->send();
            } catch (Exception $e) {
                error_log("Mailer Error: " . $e->getMessage());
            }
            
            echo json_encode([
                'status' => 'success',
                'message' => "Experience verified successfully and {$oacoins_amount} OACoins added to user account"
            ]);
        } else {
            echo json_encode([
                'status' => 'success',
                'message' => 'Experience verified successfully but user not found for OACoins reward'
            ]);
        }
    } else {
        echo json_encode([
            'status' => 'success',
            'message' => 'Experience verified successfully'
        ]);
    }
}

function deleteExperience() {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['experience_id'])) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Experience ID is required'
        ]);
        return;
    }
    
    $success = supabaseDeleteInterviewExperience((int)$data['experience_id']);
    
    if ($success) {
        echo json_encode([
            'status' => 'success',
            'message' => 'Experience deleted successfully'
        ]);
    } else {
        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to delete experience'
        ]);
    }
}
?>
