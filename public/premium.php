<?php

// Include database configuration first to get CORS functions
require_once __DIR__ . '/../db/config.php';
require_once __DIR__ . '/../db/supabase_client.php';

// Set CORS headers based on environment
setCorsHeaders();
// premium.php - API for premium subscription functionality

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Validate API key
validateApiKey();

require_once __DIR__ . '/phpmailer/src/Exception.php';
require_once __DIR__ . '/phpmailer/src/PHPMailer.php';
require_once __DIR__ . '/phpmailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// require_once '../db/config.php'; // Already included

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

function sendJsonResponse($status, $message, $data = null) {
    echo json_encode([
        "status" => $status,
        "message" => $message,
        "data" => $data
    ]);
    exit();
}

function getUserPremiumStatus($user_id) {
    // user_id should be the integer ID from Users table
    // If it's a string that looks like UUID, try to find user by email or just use as-is
    $legacy_id = $user_id;
    if (is_string($user_id) && !is_numeric($user_id)) {
        // Might be an email or UUID - try to get user
        $user = supabaseGetUserByEmail($user_id);
        if ($user) {
            $legacy_id = $user['id'];
        } else {
            return null;
        }
    }

    // Use current UTC timestamp for comparison (PostgREST doesn't support 'now')
    $now = gmdate('c');
    
    $filters = [
        'user_id' => 'eq.' . $legacy_id,
        'status' => 'eq.active',
        'end_date' => 'gt.' . $now,
        'order' => 'end_date.desc'
    ];
    
    $subscriptions = supabaseSelect('premium_subscriptions', $filters, '*', false);
    
    // Check if we got an error or empty array
    if ($subscriptions && is_array($subscriptions) && count($subscriptions) > 0) {
        return $subscriptions[0];
    }
    return null;
}

// Get subscription type and daily solution limit based on amount and plan_type
function getPlanDetails($amount, $plan_type = null) {
    $amount = (float)$amount;
    
    // If plan_type is provided, use it directly
    if ($plan_type) {
        $plan_type = strtolower($plan_type);
        if ($plan_type === 'yearly') {
            return ['type' => 'yearly', 'daily_limit' => -1, 'name' => 'Yearly Plan', 'duration' => '+1 year'];
        } elseif ($plan_type === 'unlimited') {
            return ['type' => 'unlimited', 'daily_limit' => -1, 'name' => 'Unlimited Plan', 'duration' => '+45 days'];
        } elseif ($plan_type === 'pro') {
            return ['type' => 'pro', 'daily_limit' => 15, 'name' => 'Pro Plan', 'duration' => '+30 days'];
        } elseif ($plan_type === 'basic') {
            return ['type' => 'basic', 'daily_limit' => 5, 'name' => 'Basic Plan', 'duration' => '+30 days'];
        }
    }
    
    // Fallback to amount-based detection
    if ($amount >= 999) {
        return ['type' => 'yearly', 'daily_limit' => -1, 'name' => 'Yearly Plan', 'duration' => '+1 year'];
    } elseif ($amount >= 299) {
        return ['type' => 'unlimited', 'daily_limit' => -1, 'name' => 'Unlimited Plan', 'duration' => '+45 days'];
    } elseif ($amount >= 199) {
        return ['type' => 'pro', 'daily_limit' => 15, 'name' => 'Pro Plan', 'duration' => '+30 days'];
    } else {
        return ['type' => 'basic', 'daily_limit' => 5, 'name' => 'Basic Plan', 'duration' => '+30 days'];
    }
}

function getUserQuestionAccess($user_id, $company_id) {
    // We only rely on Supabase now for user_question_access
    $count = supabaseGetUserQuestionAccess($user_id, $company_id, 1);
    return (int)$count;
}

function updateQuestionAccess($user_id, $company_id, $questions_accessed) {
    // Only update Supabase
    $updated = supabaseUpdateUserQuestionAccess($user_id, $company_id, (int)$questions_accessed);
    return $updated;
}

