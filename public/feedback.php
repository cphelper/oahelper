<?php
/**
 * Feedback API endpoint
 * Handles feedback submission and retrieval
 */

require_once '../db/config.php';
require_once '../db/supabase_client.php';

// Set CORS headers
setCorsHeaders();

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// Validate API key
validateApiKey();

// Handle GET requests for feedback retrieval
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    $input = $_GET;
} else {
    // Handle POST requests for feedback submission
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
        exit;
    }

    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid JSON input']);
        exit;
    }

    $action = $input['action'] ?? '';
}

try {
    switch ($action) {
        case 'submit_feedback':
            handleSubmitFeedback($input);
            break;
        case 'get_feedback':
            handleGetFeedback($input);
            break;
        default:
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
            break;
    }
} catch (Exception $e) {
    error_log("Feedback API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Internal server error']);
}

function handleSubmitFeedback($input) {
    // Validate required fields
    $required_fields = ['feedback_type', 'feedback_text'];
    foreach ($required_fields as $field) {
        if (empty($input[$field])) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => "Missing required field: $field"]);
            return;
        }
    }
    
    // Sanitize and validate input
    $user_id = !empty($input['user_id']) ? $input['user_id'] : null;
    $user_email = !empty($input['user_email']) ? filter_var($input['user_email'], FILTER_SANITIZE_EMAIL) : null;
    $feedback_type = $input['feedback_type'];
    $feedback_text = trim($input['feedback_text']);
    $page_url = !empty($input['page_url']) ? filter_var($input['page_url'], FILTER_SANITIZE_URL) : null;
    $user_agent = !empty($input['user_agent']) ? htmlspecialchars($input['user_agent'], ENT_QUOTES, 'UTF-8') : null;
    
    // Validate feedback type
    $allowed_types = ['general', 'bug', 'feature', 'improvement', 'code_editor', 'test_cases'];
    if (!in_array($feedback_type, $allowed_types)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid feedback type']);
        return;
    }
    
    // Validate feedback text length
    if (strlen($feedback_text) < 10) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Feedback text must be at least 10 characters long']);
        return;
    }
    
    if (strlen($feedback_text) > 2000) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Feedback text must be less than 2000 characters']);
        return;
    }
    
    // Prepare payload for Supabase
    $payload = [
        'user_id' => $user_id, // can be uuid or int text
        'user_email' => $user_email,
        'feedback_type' => $feedback_type,
        'feedback_text' => $feedback_text,
        'page_url' => $page_url,
        'user_agent' => $user_agent,
        'created_at' => gmdate('c')
    ];
    
    // Using supabaseInsert
    if (supabaseInsert('feedback', $payload)) {
        echo json_encode([
            'status' => 'success',
            'message' => 'Feedback submitted successfully'
        ]);
    } else {
        throw new Exception("Failed to insert feedback into Supabase");
    }
}

function handleGetFeedback($input) {
    // This function is for admin use - you might want to add authentication here
    $page = intval($input['page'] ?? 1);
    $limit = intval($input['limit'] ?? 20);
    $status = $input['status'] ?? '';
    $feedback_type = $input['feedback_type'] ?? '';
    
    // Calculate offset
    $offset = ($page - 1) * $limit;
    
    // Build filters
    $filters = [];
    if (!empty($status)) {
        $filters['status'] = 'eq.' . $status;
    }
    
    if (!empty($feedback_type)) {
        $filters['feedback_type'] = 'eq.' . $feedback_type;
    }
    
    // Get total count
    $total_count = supabaseCount('feedback', $filters);
    
    // Get feedback records
    $filters['order'] = 'created_at.desc';
    $filters['limit'] = $limit;
    $filters['offset'] = $offset;
    
    $feedback = supabaseSelect('feedback', $filters);
    
    if ($feedback === false) {
        throw new Exception("Failed to fetch feedback from Supabase");
    }
    
    echo json_encode([
        'status' => 'success',
        'data' => [
            'feedback' => $feedback,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total_count,
                'total_pages' => ceil($total_count / $limit)
            ]
        ]
    ]);
}
?>


