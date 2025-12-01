<?php
// public/question_images.php
// Supabase-only version

// Enable error reporting for debugging
error_reporting(E_ALL);

// Include database configuration first to get CORS functions
require_once __DIR__ . '/../db/config.php';

// Set CORS headers based on environment
setCorsHeaders();
ini_set('display_errors', 0);

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Validate API key
validateApiKey();

// Set upload directory
$upload_dir = "question_images/";

// Check if upload directory exists
if (!file_exists($upload_dir)) {
    if (!mkdir($upload_dir, 0755, true)) {
        error_log("Failed to create upload directory: " . $upload_dir);
        $upload_dir = dirname($_SERVER['SCRIPT_FILENAME']) . "/question_images/";
        if (!file_exists($upload_dir)) {
            mkdir($upload_dir, 0755, true);
        }
    }
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

error_log("question_images.php called with action: " . $action . " and query: " . http_build_query($_GET));

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if ($action === 'get_question_images') {
            if (!isset($_GET['question_id'])) {
                echo json_encode([
                    "status" => "error",
                    "message" => "Question ID is required"
                ]);
                exit;
            }
            
            $question_id = (int)$_GET['question_id'];
            
            error_log("Fetching images for question ID: " . $question_id);
            
            // Get images from Supabase
            $images = supabaseGetQuestionImages($question_id);
            
            error_log("Found " . count($images) . " images for question ID: " . $question_id);
            
            echo json_encode([
                "status" => "success",
                "data" => $images
            ]);
        } else {
            echo json_encode([
                "status" => "error",
                "message" => "Invalid action: " . $action
            ]);
        }
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "Invalid request method: " . $_SERVER['REQUEST_METHOD']
        ]);
    }
} catch (Exception $e) {
    error_log("Error in question_images.php: " . $e->getMessage());
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage(),
        "debug_info" => [
            "action" => $action,
            "request_method" => $_SERVER['REQUEST_METHOD'],
            "get_params" => $_GET
        ]
    ]);
}
?>
