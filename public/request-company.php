<?php
// public/request-company.php
// Supabase version

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/../db/config.php';
require_once __DIR__ . '/../db/supabase_client.php';

setCorsHeaders();

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
    $mail->setFrom('support@oahelper.in', 'OA Helper');
    return $mail;
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

validateApiKey();

function sendCompanyRequestNotification($company_name, $user_email, $user_id, $request_id) {
    try {
        $mail = getMailer();
        $mail->addAddress('saktawatshyam@gmail.com', 'Admin');
        $mail->Subject = 'New Company Request - OA Helper';
        $mail->isHTML(true);
        $mail->Body = "
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                <div style='background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;'>
                    <h1 style='color: white; margin: 0;'>New Company Request</h1>
                </div>
                <div style='padding: 30px; background: #fff;'>
                    <p><strong>Company:</strong> " . htmlspecialchars($company_name) . "</p>
                    <p><strong>User Email:</strong> " . htmlspecialchars($user_email) . "</p>
                    <p><strong>Request ID:</strong> #" . $request_id . "</p>
                    <p><strong>Requested At:</strong> " . date('Y-m-d H:i:s') . "</p>
                    <div style='text-align: center; margin: 30px 0;'>
                        <a href='https://oahelper.in/admin' style='background: #f97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px;'>Open Admin Panel</a>
                    </div>
                </div>
            </div>";
        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Failed to send company request notification: " . $e->getMessage());
        return false;
    }
}

function sendCompanyApprovalNotification($company_name, $user_email, $request_id, $approval_type = 'new_questions') {
    try {
        $mail = getMailer();
        $mail->addAddress($user_email, 'User');
        $mail->isHTML(true);
        
        if ($approval_type === 'no_new_questions') {
            $mail->Subject = 'Company Request Update - OA Helper';
            $mail->Body = "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                    <div style='background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;'>
                        <h1 style='color: white; margin: 0;'>Company Request Update</h1>
                    </div>
                    <div style='padding: 30px; background: #fff;'>
                        <p>Thank you for your request for <strong>" . htmlspecialchars($company_name) . "</strong>.</p>
                        <p>We were not able to find any new questions for this company at this time.</p>
                        <p>You can still check out existing questions from this company on our platform!</p>
                        <div style='text-align: center; margin: 30px 0;'>
                            <a href='https://oahelper.in/questions?company=" . urlencode($company_name) . "' style='background: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px;'>Browse Questions</a>
                        </div>
                    </div>
                </div>";
        } else {
            $mail->Subject = 'Company Added Successfully - OA Helper';
            $mail->Body = "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                    <div style='background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;'>
                        <h1 style='color: white; margin: 0;'>🎉 Company Added!</h1>
                    </div>
                    <div style='padding: 30px; background: #fff;'>
                        <p>Great news! <strong>" . htmlspecialchars($company_name) . "</strong> has been added to our platform!</p>
                        <div style='text-align: center; margin: 30px 0;'>
                            <a href='https://oahelper.in/questions?company=" . urlencode($company_name) . "' style='background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px;'>Browse Questions</a>
                        </div>
                    </div>
                </div>";
        }
        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Failed to send approval notification: " . $e->getMessage());
        return false;
    }
}

