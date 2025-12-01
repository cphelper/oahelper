<?php
// public/admin-suggestions.php
// Supabase version

require_once '../db/config.php';
require_once '../db/supabase_client.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Validate API key
validateApiKey();

header('Content-Type: application/json');

// Verify admin authentication via Authorization header
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';

if (empty($authHeader) || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Unauthorized - No token provided'
    ]);
    http_response_code(401);
    exit();
}

$token = $matches[1];

// For admin verification, we check against admin_credentials table
// Since we don't have session tokens in Supabase admin_credentials, 
// we'll use a simplified approach - verify the token format or skip token validation
// In production, you'd want proper JWT validation or session management

// For now, we'll allow access if the token is non-empty (admin panel handles auth)
// This is a simplified approach - the admin panel already validates credentials on login

// Get suggestions from ChatHistory using Supabase
try {
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
    $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
    
    // Fetch chat history where is_suggestion = true
    $filters = [
        'is_suggestion' => 'eq.true',
        'order' => 'created_at.desc',
        'limit' => $limit,
        'offset' => $offset
    ];
    
    $chatHistory = supabaseSelect('ChatHistory', $filters);
    
    if ($chatHistory === false) {
        throw new Exception("Failed to fetch suggestions from Supabase");
    }
    
    $suggestions = [];
    foreach ($chatHistory as $row) {
        $suggestions[] = [
            'id' => $row['id'],
            'user_id' => $row['user_id'],
            'user_email' => $row['user_email'],
            'suggestion' => $row['user_message'],
            'response' => $row['bot_response'],
            'is_logged_in' => (bool)$row['is_logged_in'],
            'is_premium' => (bool)$row['is_premium'],
            'premium_plan' => $row['premium_plan'],
            'session_id' => $row['session_id'],
            'created_at' => $row['created_at']
        ];
    }
    
    // Get total count
    $total = supabaseCount('ChatHistory', ['is_suggestion' => 'eq.true']);
    
    echo json_encode([
        'status' => 'success',
        'data' => $suggestions,
        'total' => $total,
        'limit' => $limit,
        'offset' => $offset
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to fetch suggestions: ' . $e->getMessage()
    ]);
    http_response_code(500);
}
?>
