<?php
/**
 * Simple test endpoint to verify the flow works
 */

require_once __DIR__ . '/../db/config.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

validateApiKey();

header('Content-Type: application/json');

$question_id = isset($_GET['question_id']) ? intval($_GET['question_id']) : null;
$type = isset($_GET['type']) ? $_GET['type'] : null;
$language = isset($_GET['language']) ? $_GET['language'] : null;

if (!$question_id || !$type || !$language) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Missing parameters: question_id=' . $question_id . ', type=' . $type . ', language=' . $language
    ]);
    exit();
}

// Return a simple test solution
$test_code = "#include <iostream>\n#include <vector>\n\nclass Solution {\npublic:\n    // Test solution for question {$question_id}\n    void solve() {\n        // Your code here\n    }\n};";

echo json_encode([
    'status' => 'success',
    'code' => $test_code,
    'type' => $type,
    'language' => $language,
    'message' => 'Test endpoint - not real generation'
]);
?>