function sendCompanyRejectionNotification($company_name, $user_email, $request_id) {
    try {
        $mail = getMailer();
        $mail->addAddress($user_email, 'User');
        $mail->isHTML(true);
        $mail->Subject = 'Update on your Company Request - OA Helper';
        $mail->Body = "
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                <div style='background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;'>
                    <h1 style='color: white; margin: 0;'>Company Request Update</h1>
                </div>
                <div style='padding: 30px; background: #fff;'>
                    <p>Regarding your request for <strong>" . htmlspecialchars($company_name) . "</strong>:</p>
                    <p>We were not able to find questions for this company at this time. We'll try again in the future.</p>
                    <div style='text-align: center; margin: 30px 0;'>
                        <a href='https://oahelper.in' style='background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px;'>Back to Home</a>
                    </div>
                </div>
            </div>";
        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Failed to send rejection notification: " . $e->getMessage());
        return false;
    }
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['company_name']) || empty(trim($input['company_name']))) {
            throw new Exception("Company name is required");
        }
        
        $company_name = trim($input['company_name']);
        $user_email = $input['user_email'] ?? null;
        $user_id = $input['user_id'] ?? null;
        
        // Check if company already exists
        $existingCompany = supabaseGetCompanyByName($company_name);
        
        if ($existingCompany) {
            $questionCount = supabaseCountQuestions((int)$existingCompany['id']);
            echo json_encode([
                "status" => "found",
                "message" => "Company already exists!",
                "company" => [
                    'id' => $existingCompany['id'],
                    'name' => $existingCompany['name'],
                    'question_count' => $questionCount
                ]
            ]);
            exit();
        }
        
        // Check if already requested
        $existingRequest = supabaseSelect('company_requests', [
            'company_name' => 'ilike.' . $company_name,
            'order' => 'requested_at.desc',
            'limit' => 1
        ], '*', true);
        
        if ($existingRequest) {
            echo json_encode([
                "status" => "already_requested",
                "message" => "This company has already been requested!",
                "request" => $existingRequest
            ]);
            exit();
        }
        
        // Create new request
        $payload = [
            'company_name' => $company_name,
            'user_email' => $user_email,
            'user_id' => $user_id,
            'status' => 'pending',
            'requested_at' => gmdate('c')
        ];
        
        $response = supabaseRequest('POST', '/rest/v1/company_requests', [], $payload, ['Prefer: return=representation']);
        
        if ($response['success'] && !empty($response['data'])) {
            $newRequest = is_array($response['data']) ? ($response['data'][0] ?? $response['data']) : null;
            $request_id = $newRequest['id'] ?? 0;
            
            $emailSent = sendCompanyRequestNotification($company_name, $user_email, $user_id, $request_id);
            
            echo json_encode([
                "status" => "success",
                "message" => "Company request submitted successfully!",
                "request_id" => $request_id,
                "email_sent" => $emailSent
            ]);
        } else {
            throw new Exception("Failed to submit company request");
        }
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (isset($_GET['action']) && $_GET['action'] === 'get_requests') {
            $requests = supabaseSelect('company_requests', ['order' => 'requested_at.desc']);
            
            echo json_encode([
                "status" => "success",
                "data" => $requests ?: []
            ]);
            
        } elseif (isset($_GET['check']) && isset($_GET['company'])) {
            $company_name = trim($_GET['company']);
            $company = supabaseGetCompanyByName($company_name);
            
            if ($company) {
                $questionCount = supabaseCountQuestions((int)$company['id']);
                echo json_encode([
                    "status" => "found",
                    "company" => [
                        'id' => $company['id'],
                        'name' => $company['name'],
                        'question_count' => $questionCount
                    ]
                ]);
            } else {
                echo json_encode([
                    "status" => "not_found",
                    "message" => "Company not found"
                ]);
            }
        } else {
            throw new Exception("Invalid GET request parameters");
        }
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['action']) || !isset($input['request_id'])) {
            throw new Exception("Action and request_id are required");
        }
        
        if ($input['action'] === 'update_status') {
            $status = $input['status'] ?? '';
            $admin_notes = $input['admin_notes'] ?? null;
            $approval_type = $input['approval_type'] ?? 'new_questions';
            $request_id = (int)$input['request_id'];
            
            $updateData = [
                'status' => $status,
                'admin_notes' => $admin_notes,
                'processed_at' => gmdate('c')
            ];
            
            if (supabasePatch('company_requests', ['id' => 'eq.' . $request_id], $updateData)) {
                // Send notification
                if ($status === 'approved' || $status === 'rejected') {
                    $request = supabaseSelect('company_requests', ['id' => 'eq.' . $request_id], '*', true);
                    if ($request && !empty($request['user_email'])) {
                        if ($status === 'approved') {
                            sendCompanyApprovalNotification($request['company_name'], $request['user_email'], $request_id, $approval_type);
                        } else {
                            sendCompanyRejectionNotification($request['company_name'], $request['user_email'], $request_id);
                        }
                    }
                }
                
                echo json_encode([
                    "status" => "success",
                    "message" => "Company request status updated successfully"
                ]);
            } else {
                throw new Exception("Failed to update company request");
            }
        } else {
            throw new Exception("Invalid action for PUT request");
        }
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['action']) || $input['action'] !== 'delete' || !isset($input['request_id'])) {
            throw new Exception("Invalid delete request");
        }
        
        $request_id = (int)$input['request_id'];
        
        if (supabaseDelete('company_requests', ['id' => 'eq.' . $request_id])) {
            echo json_encode([
                "status" => "success",
                "message" => "Company request deleted successfully"
            ]);
        } else {
            throw new Exception("Failed to delete company request");
        }
        
    } else {
        throw new Exception("Invalid request method");
    }
    
} catch (Exception $e) {
    error_log("Error in request-company.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
?>
