<?php
// public/ai-fix.php - Handle AI code fixing requests

// Include database configuration first to get CORS functions
require_once __DIR__ . '/../db/config.php';

// Set CORS headers based on environment
setCorsHeaders();

// Access-Control headers are received during OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'])) {
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    }

    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    }

    exit(0);
}

// Validate API key
validateApiKey();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Method not allowed. Use POST.'
    ]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['code']) || !isset($input['errors'])) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Missing required fields: code and errors'
    ]);
    exit;
}

$code = trim($input['code']);
$errors = $input['errors'];

if (empty($code)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Code cannot be empty'
    ]);
    exit;
}

if (empty($errors)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'No errors provided'
    ]);
    exit;
}

try {
    // Get Gemini API key from config.php (more secure)
    global $gemini_api_key;

    if (empty($gemini_api_key)) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Gemini API key not configured in config.php'
        ]);
        exit;
    }

    $geminiApiKey = $gemini_api_key;

    $prompt = "You are an expert C++ programmer. Please fix the following C++ code that has compilation errors:

Current Code:
{$code}

Compilation Errors:
" . implode("\n", $errors) . "

Please provide only the corrected C++ code without any explanations or markdown formatting. The code should be complete and ready to compile.";

    $response = callGeminiAPI($geminiApiKey, $prompt);

    // Check if response has the expected structure
    if ($response && isset($response['candidates']) && is_array($response['candidates']) &&
        count($response['candidates']) > 0 && isset($response['candidates'][0]['content'])) {

        $content = $response['candidates'][0]['content'];

        if (isset($content['parts']) && is_array($content['parts']) && count($content['parts']) > 0) {
            $aiResponse = $content['parts'][0]['text'];

            if (!empty($aiResponse)) {
                // Clean up the response - remove markdown code blocks if present
                $cleanedCode = preg_replace('/```(?:cpp)?\n?/', '', $aiResponse);
                $cleanedCode = preg_replace('/```\n?/', '', $cleanedCode);
                $cleanedCode = trim($cleanedCode);

                echo json_encode([
                    'status' => 'success',
                    'fixed_code' => $cleanedCode,
                    'debug' => 'Response structure correct'
                ]);
                exit;
            }
        }
    }

    // If we get here, the response structure is not as expected
    http_response_code(500);
    $debug_info = [
        'response_keys' => $response ? array_keys($response) : 'null',
        'has_candidates' => isset($response['candidates']),
        'candidates_count' => isset($response['candidates']) ? count($response['candidates']) : 0,
        'first_candidate_keys' => isset($response['candidates'][0]) ? array_keys($response['candidates'][0]) : 'no_first_candidate'
    ];

    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid response structure from Gemini API',
        'debug' => $debug_info
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'AI service error: ' . $e->getMessage()
    ]);
}

// Gemini API helper function
function callGeminiAPI($apiKey, $prompt) {
    // Try gemini-2.0-flash-exp first, fallback to gemini-1.5-flash if not available
    $models = [
        'gemini-2.0-flash-exp',
        'gemini-1.5-flash'
    ];

    foreach ($models as $model) {
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" . urlencode($apiKey);

        $data = [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $prompt]
                    ]
                ]
            ],
            'generationConfig' => [
                'temperature' => 0.1,
                'maxOutputTokens' => 8192,
            ]
        ];

        $options = [
            'http' => [
                'header' => "Content-type: application/json\r\n",
                'method' => 'POST',
                'content' => json_encode($data),
                'timeout' => 30,
                'ignore_errors' => true,
            ],
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
            ]
        ];

        $context = stream_context_create($options);

        $result = @file_get_contents($url, false, $context);

        if ($result !== FALSE) {
            // Check if we got an HTTP error response
            $http_response_header = isset($http_response_header) ? $http_response_header : [];
            $status_line = isset($http_response_header[0]) ? $http_response_header[0] : '';

            if (preg_match('/HTTP\/\d+\.\d+\s+(\d+)/', $status_line, $matches)) {
                $status_code = (int)$matches[1];
                if ($status_code >= 400) {
                    error_log("Gemini API model {$model} returned HTTP error {$status_code}: " . $result);
                    if ($model === end($models)) { // Last model in the list
                        throw new Exception("Gemini API error (HTTP {$status_code}) for all models: " . $result);
                    }
                    continue; // Try next model
                }
            }

            $decoded = json_decode($result, true);

            if ($decoded !== null && !isset($decoded['error'])) {
                error_log("Successfully used model: {$model}");
                return $decoded;
            } else if (isset($decoded['error'])) {
                error_log("Gemini API model {$model} returned error: " . print_r($decoded['error'], true));
                if ($model === end($models)) {
                    throw new Exception('Gemini API error for all models: ' . ($decoded['error']['message'] ?? 'Unknown API error'));
                }
                continue; // Try next model
            }
        } else if ($model === end($models)) {
            $error = error_get_last();
            $error_msg = isset($error['message']) ? $error['message'] : 'Unknown error';
            error_log("All Gemini API models failed. Last error: " . $error_msg);
            throw new Exception('Failed to call Gemini API: ' . $error_msg);
        }
    }

    throw new Exception('All Gemini API models failed');
}
?>
