<?php
// public/chat.php
// Supabase-only version

require_once '../db/config.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Validate API key
validateApiKey();

header('Content-Type: application/json');

// Handle admin requests to fetch chat history
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get_chat_history') {
    try {
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;
        $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
        
        $chats = supabaseSelect('ChatHistory', [
            'order' => 'created_at.desc',
            'limit' => $limit,
            'offset' => $offset
        ]);
        
        if (!$chats) $chats = [];
        
        // Get total count
        $total = supabaseCountChatHistory();
        
        echo json_encode([
            'status' => 'success',
            'data' => $chats,
            'total' => $total
        ]);
        exit();
    } catch (Exception $e) {
        $error_msg = ($environment === 'development') ? 'Failed to fetch chat history: ' . $e->getMessage() : 'Failed to fetch chat history';
        echo json_encode([
            'status' => 'error',
            'message' => $error_msg
        ]);
        exit();
    }
}

// Get the request data
$data = json_decode(file_get_contents('php://input'), true);
$userMessage = $data['message'] ?? '';
$userId = $data['user_id'] ?? null;
$isLoggedIn = $data['is_logged_in'] ?? false;
$isPremium = $data['is_premium'] ?? false;
$userEmail = $data['user_email'] ?? null;
$premiumPlan = $data['premium_plan'] ?? null;
$premiumAmount = $data['premium_amount'] ?? null;
$premiumExpiry = $data['premium_expiry'] ?? null;
$dailyLimit = $data['daily_limit'] ?? null;
$conversationHistory = $data['conversation_history'] ?? [];
$oacoinsBalance = $data['oacoins_balance'] ?? 0;

if (empty($userMessage)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Message is required'
    ]);
    exit();
}

// Build user context for AI
$userContext = "\n\n=== USER CONTEXT ===\n";

if ($isLoggedIn) {
    $userContext .= "User Status: Logged In\n";
    $userContext .= "User ID: " . $userId . "\n";
    if ($userEmail) {
        $userContext .= "User Email: " . $userEmail . "\n";
    }
    
    // Add OACoins balance
    $userContext .= "OACoins Balance: " . $oacoinsBalance . " coins\n";
    
    if ($isPremium) {
        $userContext .= "Premium Status: ACTIVE (User has premium access)\n";
        
        if ($premiumPlan) {
            $userContext .= "Premium Plan Type: " . strtoupper($premiumPlan) . "\n";
        }
        if ($premiumAmount) {
            $userContext .= "Plan Amount Paid: ₹" . $premiumAmount . "\n";
        }
        if ($premiumExpiry) {
            $expiryDate = date('d M Y', strtotime($premiumExpiry));
            $daysLeft = max(0, floor((strtotime($premiumExpiry) - time()) / 86400));
            $userContext .= "Premium Expires On: " . $expiryDate . " (" . $daysLeft . " days remaining)\n";
        }
        if ($dailyLimit) {
            if ($dailyLimit == -1 || $dailyLimit >= 999) {
                $userContext .= "Daily Solution Limit: Unlimited\n";
            } else {
                $userContext .= "Daily Solution Limit: " . $dailyLimit . " solutions per day\n";
            }
        }
        
        $userContext .= "Note: This user already has premium. If they ask about premium, acknowledge their current plan and offer help with premium features or extending their subscription using OACoins.\n";
    } else {
        $userContext .= "Premium Status: FREE (User does not have premium)\n";
        $userContext .= "Note: This user is on free plan. If they ask about premium, explain the benefits and plans available.\n";
    }
} else {
    $userContext .= "User Status: Not Logged In (Guest)\n";
    $userContext .= "Note: This user is not logged in. If they ask about premium, OACoins, or account features, suggest they sign up or log in first.\n";
}
$userContext .= "===================\n";

// Load FAQ Context from chatqna.md file
$faqFilePath = dirname(__DIR__) . '/scripts/chatqna.md';
$faqContext = "You are Krish, a friendly and professional customer support assistant at OA Helper. You help students with their coding interview preparation in a warm and approachable manner.\n\nYour personality:\n- Professional yet friendly and approachable\n- Clear and concise communication\n- Helpful and patient with all questions\n- Warm and understanding tone\n- No slang or emojis - keep it professional\n- Focus on providing accurate information\n\n⚠️ CRITICAL: Keep responses SHORT and CONCISE (2-4 sentences max). Get straight to the point.\n\nAnswer questions based on the comprehensive Q&A database below.\n\n";

// Premium Plans Information
$premiumPlansInfo = "
=== OA HELPER PREMIUM PLANS ===

We offer 4 premium plans with flexible payment options (Rupee or OACoins):

1. BASIC PLAN - ₹99 (or 99 OACoins)
   - Duration: 30 days
   - Features:
     • Unlimited Question Access
     • 5 Solutions Daily
     • Priority Support
     • Premium Community Access
     • Request Missing Companies

2. PRO PLAN - ₹199 (or 199 OACoins) [MOST POPULAR]
   - Duration: 30 days
   - Features:
     • Unlimited Question Access
     • 15 Solutions Daily
     • Priority Support
     • Premium Community Access
     • Request Missing Companies

