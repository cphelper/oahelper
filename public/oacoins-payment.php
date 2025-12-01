<?php
// public/oacoins-payment.php
// API endpoint for purchasing premium plans with OACoins

require_once __DIR__ . '/../db/config.php';
require_once __DIR__ . '/../db/supabase_client.php';

// Set CORS headers
setCorsHeaders();

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

// Get plan details based on amount
function getPlanDetails($amount) {
    $amount = (float)$amount;
    
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

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendJsonResponse("error", "Invalid request method");
    }

    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    $required_fields = ['user_id', 'amount', 'plan_type'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            sendJsonResponse("error", "Missing required field: $field");
        }
    }
    
    $user_id = $input['user_id'];
    $amount = (int)$input['amount']; // Amount in OACoins (1 coin = 1 rupee)
    $plan_type = $input['plan_type'];
    
    // Get user from Users table
    $user = null;
    if (is_numeric($user_id)) {
        $user = supabaseSelect('Users', ['id' => 'eq.' . $user_id], '*', true);
    } else {
        $user = supabaseGetUserByEmail($user_id);
    }
    
    if (!$user) {
        sendJsonResponse("error", "User not found");
    }
    
    $legacy_id = $user['id'];
    
    try {
        $current_balance = (int)($user['oacoins'] ?? 0);
        $user_email = $user['email'];
        $user_name = $user['name'];
        
        // Check if user has enough coins
        if ($current_balance < $amount) {
            sendJsonResponse("error", "Insufficient OACoins balance", [
                'current_balance' => $current_balance,
                'required' => $amount,
                'shortage' => $amount - $current_balance
            ]);
        }
        
        // Deduct coins from user's balance in Users table
        $new_balance = $current_balance - $amount;
        $updated = supabasePatch('Users', 
            ['id' => 'eq.' . $legacy_id], 
            ['oacoins' => $new_balance, 'updated_at' => gmdate('c')]
        );
        
        if (!$updated) {
            throw new Exception("Failed to deduct coins");
        }
        
        // Get plan details
        $plan_details = getPlanDetails($amount);
        $start_date = gmdate('c');
        $end_date = date('c', strtotime($plan_details['duration'], time()));
        
        // Create premium subscription in Supabase
        $subPayload = [
            'user_id' => $legacy_id,
            'subscription_type' => $plan_details['type'],
            'amount' => $amount,
            'status' => 'active',
            'start_date' => $start_date,
            'end_date' => $end_date,
            'payment_method' => 'oacoins',
            'created_at' => $start_date,
            'updated_at' => $start_date
        ];
        
        $inserted = supabaseInsert('premium_subscriptions', $subPayload);
        if (!$inserted) {
            // Rollback: restore coins
            supabasePatch('Users', 
                ['id' => 'eq.' . $legacy_id], 
                ['oacoins' => $current_balance]
            );
            throw new Exception("Failed to create subscription");
        }
        
        // Log the transaction in Supabase
        $txPayload = [
            'user_id' => $legacy_id,
            'amount' => $amount,
            'transaction_type' => 'debit',
            'description' => "Premium subscription purchase: " . $plan_details['name'],
            'balance_after' => $new_balance,
            'created_at' => $start_date
        ];
        supabaseInsert('oacoins_transactions', $txPayload);
        
        // Send confirmation email
        try {
            $mail = getMailer();
            $mail->addAddress($user_email, $user_name);
            $mail->isHTML(true);
            $mail->Subject = 'Premium Subscription Activated - OAHelper';
            $mail->Body = "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
                    <div style='text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;'>
                        <h1 style='margin: 0; font-size: 28px;'>🎉 Premium Activated!</h1>
                    </div>
                    <div style='background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;'>
                        <p style='font-size: 16px; color: #333; margin-bottom: 20px;'>Hi <strong>{$user_name}</strong>,</p>
                        <p style='font-size: 16px; color: #333; line-height: 1.5; margin-bottom: 20px;'>
                            Your premium subscription has been activated successfully using <strong>{$amount} OACoins</strong>!
                        </p>
                        <div style='background: white; padding: 20px; border-radius: 8px; margin: 20px 0;'>
                            <h3 style='margin: 0 0 15px 0; color: #667eea;'>Subscription Details</h3>
                            <p style='margin: 5px 0;'><strong>Plan:</strong> {$plan_details['name']}</p>
                            <p style='margin: 5px 0;'><strong>Cost:</strong> {$amount} OACoins</p>
                            <p style='margin: 5px 0;'><strong>Valid Until:</strong> " . date('F j, Y', strtotime($end_date)) . "</p>
                            <p style='margin: 5px 0;'><strong>Remaining Balance:</strong> {$new_balance} OACoins</p>
                        </div>
                        <div style='text-align: center; margin: 30px 0;'>
                            <a href='https://oahelper.in/dashboard' style='display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: 500;'>Access Premium Features</a>
                        </div>
                    </div>
                </div>";
            $mail->send();
        } catch (Exception $e) {
            error_log("Mailer Error: " . $e->getMessage());
        }
        
        sendJsonResponse("success", "Premium subscription activated successfully", [
            'plan' => $plan_details['name'],
            'end_date' => $end_date,
            'coins_deducted' => $amount,
            'new_balance' => $new_balance
        ]);
        
    } catch (Exception $e) {
        throw $e;
    }
    
} catch (Exception $e) {
    error_log("OACoins Payment Error: " . $e->getMessage());
    sendJsonResponse("error", $e->getMessage());
}
?>
