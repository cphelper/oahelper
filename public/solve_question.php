<?php
// public/solve_question.php

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

// Validate API key (Frontend to Backend auth)
validateApiKey();

// Increase limits for large uploads and processing
set_time_limit(3600); // 60 minutes
ini_set('memory_limit', '512M');
ini_set('default_socket_timeout', 3600); // 60 minutes

// Prevent FastCGI timeout by sending early headers
if (!headers_sent()) {
    if (ob_get_level()) {
        ob_end_flush();
    }
    flush();
}

// Helper function to process images with Gemini API
function processImagesWithGemini($image_paths, $api_key, $custom_prompt, $model = 'gemini-3-pro-preview') {
    // Validate API key
    if (empty($api_key)) {
        throw new Exception("Gemini API key is not configured on the server.");
    }
    
    // Prepare images for API request
    $parts = [];
    
    // Add prompt as the first part
    $parts[] = [
        "text" => $custom_prompt
    ];
    
    if (!empty($image_paths)) {
        // Limit to maximum 16 images
        if (count($image_paths) > 16) {
            $image_paths = array_slice($image_paths, 0, 16);
        }
        
        foreach ($image_paths as $path) {
            if (!file_exists($path) || !is_readable($path)) continue;
            
            $mime_type = mime_content_type($path);
            $image_data = file_get_contents($path);
            $base64_image = base64_encode($image_data);
            
            $parts[] = [
                "inlineData" => [
                    "mimeType" => $mime_type,
                    "data" => $base64_image
                ]
            ];
        }
    }
    
    // API URL
    $api_url = "https://generativelanguage.googleapis.com/v1beta/models/" . $model . ":generateContent?key=" . $api_key;
    
    // Configuration
    $generation_config = [
        "temperature" => 0.4,
        "topK" => 32,
        "topP" => 1,
        "maxOutputTokens" => 65536 // Increased for Gemini 3
    ];

    // Safety Settings - permissive to avoid blocks
    $safety_settings = [
        [ "category" => "HARM_CATEGORY_HARASSMENT", "threshold" => "BLOCK_NONE" ],
        [ "category" => "HARM_CATEGORY_HATE_SPEECH", "threshold" => "BLOCK_NONE" ],
        [ "category" => "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold" => "BLOCK_NONE" ],
        [ "category" => "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold" => "BLOCK_NONE" ]
    ];

    // Add thinking config for Gemini 3 Pro
    if (strpos($model, 'gemini-3-pro') !== false) {
        // Set temperature to 1.0 for Gemini 3 Pro as recommended for reasoning
        $generation_config['temperature'] = 1.0;
        // Increase tokens even more for reasoning models
        $generation_config['maxOutputTokens'] = 65536; 
    }
    
    $request_data = [
        "contents" => [[ "parts" => $parts ]],
        "generationConfig" => $generation_config,
        "safetySettings" => $safety_settings
    ];
    
    // If thinking level is passed in config (we'll modify function signature or logic)
    global $thinking_level;
    if (isset($thinking_level) && (strpos($model, 'gemini-3-pro') !== false || strpos($model, 'gemini-2.0') !== false)) {
         $request_data['generationConfig']['thinkingConfig'] = [
            'thinkingLevel' => $thinking_level
        ];
    }

    $request_json = json_encode($request_data);
    
    // Execute request
    $curl = curl_init($api_url);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_POST, true);
    curl_setopt($curl, CURLOPT_POSTFIELDS, $request_json);
    curl_setopt($curl, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Content-Length: ' . strlen($request_json)
    ]);
    curl_setopt($curl, CURLOPT_TIMEOUT, 3600); // 60 minutes timeout for curl
    
    $response = curl_exec($curl);
    
    if ($response === false) {
        throw new Exception("Gemini API Error: " . curl_error($curl));
    }
    
    $http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
    
    if ($http_code != 200) {
        throw new Exception("Gemini API returned error (HTTP {$http_code}): " . $response);
    }
    
    $response_data = json_decode($response, true);
    
    $result = [
        'text' => '',
        'thinking' => '',
        'usage' => isset($response_data['usageMetadata']) ? $response_data['usageMetadata'] : null
    ];
    
    // Look for text in any part of the first candidate
    if (isset($response_data['candidates'][0]['content']['parts'])) {
        $parts = $response_data['candidates'][0]['content']['parts'];
        
        // If multiple parts, the first one might be thinking process (if enabled)
        // Or we just concatenate all text
        $full_text = '';
        
        foreach ($parts as $part) {
            if (isset($part['text'])) {
                // Check if this part seems like a thought process (sometimes marked in metadata, but here we might just heuristic or combine)
                // For now, we combine all text, but we could separate if we knew the structure
                // Gemini 2.0 Flash Thinking sometimes separates thought and response
                
                // If we have access to specific field indicating thought
                if (isset($part['thought']) && $part['thought'] === true) {
                     $result['thinking'] .= $part['text'] . "\n";
                } else {
                    $full_text .= $part['text'];
                }
            }
        }
        
        // If no specific thought field, but we want to capture everything
        // Some models return thought in the text itself wrapped in tags or just first part
        // For simplicity and robustness, let's return the full text
        // But wait, if the user wants to see "thinking tokens", they imply the thought process.
        // Let's return the full text as the main result, but also pass raw parts if needed
        // For now, let's just join all parts
        
        $result['text'] = $full_text;
        
        // If we didn't find specific 'thought' parts, but we are using a thinking model, 
        // the model might just output thoughts followed by answer.
        // We will return the whole thing and let frontend display/parse.
        
        return $result;
    }

    // Enhanced error reporting
    $error_details = "No text found.";
        if (isset($response_data['candidates'][0]['finishReason'])) {
            $error_details .= " Finish Reason: " . $response_data['candidates'][0]['finishReason'];
        }
        if (isset($response_data['promptFeedback'])) {
             $error_details .= " Prompt Feedback: " . json_encode($response_data['promptFeedback']);
        }
        
        // Check if there are any parts at all
        if (isset($response_data['candidates'][0]['content']['parts'])) {
             $parts_info = array_map(function($p) { return array_keys($p); }, $response_data['candidates'][0]['content']['parts']);
             $error_details .= " Parts keys: " . json_encode($parts_info);
        }

        // Include full response for debugging (truncated)
        $response_preview = substr($response, 0, 1000);
        throw new Exception("Unexpected response structure from Gemini API. Details: " . $error_details . " Raw: " . $response_preview);
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Only POST method is allowed");
    }
    
    $prompt = $_POST['prompt'] ?? '';
    if (empty($prompt)) {
        throw new Exception("Prompt is required");
    }
    
    $model = $_POST['model'] ?? 'gemini-3-pro-preview';
    $thinking_level = $_POST['thinking_level'] ?? 'LOW'; // LOW or HIGH
    
    // Handle Image Uploads
    $image_paths = [];
    $upload_dir = sys_get_temp_dir() . '/gemini_uploads_' . uniqid() . '/';
    
    if (!empty($_FILES)) {
        if (!mkdir($upload_dir, 0755, true)) {
            throw new Exception("Failed to create temp directory");
        }
        
        foreach ($_FILES as $key => $file) {
            if (strpos($key, 'image_') === 0 && $file['error'] === 0) {
                $target_path = $upload_dir . $file['name'];
                if (move_uploaded_file($file['tmp_name'], $target_path)) {
                    $image_paths[] = $target_path;
                }
            }
        }
    }
    
    // Use the API key from config.php
    global $gemini_api_key_1;
    $api_key_to_use = $gemini_api_key_1;
    
    // Call Gemini
    $gemini_result = processImagesWithGemini($image_paths, $api_key_to_use, $prompt, $model);
    
    // Cleanup temp images
    if (is_dir($upload_dir)) {
        array_map('unlink', glob("$upload_dir/*.*"));
        rmdir($upload_dir);
    }
    
    echo json_encode([
        "status" => "success",
        "text" => $gemini_result['text'],
        "thinking" => $gemini_result['thinking'],
        "usage" => $gemini_result['usage']
    ]);

} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
?>
