<?php
// public/upload_question.php
// Supabase-only version

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Include database configuration first to get CORS functions
require_once __DIR__ . '/../db/config.php';

// Set CORS headers based on environment
setCorsHeaders();

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Validate API key
validateApiKey();

// Set a reasonable execution time limit for image processing
set_time_limit(300);

// Create upload directory if it doesn't exist
$upload_dir = __DIR__ . "/question_images/";
$web_upload_dir = "question_images/";

if (!file_exists($upload_dir)) {
    if (!mkdir($upload_dir, 0755, true)) {
        error_log("Failed to create upload directory: " . $upload_dir);
        throw new Exception("Failed to create upload directory.");
    }
}

if (!is_writable($upload_dir)) {
    chmod($upload_dir, 0755);
}

// Function to get the base URL of the site
function getBaseUrl() {
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https://' : 'http://';
    $host = $_SERVER['HTTP_HOST'];
    $baseUrl = $protocol . $host;
    $scriptPath = dirname($_SERVER['SCRIPT_NAME']);
    if ($scriptPath !== '/' && $scriptPath !== '\\') {
        $scriptPath = str_replace('\\', '/', $scriptPath);
        $scriptPath = rtrim($scriptPath, '/');
        $baseUrl .= $scriptPath;
    }
    return $baseUrl;
}

// Function to get or create a company using Supabase
function getOrCreateCompany($company_name) {
    // Check if company exists
    $existing = supabaseGetCompanyByName($company_name);
    
    if ($existing) {
        return $existing['id'];
    }
    
    // Create new company
    $result = supabaseInsertCompany($company_name, date('Y-m-d'), true);
    
    if ($result) {
        return $result['id'];
    }
    
    throw new Exception("Error creating company");
}

