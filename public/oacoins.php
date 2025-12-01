<?php
// public/oacoins.php
// API endpoint for managing OAcoins - Supabase version

require_once __DIR__ . '/../db/config.php';
require_once __DIR__ . '/../db/supabase_client.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Validate API key
validateApiKey();

// Handle GET requests
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    
    if ($action === 'get_user_by_email') {
        getUserByEmail();
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "Invalid action"
        ]);
    }
    exit();
}

// Handle POST requests
$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';

switch ($action) {
    case 'get_balance':
        getBalance($input);
        break;
    
    case 'add_coins':
        addCoins($input);
        break;
    
    case 'deduct_coins':
        deductCoins($input);
        break;
    
    case 'set_coins':
        setCoins($input);
        break;
    
    default:
        echo json_encode([
            "status" => "error",
            "message" => "Invalid action"
        ]);
        break;
}

function getBalance($input) {
    $userId = $input['user_id'] ?? null;
    
    if (!$userId) {
        echo json_encode([
            "status" => "error",
            "message" => "User ID is required"
        ]);
        return;
    }
    
    // Get user from Users table
    $user = null;
    if (is_numeric($userId)) {
        $user = supabaseSelect('Users', ['id' => 'eq.' . $userId], '*', true);
    } else {
        $user = supabaseGetUserByEmail($userId);
    }
    
    if ($user) {
        echo json_encode([
            "status" => "success",
            "oacoins" => $user['oacoins'] ?? 0
        ]);
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "User not found"
        ]);
    }
}

function addCoins($input) {
    $userId = $input['user_id'] ?? null;
    $amount = $input['amount'] ?? 0;
    $reason = $input['reason'] ?? 'Admin reward for community contribution';
    
    if (!$userId || $amount <= 0) {
        echo json_encode([
            "status" => "error",
            "message" => "Valid user ID and positive amount are required"
        ]);
        return;
    }
    
    // Get user from Users table
    $user = null;
    if (is_numeric($userId)) {
        $user = supabaseSelect('Users', ['id' => 'eq.' . $userId], '*', true);
    } else {
        $user = supabaseGetUserByEmail($userId);
    }
    
    if (!$user) {
        echo json_encode([
            "status" => "error",
            "message" => "User not found"
        ]);
        return;
    }
    
    $oldBalance = $user['oacoins'] ?? 0;
    $newBalance = $oldBalance + $amount;
    $userIdInt = $user['id'];
    
    // Update OACoins in Users table
    $updated = supabasePatch('Users', ['id' => 'eq.' . $userIdInt], ['oacoins' => $newBalance, 'updated_at' => gmdate('c')]);
    
    // Also keep profile variable for email template compatibility
    $profile = $user;
    
    if ($updated) {
        // Record transaction
        supabaseInsertOacoinsTransaction(
            $userIdInt,
            $amount,
            'credit',
            $reason,
            $newBalance
        );
        
        // Send email notification
        $to = $profile['email'];
        $userName = $profile['name'];
        $subject = "🎉 You've Received OACoins!";
        $message = "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .coin-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea; border-radius: 5px; }
                .amount { font-size: 32px; font-weight: bold; color: #667eea; }
                .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>🪙 OACoins Received!</h1>
                </div>
                <div class='content'>
                    <p>Hello {$userName},</p>
                    <p>Great news! You've received <strong>{$amount} OACoins</strong> to your account!</p>
                    
                    <div class='coin-box'>
                        <p style='margin: 0; color: #666; font-size: 14px;'>Reward Amount</p>
                        <div class='amount'>+{$amount} coins</div>
                        <p style='margin: 10px 0 0 0; color: #666;'>Reason: {$reason}</p>
                    </div>
                    
                    <p><strong>Your Balance:</strong></p>
                    <ul>
                        <li>Previous Balance: {$oldBalance} coins</li>
                        <li>New Balance: {$newBalance} coins</li>
                    </ul>
                    
                    <p>Thank you for your valuable contributions to the OAHelper community!</p>
                    
                    <a href='https://oahelper.in' class='button'>Visit OAHelper</a>
                    
                    <p style='margin-top: 30px; color: #666; font-size: 12px;'>
                        This is an automated message from OAHelper.
                    </p>
                </div>
            </div>
        </body>
        </html>
        ";
        
        $headers = "MIME-Version: 1.0" . "\r\n";
        $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
        $headers .= "From: OAHelper <noreply@oahelper.in>" . "\r\n";
        
        @mail($to, $subject, $message, $headers);
        
        echo json_encode([
            "status" => "success",
            "message" => "Coins added successfully and notification sent",
            "new_balance" => $newBalance,
            "email_sent" => true
        ]);
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "Failed to add coins"
        ]);
    }
}