try {
    $action = isset($_GET['action']) ? $_GET['action'] : '';
    
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            if ($action === 'check_premium_status') {
                if (!isset($_GET['user_id'])) {
                    sendJsonResponse("error", "User ID is required");
                }
                
                $user_id = $_GET['user_id']; // Don't cast to int yet, might be UUID
                $premium_status = getUserPremiumStatus($user_id);
                
                sendJsonResponse("success", "Premium status retrieved", [
                    'is_premium' => $premium_status !== null,
                    'subscription' => $premium_status
                ]);
                
            } elseif ($action === 'check_question_access') {
                if (!isset($_GET['user_id']) || !isset($_GET['company_id'])) {
                    sendJsonResponse("error", "User ID and Company ID are required");
                }
                
                $user_id = $_GET['user_id'];
                $company_id = (int)$_GET['company_id'];
                
                $premium_status = getUserPremiumStatus($user_id);
                $is_premium = $premium_status !== null;
                
                // If user_id is UUID, we need numeric ID for user_question_access or use UUID there too?
                // The tables were altered to use TEXT for user_id, so we can pass UUID or int string.
                $questions_accessed = getUserQuestionAccess($user_id, $company_id);
                
                sendJsonResponse("success", "Question access retrieved", [
                    'is_premium' => $is_premium,
                    'questions_accessed' => $questions_accessed,
                    'can_access_all' => $is_premium
                ]);
                
            } elseif ($action === 'get_payment_requests') {
                // Admin function to get all payment requests
                // Fetch from Supabase payment_requests table (needs migration)
                // For now, we still write to MySQL in submit_payment, so we might need to fetch from MySQL 
                // BUT user query says "move the remaining to supabase". 
                // So we should assume we need to use Supabase for payment_requests too.
                
                $requests = supabaseSelect('payment_requests', ['order' => 'submitted_at.desc']);
                
                if ($requests === false) {
                     // Fallback or error? Assuming migration happened.
                     $requests = []; 
                }
                
                sendJsonResponse("success", "Payment requests retrieved", $requests);
            }
            elseif ($action === 'get_premium_users') {
                // Fetch active subscriptions from Supabase
                $subs = supabaseSelect('premium_subscriptions', [
                    'status' => 'eq.active',
                    'order' => 'end_date.desc'
                ]);
                
                if ($subs === false) {
                    throw new Exception("Failed to fetch premium users");
                }
                
                // Collect user IDs to fetch from Users table
                $userIds = array_column($subs, 'user_id');
                $users = [];
                
                if (!empty($userIds)) {
                    // Fetch all users from Users table
                    $allUsers = supabaseSelect('Users', []);
                    $userMap = [];
                    if ($allUsers) {
                        foreach ($allUsers as $u) {
                            $userMap[$u['id']] = $u;
                        }
                    }
                    
                    foreach ($subs as $sub) {
                        $uid = $sub['user_id'];
                        if (isset($userMap[$uid])) {
                            $sub['user_name'] = $userMap[$uid]['name'];
                            $sub['user_email'] = $userMap[$uid]['email'];
                        } else {
                            $sub['user_name'] = 'Unknown';
                            $sub['user_email'] = 'Unknown';
                        }
                        $users[] = $sub;
                    }
                }
                
                sendJsonResponse("success", "Premium users retrieved", $users);
            }
            elseif ($action === 'get_premium_stats') {
                // Admin function to get premium subscription stats
                $subscriptions = supabaseSelect('premium_subscriptions', ['status' => 'eq.active']);
                
                if ($subscriptions === false) {
                    throw new Exception("Failed to fetch premium stats");
                }

                $total_revenue = 0;
                $plan_breakdown = [
                    'basic' => ['count' => 0, 'revenue' => 0],
                    'pro' => ['count' => 0, 'revenue' => 0],
                    'unlimited' => ['count' => 0, 'revenue' => 0],
                    'yearly' => ['count' => 0, 'revenue' => 0]
                ];
                $monthly_stats = [];
                $daily_stats = [];
                $processed_users = [];

                foreach ($subscriptions as $row) {
                    $processed_users[$row['user_id']] = true;
                    $total_revenue += $row['amount'];
                    
                    $plan_type = $row['subscription_type'];
                    if (empty($plan_type)) {
                        $plan_details = getPlanDetails($row['amount'], null);
                        $plan_type = $plan_details['type'];
                    }

                    if (isset($plan_breakdown[$plan_type])) {
                        $plan_breakdown[$plan_type]['count']++;
                        $plan_breakdown[$plan_type]['revenue'] += $row['amount'];
                    }
                    
                    // Date processing
                    $created_date = $row['created_at'] ? date('Y-m-d', strtotime($row['created_at'])) : date('Y-m-d');
                    $month_key = date('Y-m', strtotime($created_date));
                    
                    // Monthly Stats
                    if (!isset($monthly_stats[$month_key])) {
                        $monthly_stats[$month_key] = ['count' => 0, 'revenue' => 0];
                    }
                    $monthly_stats[$month_key]['count']++;
                    $monthly_stats[$month_key]['revenue'] += $row['amount'];
                    
                    // Daily Stats with Type Breakdown
                    if (!isset($daily_stats[$created_date])) {
                        $daily_stats[$created_date] = [
                            'count' => 0, 
                            'revenue' => 0,
                            'types' => [
                                'basic' => 0, 'pro' => 0, 'unlimited' => 0, 'yearly' => 0
                            ]
                        ];
                    }
                    $daily_stats[$created_date]['count']++;
                    $daily_stats[$created_date]['revenue'] += $row['amount'];
                    if (isset($daily_stats[$created_date]['types'][$plan_type])) {
                        $daily_stats[$created_date]['types'][$plan_type]++;
                    }
                }
                
                // Sort stats by date (newest first)
                krsort($monthly_stats);
                krsort($daily_stats);
                
                sendJsonResponse("success", "Premium stats retrieved", [
                    'total_subscribers' => count($processed_users),
                    'total_revenue' => $total_revenue,
                    'plan_breakdown' => $plan_breakdown,
                    'monthly_stats' => $monthly_stats,
                    'daily_stats' => $daily_stats
                ]);
            }
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            
            // For POST requests, action can come from body or query string
            if (empty($action) && isset($input['action'])) {
                $action = $input['action'];
            }
            
            if ($action === 'submit_payment') {
                $required_fields = ['user_id', 'user_email', 'user_name', 'amount', 'payment_method'];
                foreach ($required_fields as $field) {
                    if (!isset($input[$field]) || empty($input[$field])) {
                        sendJsonResponse("error", "Missing required field: $field");
                    }
                }
                
                $user_id = $input['user_id'];
                $user_email = $input['user_email'];
                $user_name = $input['user_name'];
                $amount = (float)$input['amount'];
                $payment_method = $input['payment_method'];
                $plan_type = $input['plan_type'] ?? null;
                $utr_number = $input['utr_number'] ?? null;
                $payment_details = $input['payment_details'] ?? null;
                $payment_screenshot = $input['payment_screenshot'] ?? null;
                $auto_approve = isset($input['auto_approve']) && $input['auto_approve'] === true;
                
                $initial_status = $auto_approve ? 'approved' : 'pending';
                
                // user_id should be integer from Users table
                $legacy_id = $user_id;
                if (is_string($user_id) && !is_numeric($user_id)) {
                    // Might be email - lookup user
                    $userRecord = supabaseGetUserByEmail($user_id);
                    if ($userRecord) {
                        $legacy_id = $userRecord['id'];
                    }
                }
                
                // Insert into Supabase payment_requests
                $payload = [
                    'user_id' => $legacy_id,
                    'user_email' => $user_email,
                    'user_name' => $user_name,
                    'amount' => $amount,
                    'payment_method' => $payment_method,
                    'plan_type' => $plan_type,
                    'utr_number' => $utr_number,
                    'payment_details' => $payment_details,
                    'payment_screenshot' => $payment_screenshot,
                    'status' => $initial_status,
                    'submitted_at' => gmdate('c')
                ];
                
                if (supabaseInsert('payment_requests', $payload)) {
                    // We need the ID for auto-approve logic if we want to update it later, 
                    // but supabaseInsert doesn't return ID easily.
                    // However, for auto_approve, we just create the subscription immediately.
                    
                    if ($auto_approve) {
                        $plan_details = getPlanDetails($amount, $plan_type);
                        $start_date = gmdate('c');
                        // Fix: Calculate end_date relative to now, not from epoch
                        $end_date = date('c', strtotime($plan_details['duration'], time()));
                        
                        // premium_subscriptions.user_id is INTEGER, so use legacy_id
                        // Insert into Supabase premium_subscriptions
                        $subPayload = [
                            'user_id' => (int)$legacy_id,
                            'subscription_type' => $plan_details['type'],
                            'amount' => $amount,
                            'status' => 'active',
                            'start_date' => $start_date,
                            'end_date' => $end_date,
                            'created_at' => $start_date,
                            'updated_at' => $start_date
                        ];
                        
                        $inserted = supabaseInsert('premium_subscriptions', $subPayload);
                        if (!$inserted) {
                            error_log("Failed to insert premium subscription for auto-approved payment. User: $legacy_id, Amount: $amount, Plan: " . json_encode($subPayload));
                        } else {
                            error_log("Premium subscription created successfully for user: $legacy_id, Plan: {$plan_details['type']}, End: $end_date");
                        }
                        
                        // Mark payment as processed (requires fetching the record ID or just inserting with processed fields first)
                        // Since we can't easily update the just-inserted row without ID, we assume the 'approved' status is enough.
                    }
                    
                    // Send confirmation email
                    try {
                        $mail = getMailer();
                        $mail->addAddress($user_email, $user_name);
                        $mail->isHTML(true);
                        $mail->Subject = 'Welcome to OA Helper Premium - Your Subscription is Active';
                        $mail->Body = "
                            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
                                <div style='text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;'>
                                    <h1 style='margin: 0; font-size: 28px;'>Welcome to OAHelper!</h1>
                                </div>
                                <div style='background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;'>
                                    <p style='font-size: 16px; color: #333; margin-bottom: 20px;'>Hi <strong>{$user_name}</strong>,</p>
                                    <p style='font-size: 16px; color: #333; line-height: 1.5; margin-bottom: 30px;'>
                                        <strong>Congratulations!</strong> Your payment has been verified and your Premium subscription is now active.
                                    </p>
                                    <div style='text-align: center; margin: 30px 0;'>
                                        <a href='https://oahelper.in/dashboard' style='display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: 500;'>Access Premium Features</a>
                                    </div>
                                </div>
                            </div>";
                        $mail->send();
                    } catch (Exception $e) {
                        error_log("Mailer Error (User): " . $e->getMessage());
                    }

                    // Send admin notification for auto-approved payments
                    if ($auto_approve) {
                        try {
                            $mail_admin = getMailer();
                            $mail_admin->addAddress('cphelper12@gmail.com', 'Admin');
                            $mail_admin->isHTML(true);
                            $mail_admin->Subject = 'Payment Auto-Approved - Premium Activated';
                            $mail_admin->Body = "
                                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
                                    <div style='text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;'>
                                        <h1 style='margin: 0; font-size: 28px;'>Payment Auto-Approved</h1>
                                    </div>
                                    <div style='background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;'>
                                        <p>A payment has been automatically approved and a premium subscription has been activated for user: <strong>{$user_name}</strong> ({$user_email}).</p>
                                    </div>
                                </div>";
                            $mail_admin->send();
                        } catch (Exception $e) {
                            error_log("Mailer Error (Admin): " . $e->getMessage());
                        }
                    }
                    
                    $message = $auto_approve
                        ? "Payment verified automatically. Premium subscription activated instantly!"
                        : "Payment request submitted successfully";
                    
                    sendJsonResponse("success", $message, ['auto_approved' => $auto_approve]);
                } else {
                    sendJsonResponse("error", "Failed to submit payment request");
                }
                
            } elseif ($action === 'manual_activate') {
                $email = isset($input['email']) ? trim(strtolower($input['email'])) : '';
                $start_date_raw = $input['start_date'] ?? '';
                $end_date_raw = $input['end_date'] ?? '';
                $plan_type = isset($input['plan_type']) ? strtolower(trim($input['plan_type'])) : 'custom';
                $amount = isset($input['amount']) && $input['amount'] !== '' ? (float)$input['amount'] : 0;
                $notes = isset($input['notes']) ? trim($input['notes']) : '';
                $replace_existing = isset($input['replace_existing']) ? filter_var($input['replace_existing'], FILTER_VALIDATE_BOOLEAN) : true;
                
                if (empty($email) || empty($start_date_raw) || empty($end_date_raw)) {
                    sendJsonResponse("error", "Email, start date, and end date are required");
                }
                
                $validPlans = ['basic', 'pro', 'unlimited', 'yearly', 'custom'];
                if (!in_array($plan_type, $validPlans)) {
                    $plan_type = 'custom';
                }
                
                $start_timestamp = strtotime($start_date_raw);
                $end_timestamp = strtotime($end_date_raw);
                
                if (!$start_timestamp || !$end_timestamp) {
                    sendJsonResponse("error", "Invalid start or end date");
                }
                
                if ($end_timestamp <= $start_timestamp) {
                    sendJsonResponse("error", "End date must be after start date");
                }
                
                if ($amount < 0) {
                    sendJsonResponse("error", "Amount cannot be negative");
                }
                
                // Lookup user in Users table
                error_log("Manual premium activation - Looking up user: " . $email);
                $userRecord = supabaseGetUserByEmail($email);
                
                if (!$userRecord) {
                    error_log("Manual premium activation - User not found: " . $email);
                    sendJsonResponse("error", "No user found with the provided email address");
                }
                
                error_log("Manual premium activation - Found user: " . json_encode($userRecord));
                
                $user = [
                    'id' => $userRecord['id'],
                    'name' => $userRecord['name'],
                    'email' => $userRecord['email']
                ];
                
                if ($replace_existing) {
                    // Update Supabase subscriptions
                    supabasePatch('premium_subscriptions', 
                        ['user_id' => 'eq.' . $user['id'], 'status' => 'eq.active'], 
                        ['status' => 'canceled', 'updated_at' => gmdate('c')]
                    );
                }
                
                $start_date = date('c', $start_timestamp);
                $end_date = date('c', $end_timestamp);
                
                $payload = [
                    'user_id' => (int)$user['id'],
                    'subscription_type' => $plan_type,
                    'amount' => $amount,
                    'status' => 'active',
                    'start_date' => $start_date,
                    'end_date' => $end_date,
                    'created_at' => gmdate('c'),
                    'updated_at' => gmdate('c')
                ];
                
                error_log("Manual premium activation - Payload: " . json_encode($payload));
                $inserted = supabaseInsert('premium_subscriptions', $payload);
                error_log("Manual premium activation - Insert result: " . ($inserted ? 'success' : 'failed'));
                
                if ($inserted) {
                    // We don't get insert_id easily from REST unless we select back or return=representation.
                    // But we don't strictly need it for email unless we want to log it.
                    $subscription_id = 0; // Placeholder
                    
                    try {
                        $mail = getMailer();
                        $mail->addAddress($user['email'], $user['name']);
                        $mail->isHTML(true);
                        $mail->Subject = 'Premium Subscription Activated - OAHelper';
                        $friendly_start = date('F j, Y g:i A', $start_timestamp);
                        $friendly_end = date('F j, Y g:i A', $end_timestamp);
                        
                        $notes_block = '';
                        if (!empty($notes)) {
                            $notes_block = "<p style='margin: 10px 0;'><strong>Message from Admin:</strong><br />" . nl2br(htmlspecialchars($notes)) . "</p>";
                        }
                        
                        $mail->Body = "
                            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
                                <div style='text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;'>
                                    <h1 style='margin: 0; font-size: 26px;'>Your Premium Access is Live</h1>
                                </div>
                                <div style='background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;'>
                                    <p style='font-size: 16px; color: #333;'>Hi <strong>{$user['name']}</strong>,</p>
                                    <p style='font-size: 15px; color: #333; line-height: 1.6;'>
                                        We have manually activated a premium subscription on your account.
                                    </p>
                                    <div style='background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;'>
                                        <p style='margin: 8px 0;'><strong>Plan Type:</strong> " . strtoupper($plan_type) . "</p>
                                        <p style='margin: 8px 0;'><strong>Valid From:</strong> {$friendly_start}</p>
                                        <p style='margin: 8px 0;'><strong>Valid Till:</strong> {$friendly_end}</p>
                                        <p style='margin: 8px 0;'><strong>Amount Recorded:</strong> ₹" . number_format($amount, 2) . "</p>
                                    </div>
                                    {$notes_block}
                                    <p style='font-size: 14px; color: #555;'>If you have any questions, feel free to reply to this email.</p>
                                </div>
                            </div>";
                        $mail->send();
                    } catch (Exception $e) {
                        error_log("Mailer Error (Manual Premium): " . $e->getMessage());
                    }
                    
                    sendJsonResponse("success", "Premium subscription activated successfully", [
                        'subscription_id' => $subscription_id,
                        'user_id' => $user['id'],
                        'start_date' => $start_date,
                        'end_date' => $end_date
                    ]);
                } else {
                    sendJsonResponse("error", "Failed to create premium subscription");
                }
                
            } elseif ($action === 'update_question_access') {
                if (!isset($input['user_id']) || !isset($input['company_id'])) {
                    sendJsonResponse("error", "User ID and Company ID are required");
                }
                
                $user_id = (int)$input['user_id'];
                $company_id = (int)$input['company_id'];
                $current_access = getUserQuestionAccess($user_id, $company_id);
                $new_access = $current_access + 1;
                
                if (updateQuestionAccess($user_id, $company_id, $new_access)) {
                    sendJsonResponse("success", "Question access updated", ['questions_accessed' => $new_access]);
                } else {
                    sendJsonResponse("error", "Failed to update question access");
                }

            } elseif ($action === 'delete_payment') {
                $input = json_decode(file_get_contents('php://input'), true);
                $request_id = (int)$input['request_id'];
                
                // Assuming payment_requests is migrated to Supabase or we are using legacy table for now.
                // If legacy table is still used:
                // We'll stick to legacy MySQL table for payment_requests deletion until full migration
                // But previous steps assumed Supabase for payment_requests INSERT. 
                // Let's use supabaseDelete.
                
                if (supabaseDelete('payment_requests', ['id' => 'eq.' . $request_id])) {
                    sendJsonResponse("success", "Payment request deleted successfully");
                } else {
                    sendJsonResponse("error", "Failed to delete payment request");
                }
            }
            elseif ($action === 'cancel_subscription') {
                $input = json_decode(file_get_contents('php://input'), true);
                $subscription_id = (int)$input['subscription_id'];

                // Update Supabase
                // Note: subscription_id in Supabase might be different if data was migrated but IDs preserved.
                // Assuming ID preserved.
                
                $updated = supabasePatch('premium_subscriptions', 
                    ['id' => 'eq.' . $subscription_id], 
                    ['status' => 'canceled', 'updated_at' => gmdate('c')]
                );

                if ($updated) {
                    sendJsonResponse("success", "Subscription canceled successfully");
                } else {
                    sendJsonResponse("error", "Failed to cancel subscription");
                }
            }
            break;
            
        case 'PUT':
            // The action for PUT requests should also be taken from the query string
            if ($action === 'update_payment_status') {
                $input = json_decode(file_get_contents('php://input'), true);

                $required_fields = ['request_id', 'status'];
                foreach ($required_fields as $field) {
                    if (!isset($input[$field])) {
                        sendJsonResponse("error", "Missing required field: $field");
                    }
                }
                
                $request_id = (int)$input['request_id'];
                $status = $input['status'];
                $admin_notes = $input['admin_notes'] ?? null;
                
                // Update Supabase payment_requests
                $updateData = [
                    'status' => $status,
                    'admin_notes' => $admin_notes,
                    'processed_at' => gmdate('c'),
                    'processed_by' => 'admin'
                ];
                
                if (supabasePatch('payment_requests', ['id' => 'eq.' . $request_id], $updateData)) {
                    // Get payment request details for email
                    $payment = supabaseSelect('payment_requests', ['id' => 'eq.' . $request_id], '*', true);
                    
                    if ($payment) {
                        // If approved, create premium subscription in Supabase
                        if ($status === 'approved') {
                            $amount = $payment['amount'];
                            $plan_type = $payment['plan_type'] ?? null;
                            $plan_details = getPlanDetails($amount, $plan_type);
                            $start_date = gmdate('c');
                            $end_date = date('c', strtotime($plan_details['duration']));
                            
                            $payload = [
                                'user_id' => $payment['user_id'], // Uses legacy ID
                                'subscription_type' => $plan_details['type'],
                                'amount' => $amount,
                                'status' => 'active',
                                'start_date' => $start_date,
                                'end_date' => $end_date,
                                'created_at' => $start_date,
                                'updated_at' => $start_date
                            ];
                            
                            $inserted = supabaseInsert('premium_subscriptions', $payload);
                            if (!$inserted) {
                                error_log("Failed to insert premium subscription for manually approved payment " . $request_id);
                            }
                        }
                        
                        // Send email notification
                        try {
                            $mail = getMailer();
                            $mail->addAddress($payment['user_email'], $payment['user_name']);
                            $mail->isHTML(true);
                            if ($status === 'approved') {
                                $mail->Subject = 'Welcome to OA Helper Premium - Your Subscription is Active';
                                $mail->Body = "
                                    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
                                        <div style='text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;'>
                                            <h1 style='margin: 0; font-size: 28px;'>Welcome to OAHelper!</h1>
                                        </div>
                                        <div style='background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;'>
                                            <p style='font-size: 16px; color: #333; margin-bottom: 20px;'>Hi <strong>{$payment['user_name']}</strong>,</p>
                                            <p style='font-size: 16px; color: #333; line-height: 1.5; margin-bottom: 30px;'>
                                                <strong>Congratulations!</strong> Your payment has been verified and your Premium subscription is now active.
                                            </p>
                                            <div style='text-align: center; margin: 30px 0;'>
                                                <a href='https://oahelper.in/dashboard' style='display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: 500;'>Access Premium Features</a>
                                            </div>
                                        </div>
                                    </div>";
                            } else {
                                $mail->Subject = 'Payment Verification Issue - OA Helper';
                                $mail->Body = "
                                    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
                                        <div style='text-align: center; background: linear-gradient(135deg, #f44336 0%, #b71c1c 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;'>
                                            <h1 style='margin: 0; font-size: 28px;'>Payment Verification Issue</h1>
                                        </div>
                                        <div style='background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;'>
                                            <p style='font-size: 16px; color: #333; margin-bottom: 20px;'>Hi <strong>{$payment['user_name']}</strong>,</p>
                                            <p style='font-size: 16px; color: #333; line-height: 1.5; margin-bottom: 30px;'>
                                                We were unable to verify your payment request. " . (!empty($admin_notes) ? "Reason: <strong>{$admin_notes}</strong>" : "") . "
                                            </p>
                                        </div>
                                    </div>";
                            }
                            $mail->send();
                        } catch (Exception $e) {
                            error_log("Mailer Error (Manual Update): " . $e->getMessage());
                        }
                    }
                    
                    sendJsonResponse("success", "Payment status updated successfully");
                } else {
                    sendJsonResponse("error", "Failed to update payment status");
                }
            }
            break;
            
        default:
            sendJsonResponse("error", "Invalid request method");
            break;
    }
    
} catch (Exception $e) {
    error_log("Premium API error: " . $e->getMessage());
    sendJsonResponse("error", "An error occurred: " . $e->getMessage());
}

?>
