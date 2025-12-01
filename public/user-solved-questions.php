<?php
require_once '../db/config.php';
require_once '../db/supabase_client.php';

// Set CORS headers
setCorsHeaders();

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Validate API Key
validateApiKey();

// Get input data
$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? $_GET['action'] ?? '';

if ($action === 'mark_solved') {
    $user_id = $input['user_id'] ?? null;
    $question_id = $input['question_id'] ?? null;

    if (!$user_id || !$question_id) {
        echo json_encode(['status' => 'error', 'message' => 'Missing user_id or question_id']);
        exit;
    }

    // Check if already solved
    $existing = supabaseSelect('user_solved_questions', ['user_id' => 'eq.'.$user_id, 'question_id' => 'eq.'.$question_id], 'id', true);
    
    if ($existing) {
        echo json_encode(['status' => 'success', 'message' => 'Question already marked as solved']);
    } else {
        $payload = [
            'user_id' => $user_id,
            'question_id' => $question_id,
            'solved_at' => gmdate('c')
        ];
        
        if (supabaseInsert('user_solved_questions', $payload)) {
            echo json_encode(['status' => 'success', 'message' => 'Question marked as solved']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to mark question as solved']);
        }
    }

} elseif ($action === 'get_solved_count') {
    $user_id = $input['user_id'] ?? $_GET['user_id'] ?? null;

    if (!$user_id) {
        echo json_encode(['status' => 'error', 'message' => 'Missing user_id']);
        exit;
    }

    $count = supabaseCount('user_solved_questions', ['user_id' => 'eq.'.$user_id]);
    
    echo json_encode(['status' => 'success', 'count' => $count]);

} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
}
?>