// Process images with Gemini API
function processImagesWithGemini($image_paths, $api_key, $question_type = 'coding', $model = 'gemini-3-pro-preview') {
    if (empty($api_key)) {
        throw new Exception("API key is required");
    }
    
    if (empty($image_paths)) {
        throw new Exception("No images to process");
    }
    
    if (count($image_paths) > 16) {
        $image_paths = array_slice($image_paths, 0, 16);
    }
    
    $parts = [];
    
    foreach ($image_paths as $path) {
        if (!file_exists($path) || !is_readable($path)) {
            continue;
        }
        
        $file_size = filesize($path);
        if ($file_size > 10 * 1024 * 1024) {
            continue;
        }
        
        $mime_type = mime_content_type($path);
        if (!in_array($mime_type, ['image/jpeg', 'image/png', 'image/gif'])) {
            continue;
        }
        
        $image_data = file_get_contents($path);
        if ($image_data === false) {
            continue;
        }
        
        $base64_image = base64_encode($image_data);
        
        $parts[] = [
            "inlineData" => [
                "mimeType" => $mime_type,
                "data" => $base64_image
            ]
        ];
    }
    
    if (empty($parts)) {
        throw new Exception("No valid images to process");
    }
    
    // Create structured prompt based on question type
    if ($question_type === 'mcq') {
        $structured_prompt = "Extract the MCQ problem from these images into structured HTML. Use <h1> for Title, <h2> for Question/Options/Answer.";
    } else if ($question_type === 'sql') {
        $structured_prompt = "Extract the SQL problem from these images into structured HTML. Use <h1> for Title, <h2> for Description/Schema.";
    } else if ($question_type === 'api') {
        $structured_prompt = "Extract the API problem from these images into structured HTML. Use <h1> for Title, <h2> for Description/Endpoints.";
    } else {
        $structured_prompt = "Extract the coding problem from these images into LeetCode-style structured HTML. Use <h1> for Title, <h2> for sections.";
    }
    
    array_unshift($parts, ["text" => $structured_prompt]);
    
    $api_url = "https://generativelanguage.googleapis.com/v1beta/models/" . $model . ":generateContent?key=" . $api_key;
    
    $generation_config = [
        "temperature" => 0.4,
        "topK" => 32,
        "topP" => 1,
        "maxOutputTokens" => 8192
    ];

    if (strpos($model, 'gemini-3-pro') !== false) {
        $generation_config['thinkingConfig'] = ['thinkingLevel' => 'LOW'];
    }
    
    $request_data = [
        "contents" => [["parts" => $parts]],
        "generationConfig" => $generation_config
    ];
    
    $curl = curl_init($api_url);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_POST, true);
    curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($request_data));
    curl_setopt($curl, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($curl, CURLOPT_TIMEOUT, 120);
    
    $response = curl_exec($curl);
    
    if ($response === false) {
        throw new Exception("Error communicating with Gemini API: " . curl_error($curl));
    }
    
    $http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
    
    if ($http_code != 200) {
        throw new Exception("Gemini API returned error (HTTP {$http_code})");
    }
    
    $response_data = json_decode($response, true);
    
    if (isset($response_data['candidates'][0]['content']['parts'][0]['text'])) {
        $generated_text = $response_data['candidates'][0]['content']['parts'][0]['text'];
        
        $title = 'Coding Problem';
        if (preg_match('/<h1[^>]*>(.*?)<\/h1>/i', $generated_text, $matches)) {
            $title = trim(strip_tags($matches[1]));
        }
        
        return [
            'title' => $title,
            'html' => $generated_text
        ];
    }
    
    throw new Exception("Unexpected response from Gemini API");
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Only POST method is allowed");
    }
    
    if (!isset($_POST['company_name']) || empty($_POST['company_name'])) {
        throw new Exception("Company name is required");
    }
    
    $company_name = $_POST['company_name'];
    $cpp_solution = $_POST['cpp_solution'] ?? null;
    $pregiven_code_cpp = $_POST['pregiven_code_cpp'] ?? null;
    $pregiven_code_python = $_POST['pregiven_code_python'] ?? null;
    $pregiven_code_java = $_POST['pregiven_code_java'] ?? null;
    $input_test_case = $_POST['input_test_case'] ?? null;
    $output_test_case = $_POST['output_test_case'] ?? null;
    
    $preview_only = isset($_POST['preview_only']) && $_POST['preview_only'] === 'true';
    $confirm_upload = isset($_POST['confirm_upload']) && $_POST['confirm_upload'] === 'true';
    $problem_statement = $_POST['problem_statement'] ?? null;
    $question_type = $_POST['question_type'] ?? 'coding';
    $custom_model = $_POST['model'] ?? 'gemini-3-pro-preview';
    $api_key_selection = $_POST['api_key_selection'] ?? 'api_key_1';
    
    // Confirm upload with existing problem statement
    if ($confirm_upload && $problem_statement) {
        $uploaded_images = [];
        
        if (!empty($_FILES)) {
            foreach ($_FILES as $key => $file) {
                if (strpos($key, 'image_') === 0 && $file['error'] === 0) {
                    $new_filename = uniqid() . '_' . $file['name'];
                    $target_path = $upload_dir . $new_filename;
                    $web_path = $web_upload_dir . $new_filename;
                    
                    if (move_uploaded_file($file['tmp_name'], $target_path)) {
                        $uploaded_images[] = [
                            'path' => $web_path,
                            'url' => getBaseUrl() . '/' . $web_path
                        ];
                    }
                }
            }
        }
        
        $company_id = getOrCreateCompany($company_name);
        
        $title = 'Coding Problem';
        if (preg_match('/<h1[^>]*>(.*?)<\/h1>/i', $problem_statement, $matches)) {
            $title = trim(strip_tags($matches[1]));
        }

        // Insert question using Supabase
        $questionData = [
            'title' => $title,
            'problem_statement' => $problem_statement,
            'solution_cpp' => $cpp_solution,
            'pregiven_code_cpp' => $pregiven_code_cpp,
            'pregiven_code_python' => $pregiven_code_python,
            'pregiven_code_java' => $pregiven_code_java,
            'input_test_case' => $input_test_case,
            'output_test_case' => $output_test_case,
            'company_id' => $company_id,
            'question_type' => $question_type
        ];
        
        $question = supabaseInsertQuestion($questionData);
        
        if (!$question) {
            throw new Exception("Error saving question");
        }
        
        $question_id = $question['id'];
        
        // Insert image references
        foreach ($uploaded_images as $image) {
            supabaseInsertQuestionImage($question_id, $image['path'], $image['url']);
        }
        
        echo json_encode([
            "status" => "success",
            "message" => "Question uploaded and processed successfully",
            "question_id" => $question_id,
            "company_id" => $company_id
        ]);
        
        exit();
    }
    
    // Process images to generate problem statement
    $image_paths = [];
    if (!empty($_FILES)) {
        foreach ($_FILES as $key => $file) {
            if (strpos($key, 'image_') === 0 && $file['error'] === 0) {
                $new_filename = uniqid() . '_' . $file['name'];
                $target_path = $upload_dir . $new_filename;
                if (move_uploaded_file($file['tmp_name'], $target_path)) {
                    $image_paths[] = $target_path;
                }
            }
        }
    }
    
    if (empty($image_paths)) {
        throw new Exception("No images uploaded for generation");
    }

    global $gemini_api_key_1, $gemini_api_key_2;
    $api_key_to_use = ($api_key_selection === 'api_key_2') ? $gemini_api_key_2 : $gemini_api_key_1;
    
    $gemini_response = processImagesWithGemini($image_paths, $api_key_to_use, $question_type, $custom_model);
    
    if ($preview_only) {
        echo json_encode([
            "status" => "success",
            "message" => "Problem statement generated successfully",
            "problem_statement" => $gemini_response['html'],
            "question_title" => $gemini_response['title']
        ]);
        exit();
    }

} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
?>
