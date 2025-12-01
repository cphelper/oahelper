<?php
// public/get-user.php
// API endpoint to get updated user data

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

function sendJsonResponse($status, $message, $data = null) {
    echo json_encode([
        "status" => $status,
        "message" => $message,
        "user" => $data
    ]);
    exit();
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        sendJsonResponse("error", "Invalid request method");
    }

    if (!isset($_GET['user_id'])) {
        sendJsonResponse("error", "User ID is required");
    }

    $user_id = $_GET['user_id'];

    // Get user from Users table
    $user = null;
    if (is_numeric($user_id)) {
        $user = supabaseSelect('Users', ['id' => 'eq.' . $user_id], '*', true);
    } else {
        // Try by email
        $user = supabaseGetUserByEmail($user_id);
    }

    if (!$user) {
        sendJsonResponse("error", "User not found");
    }
    
    // Map response to expected format
    $userData = [
        'id' => $user['id'],
        'uuid' => (string)$user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'oacoins' => $user['oacoins'] ?? 0
    ];

    sendJsonResponse("success", "User data retrieved", $userData);

} catch (Exception $e) {
    error_log("Get User Error: " . $e->getMessage());
    sendJsonResponse("error", "An error occurred: " . $e->getMessage());
}
?>


