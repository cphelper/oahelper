<?php
// public/extend-premium.php
// API endpoint for extending premium subscription using OACoins

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

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendJsonResponse("error", "Invalid request method");
    }

    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (!isset($input['user_id']) || !isset($input['days'])) {
        sendJsonResponse("error", "Missing required fields");
    }
    
    $user_id = $input['user_id'];
    $days = (int)$input['days'];
    
    if ($days <= 0) {
        sendJsonResponse("error", "Days must be a positive number");
    }
    
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
    
    // Calculate cost: 3.5 coins per day
    $cost_per_day = 3.5;
    $total_cost = $days * $cost_per_day;
    
    try {
        $current_balance = (float)($user['oacoins'] ?? 0);
        $user_email = $user['email'];
        $user_name = $user['name'];
        
        // Check if user has enough coins
        if ($current_balance < $total_cost) {
            sendJsonResponse("error", "Insufficient OACoins balance", [
                'current_balance' => $current_balance,
                'required' => $total_cost,
                'shortage' => $total_cost - $current_balance
            ]);
        }
        
        // Check if user has an active premium subscription in Supabase
        $now = gmdate('c');
        $subscriptions = supabaseSelect('premium_subscriptions', [
            'user_id' => 'eq.' . $legacy_id,
            'status' => 'eq.active',
            'end_date' => 'gt.' . $now,
            'order' => 'end_date.desc',
            'limit' => 1
        ]);
        
        if (!$subscriptions || empty($subscriptions)) {
            throw new Exception("No active premium subscription found");
        }
        
        $subscription = $subscriptions[0];
        
        // Deduct coins from user's balance in Users table
        $new_balance = $current_balance - $total_cost;
        $updated = supabasePatch('Users', 
            ['id' => 'eq.' . $legacy_id], 
            ['oacoins' => $new_balance, 'updated_at' => gmdate('c')]
        );
        
        if (!$updated) {
            throw new Exception("Failed to deduct coins");
        }
        
        // Calculate new end date
        $current_end_date = new DateTime($subscription['end_date']);
        $current_end_date->modify("+{$days} days");
        $new_end_date = $current_end_date->format('c');
        
        // Extend the subscription end date in Supabase
        $extendUpdated = supabasePatch('premium_subscriptions', 
            ['id' => 'eq.' . $subscription['id']], 
            ['end_date' => $new_end_date, 'updated_at' => gmdate('c')]
        );
        
        if (!$extendUpdated) {
            // Rollback: restore coins
            supabasePatch('Users', 
                ['id' => 'eq.' . $legacy_id], 
                ['oacoins' => $current_balance]
            );
            throw new Exception("Failed to extend subscription");
        }
        
        // Log the transaction in Supabase
        $txPayload = [
            'user_id' => $legacy_id,
            'amount' => $total_cost,
            'transaction_type' => 'debit',
            'description' => "Premium subscription extended by {$days} day(s)",
            'balance_after' => $new_balance,
            'created_at' => gmdate('c')
        ];
        supabaseInsert('oacoins_transactions', $txPayload);
        
        // Send confirmation email
        try {
            $mail = getMailer();
            $mail->addAddress($user_email, $user_name);
            $mail->isHTML(true);
            $mail->Subject = 'Premium Subscription Extended - OAHelper';
            $mail->Body = "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
                    <div style='text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;'>
                        <h1 style='margin: 0; font-size: 28px;'>🎉 Subscription Extended!</h1>
                    </div>
                    <div style='background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;'>
                        <p style='font-size: 16px; color: #333; margin-bottom: 20px;'>Hi <strong>{$user_name}</strong>,</p>
                        <p style='font-size: 16px; color: #333; line-height: 1.5; margin-bottom: 20px;'>
                            Your premium subscription has been extended successfully using <strong>{$total_cost} OACoins</strong>!
                        </p>
                        <div style='background: white; padding: 20px; border-radius: 8px; margin: 20px 0;'>
                            <h3 style='margin: 0 0 15px 0; color: #667eea;'>Extension Details</h3>
                            <p style='margin: 5px 0;'><strong>Days Extended:</strong> {$days} day(s)</p>
                            <p style='margin: 5px 0;'><strong>Cost:</strong> {$total_cost} OACoins</p>
                            <p style='margin: 5px 0;'><strong>New Expiry Date:</strong> " . date('F j, Y', strtotime($new_end_date)) . "</p>
                            <p style='margin: 5px 0;'><strong>Remaining Balance:</strong> {$new_balance} OACoins</p>
                        </div>
                        <div style='text-align: center; margin: 30px 0;'>
                            <a href='https://oahelper.in/dashboard' style='display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: 500;'>View Dashboard</a>
                        </div>
                    </div>
                </div>";
            $mail->send();
        } catch (Exception $e) {
            error_log("Mailer Error: " . $e->getMessage());
        }
        
        sendJsonResponse("success", "Premium subscription extended successfully", [
            'days_extended' => $days,
            'coins_deducted' => $total_cost,
            'new_balance' => $new_balance,
            'new_end_date' => $new_end_date
        ]);
        
    } catch (Exception $e) {
        throw $e;
    }
    
} catch (Exception $e) {
    error_log("Extend Premium Error: " . $e->getMessage());
    sendJsonResponse("error", $e->getMessage());
}
?>