3. UNLIMITED PLAN - ₹299 (or 299 OACoins) [BEST VALUE]
   - Duration: 45 days (Extended!)
   - Features:
     • Unlimited Question Access
     • Unlimited Solutions Daily
     • Priority Support
     • Premium Community Access
     • Request Missing Companies

4. YEARLY PLAN - ₹999 (or 999 OACoins) [ULTIMATE VALUE - Save 72%!]
   - Duration: 365 days (Full Year)
   - Features:
     • Unlimited Question Access
     • Unlimited Solutions Daily
     • VIP Support Channel
     • Premium Community Access
     • All Future Features Included

CONTACT & SUPPORT:
- WhatsApp: +91 9274985691
- Email: support@oahelper.in
- Website: oahelper.in

";

$faqContext .= $premiumPlansInfo;

if (file_exists($faqFilePath)) {
    $faqContent = file_get_contents($faqFilePath);
    $faqContext .= $faqContent;
    $faqContext .= "\n\nAnswer user questions helpfully, professionally, and concisely based on the information above. If you don't know something, direct them to contact support via WhatsApp (9274985691) or email (support@oahelper.in).";
} else {
    $faqContext .= "\n\nAnswer user questions helpfully, professionally, and concisely based on the information above. If you don't know something, direct them to contact support via WhatsApp (9274985691) or email (support@oahelper.in).";
}

// Prepare the API request
$apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=" . $gemini_api_key;

// Build conversation history context
$conversationContext = "";
if (!empty($conversationHistory) && is_array($conversationHistory)) {
    $conversationContext = "\n\n=== CONVERSATION HISTORY ===\n";
    foreach ($conversationHistory as $msg) {
        $role = $msg['role'] === 'user' ? 'User' : 'Krish';
        $conversationContext .= $role . ": " . $msg['content'] . "\n";
    }
    $conversationContext .= "===========================\n";
}

$requestBody = [
    'contents' => [
        [
            'parts' => [
                ['text' => $faqContext . $userContext . $conversationContext . "\n\nUser's current question: " . $userMessage . "\n\nAs Krish, provide a SHORT, CONCISE response (2-4 sentences max). Be warm, friendly, and professional. Get straight to the point. Use the conversation history above to maintain context and avoid repeating information. Personalize based on their login/premium status. Use clear, professional language without slang or emojis. DO NOT mention technical file names - only user-facing features. DO NOT say you're an AI or bot - you're Krish, a real support person.\n\nIf the user asks to talk to a human, real person, or live support, acknowledge their request warmly and let them know you're connecting them to our live support team."]
            ]
        ]
    ],
    'generationConfig' => [
        'temperature' => 0.7,
        'maxOutputTokens' => 150,
        'topP' => 0.9,
        'topK' => 40
    ]
];

// Make the API request
$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($requestBody));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    $error_msg = ($environment === 'development') ? 'CURL Error: ' . $curlError : 'Connection error';
    echo json_encode([
        'status' => 'error',
        'message' => $error_msg,
        'response' => 'Sorry, I am having trouble connecting right now. Please try again or contact our support team.'
    ]);
    exit();
}

if ($httpCode !== 200) {
    $errorData = json_decode($response, true);
    $error_msg = ($environment === 'development') ? 'API Error (HTTP ' . $httpCode . ')' : 'Service unavailable';
    echo json_encode([
        'status' => 'error',
        'message' => $error_msg,
        'details' => ($environment === 'development') ? $errorData : null,
        'response' => 'Sorry, I am having trouble connecting right now. Please try again or contact our support team.'
    ]);
    exit();
}

$responseData = json_decode($response, true);

// Extract the AI response
$aiResponse = $responseData['candidates'][0]['content']['parts'][0]['text'] ?? 'Sorry, I could not generate a response. Please contact our support team.';

// Check if user wants to connect with a real person
$connectKeywords = ['talk to human', 'speak to someone', 'real person', 'human support', 'connect me', 'talk to real', 'speak with someone', 'human agent', 'live chat', 'live support', 'talk to support', 'speak to support'];
$shouldConnectToHuman = false;
$lowerMessage = strtolower($userMessage);
foreach ($connectKeywords as $keyword) {
    if (strpos($lowerMessage, $keyword) !== false) {
        $shouldConnectToHuman = true;
        break;
    }
}

// Save chat to database using Supabase
try {
    $sessionId = $data['session_id'] ?? 'guest_' . time();
    
    supabaseInsertChatHistory([
        'user_id' => $userId,
        'user_email' => $userEmail,
        'user_message' => $userMessage,
        'bot_response' => $aiResponse,
        'is_logged_in' => $isLoggedIn,
        'is_premium' => $isPremium,
        'premium_plan' => $premiumPlan,
        'session_id' => $sessionId
    ]);
} catch (Exception $e) {
    // Log error but don't fail the response
    error_log("Failed to save chat history: " . $e->getMessage());
}

echo json_encode([
    'status' => 'success',
    'response' => $aiResponse,
    'connect_to_human' => $shouldConnectToHuman
]);
?>