function deductCoins($input) {
    $userId = $input['user_id'] ?? null;
    $amount = $input['amount'] ?? 0;
    
    if (!$userId || $amount <= 0) {
        echo json_encode([
            "status" => "error",
            "message" => "Valid user ID and positive amount are required"
        ]);
        return;
    }
    
    // Get user from Users table
    $user = null;
    if (is_numeric($userId)) {
        $user = supabaseSelect('Users', ['id' => 'eq.' . $userId], '*', true);
    } else {
        $user = supabaseGetUserByEmail($userId);
    }
    
    if (!$user) {
        echo json_encode([
            "status" => "error",
            "message" => "User not found"
        ]);
        return;
    }
    
    $currentBalance = $user['oacoins'] ?? 0;
    
    if ($currentBalance < $amount) {
        echo json_encode([
            "status" => "error",
            "message" => "Insufficient coins",
            "current_balance" => $currentBalance
        ]);
        return;
    }
    
    $newBalance = $currentBalance - $amount;
    $userIdInt = $user['id'];
    
    // Update OACoins in Users table
    $updated = supabasePatch('Users', ['id' => 'eq.' . $userIdInt], ['oacoins' => $newBalance, 'updated_at' => gmdate('c')]);
    
    if ($updated) {
        // Record transaction
        supabaseInsertOacoinsTransaction(
            $userIdInt,
            $amount,
            'debit',
            'Admin deduction',
            $newBalance
        );
        
        echo json_encode([
            "status" => "success",
            "message" => "Coins deducted successfully",
            "new_balance" => $newBalance
        ]);
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "Failed to deduct coins"
        ]);
    }
}

function getUserByEmail() {
    $email = $_GET['email'] ?? null;
    
    if (!$email) {
        echo json_encode([
            "status" => "error",
            "message" => "Email is required"
        ]);
        return;
    }
    
    // Get user from Users table
    $user = supabaseGetUserByEmail($email);
    
    if ($user) {
        echo json_encode([
            "status" => "success",
            "user" => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'oacoins' => $user['oacoins'] ?? 0,
                'verified' => $user['verified'] ? 1 : 0,
                'created_at' => $user['created_at']
            ]
        ]);
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "User not found with this email"
        ]);
    }
}

function setCoins($input) {
    $userId = $input['user_id'] ?? null;
    $amount = $input['amount'] ?? null;
    
    if (!$userId || $amount === null || $amount < 0) {
        echo json_encode([
            "status" => "error",
            "message" => "Valid user ID and non-negative amount are required"
        ]);
        return;
    }
    
    // Get user from Users table
    $user = null;
    if (is_numeric($userId)) {
        $user = supabaseSelect('Users', ['id' => 'eq.' . $userId], '*', true);
    } else {
        $user = supabaseGetUserByEmail($userId);
    }
    
    if (!$user) {
        echo json_encode([
            "status" => "error",
            "message" => "User not found"
        ]);
        return;
    }
    
    $userIdInt = $user['id'];
    
    // Update OACoins in Users table
    $updated = supabasePatch('Users', ['id' => 'eq.' . $userIdInt], ['oacoins' => (int)$amount, 'updated_at' => gmdate('c')]);
    
    if ($updated) {
        echo json_encode([
            "status" => "success",
            "message" => "Coins set successfully",
            "new_balance" => (int)$amount
        ]);
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "Failed to set coins"
        ]);
    }
}
?>
