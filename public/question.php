<?php
// public/question.php
// Supabase-only version

// Enable error reporting for debugging
error_reporting(E_ALL);

// Include database configuration first to get CORS functions
require_once __DIR__ . '/../db/config.php';

// Set CORS headers based on environment
setCorsHeaders();
ini_set('display_errors', 0); // Don't display errors in output, but log them

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Validate API key
validateApiKey();

$action = isset($_GET['action']) ? $_GET['action'] : '';

// Log the request for debugging
error_log("question.php called with action: " . $action . " and query: " . http_build_query($_GET));

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if ($action === 'get_question') {
            // Get a single question by ID
            if (!isset($_GET['id'])) {
                echo json_encode([
                    "status" => "error",
                    "message" => "Question ID is required"
                ]);
                exit;
            }

            $id = (int)$_GET['id'];
            
            // Get question from Supabase
            $question = supabaseGetQuestionById($id);
            
            if ($question) {
                // Get company name
                if ($question['company_id']) {
                    $company = supabaseGetCompanyById((int)$question['company_id']);
                    $question['company_name'] = $company['name'] ?? 'Unknown Company';
                } else {
                    $question['company_name'] = 'Unknown Company';
                }
                
                error_log("Sending question data: " . json_encode($question));
                
                echo json_encode([
                    "status" => "success",
                    "data" => $question
                ]);
            } else {
                echo json_encode([
                    "status" => "error",
                    "message" => "Question not found"
                ]);
            }
        } elseif ($action === 'get_questions_by_company') {
            // Get all questions by company ID
            if (!isset($_GET['company_id'])) {
                echo json_encode([
                    "status" => "error",
                    "message" => "Company ID is required"
                ]);
                exit;
            }

            $company_id = (int)$_GET['company_id'];
            
            error_log("Fetching questions for company ID: " . $company_id);
            
            // Get questions from Supabase (only essential fields)
            $questionsRaw = supabaseSelect('Questions', [
                'company_id' => 'eq.' . $company_id,
                'order' => 'created_at.desc'
            ], 'id,title,premium_required,company_id');
            
            $questions = [];
            if ($questionsRaw) {
                // Get company name once
                $company = supabaseGetCompanyById($company_id);
                $companyName = $company['name'] ?? 'Unknown Company';
                
                foreach ($questionsRaw as $q) {
                    $q['company_name'] = $companyName;
                    $questions[] = $q;
                }
            }
            
            error_log("Found " . count($questions) . " questions for company ID: " . $company_id);
            
            echo json_encode([
                "status" => "success",
                "data" => $questions
            ]);
        } elseif ($action === 'get_question_by_title') {
            // Get a question by title
            if (!isset($_GET['title'])) {
                echo json_encode([
                    "status" => "error",
                    "message" => "Question title is required"
                ]);
                exit;
            }

            $title = $_GET['title'];

            error_log("Searching for question with title: " . $title);

            // Get question from Supabase by title
            $question = supabaseSelect('Questions', ['title' => 'eq.' . $title], '*', true);

            if ($question) {
                // Get company name
                if ($question['company_id']) {
                    $company = supabaseGetCompanyById((int)$question['company_id']);
                    $question['company_name'] = $company['name'] ?? 'Unknown Company';
                } else {
                    $question['company_name'] = 'Unknown Company';
                }

                error_log("Found question with title: " . $title . ", ID: " . $question['id']);

                echo json_encode([
                    "status" => "success",
                    "data" => $question
                ]);
            } else {
                echo json_encode([
                    "status" => "error",
                    "message" => "Question not found with title: " . $title
                ]);
            }
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
    error_log("Error in question.php: " . $e->getMessage());
    echo json_encode([
        "status" => "error",
        "message" => "An error occurred: " . $e->getMessage(),
        "debug_info" => [
            "action" => $action,
            "request_method" => $_SERVER['REQUEST_METHOD'],
            "get_params" => $_GET
        ]
    ]);
}
?>
