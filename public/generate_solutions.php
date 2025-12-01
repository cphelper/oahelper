<?php
/**
 * Solution Generator - Step by Step
 * Generates individual solutions or pregiven code on demand
 * Supports saving all solutions at once
 * Supabase version
 */

require_once __DIR__ . '/../db/config.php';
require_once __DIR__ . '/../db/supabase_client.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

validateApiKey();

set_time_limit(120);

function generateSolution($problem_statement, $title, $api_key, $question_type = 'coding') {
    $clean_problem = strip_tags($problem_statement);
    
    if ($question_type === 'mcq') {
        $prompt = "Given the following MCQ (Multiple Choice Questions), analyze ALL questions and provide answers for EACH question in a structured JSON format.

Problem: {$title}

{$clean_problem}

IMPORTANT INSTRUCTIONS:
1. There may be MULTIPLE MCQs (5-10 questions) in the problem statement
2. Analyze EACH MCQ carefully and identify the correct answer(s) for EACH question
3. Return ONLY a JSON array where each element represents one MCQ question
4. Use this exact structure:
[
  {
    \"question_number\": 1,
    \"question_text\": \"Brief summary of the question\",
    \"correct_answers\": [\"A\"],
    \"explanation\": \"Brief explanation\"
  }
]
5. The \"correct_answers\" array should contain one or more option letters (A, B, C, D, etc.)
6. Return ONLY the JSON array, no markdown, no extra text";
    } else {
        $prompt = "Given the following coding problem, provide ONLY the C++ code solution that passes all test cases.

Problem: {$title}

{$clean_problem}

IMPORTANT INSTRUCTIONS:
1. Provide ONLY the C++ code - no explanations, no comments, no markdown
2. Follow the pre-given function signature if provided
3. Make sure the solution handles all edge cases
4. Output ONLY the raw C++ code, nothing else";
    }
    
    $api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=" . $api_key;
    
    $request_data = [
        "contents" => [["parts" => [["text" => $prompt]]]],
        "generationConfig" => ["temperature" => 1.0, "topK" => 40, "topP" => 0.95]
    ];
    
    $ch = curl_init($api_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($request_data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_TIMEOUT, 300);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($http_code != 200) {
        error_log("Gemini API error: HTTP {$http_code}");
        return null;
    }
    
    $response_data = json_decode($response, true);
    
    if (isset($response_data['candidates'][0]['content']['parts'])) {
        $full_response = '';
        foreach ($response_data['candidates'][0]['content']['parts'] as $part) {
            if (isset($part['text'])) {
                $full_response .= $part['text'];
            }
        }
        return extractCodeOnly($full_response);
    }
    
    return null;
}

function extractCodeOnly($response_text) {
    if (preg_match('/```(?:cpp|c\+\+|c)\s*\n(.*?)\n```/s', $response_text, $matches)) {
        return trim($matches[1]);
    }
    if (preg_match('/```\s*\n(.*?)\n```/s', $response_text, $matches)) {
        $code = trim($matches[1]);
        if (strpos($code, '#include') !== false || strpos($code, 'class') !== false) {
            return $code;
        }
    }
    $trimmed = trim($response_text);
    if (strpos($trimmed, '#include') === 0 || strpos($trimmed, 'class ') === 0) {
        return $trimmed;
    }
    if (preg_match('/(#include.*)/s', $response_text, $matches)) {
        return trim($matches[1]);
    }
    return trim($response_text);
}

function generatePregivenCode($problem_statement, $title, $api_key) {
    $clean_problem = strip_tags($problem_statement);
    
    $prompt = "Problem: {$title}

{$clean_problem}

Generate ONLY the C++ function signature/starter code template. Include:
1. Class name (if applicable)
2. Function signature with proper parameter types
3. Return type
4. A comment placeholder '// Your code here'

Return ONLY the starter code template, no explanations.";
    
    $api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . $api_key;
    
    $request_data = [
        "contents" => [["parts" => [["text" => $prompt]]]],
        "generationConfig" => ["temperature" => 0.2, "topK" => 32, "topP" => 1, "maxOutputTokens" => 2048]
    ];
    
    $ch = curl_init($api_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($request_data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($http_code != 200) {
        return "class Solution {\npublic:\n    // Your code here\n};";
    }
    
    $response_data = json_decode($response, true);
    
    if (isset($response_data['candidates'][0]['content']['parts'][0]['text'])) {
        $code = $response_data['candidates'][0]['content']['parts'][0]['text'];
        if (preg_match('/```(?:cpp|c\+\+)?\s*\n(.*?)\n```/s', $code, $matches)) {
            return trim($matches[1]);
        }
        return trim($code);
    }
    
    return "class Solution {\npublic:\n    // Your code here\n};";
}

try {
    header('Content-Type: application/json');
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (isset($input['action']) && $input['action'] === 'save_mcq') {
            $question_id = intval($input['question_id']);
            $mcq_solution = $input['mcq_solution'];
            
            if (supabaseUpdateQuestion($question_id, ['solution_cpp' => $mcq_solution])) {
                echo json_encode(['status' => 'success', 'message' => 'MCQ solution saved']);
            } else {
                throw new Exception("Failed to save MCQ solution");
            }
            exit();
        }
        
        if (isset($input['action']) && $input['action'] === 'save_all') {
            $question_id = intval($input['question_id']);
            $solutions = $input['solutions'];
            
            $updateData = [];
            if (!empty($solutions['cpp'])) {
                $updateData['solution_cpp'] = $solutions['cpp'];
            }
            if (!empty($solutions['pregiven_cpp'])) {
                $updateData['pregiven_code_cpp'] = $solutions['pregiven_cpp'];
            }
            
            if (!empty($updateData)) {
                if (supabaseUpdateQuestion($question_id, $updateData)) {
                    echo json_encode(['status' => 'success', 'message' => 'Solutions saved']);
                } else {
                    throw new Exception("Failed to save solutions");
                }
            } else {
                throw new Exception("No solutions provided");
            }
            exit();
        }
    }
    
    // GET request for generating
    $question_id = isset($_GET['question_id']) ? intval($_GET['question_id']) : null;
    $type = isset($_GET['type']) ? $_GET['type'] : null;
    $language = isset($_GET['language']) ? $_GET['language'] : null;
    
    if (!$question_id || !$type) {
        echo json_encode(['status' => 'error', 'message' => 'Missing required parameters']);
        exit();
    }
    
    if ($type !== 'mcq_solution' && !$language) {
        echo json_encode(['status' => 'error', 'message' => 'Missing language parameter']);
        exit();
    }
    
    if ($type !== 'mcq_solution' && $language !== 'cpp') {
        echo json_encode(['status' => 'error', 'message' => 'Only C++ generation is supported']);
        exit();
    }
    
    // Fetch question from Supabase
    $question = supabaseGetQuestionById($question_id);
    
    if (!$question) {
        echo json_encode(['status' => 'error', 'message' => 'Question not found']);
        exit();
    }
    
    if ($type === 'mcq_solution' && ($question['question_type'] ?? 'coding') !== 'mcq') {
        echo json_encode(['status' => 'error', 'message' => 'Not an MCQ question']);
        exit();
    }
    
    if ($type !== 'mcq_solution' && ($question['question_type'] ?? 'coding') !== 'coding') {
        echo json_encode(['status' => 'error', 'message' => 'Not a coding question']);
        exit();
    }
    
    global $gemini_api_key;
    if (empty($gemini_api_key)) {
        echo json_encode(['status' => 'error', 'message' => 'API key not configured']);
        exit();
    }
    
    $generated_code = null;
    
    if ($type === 'mcq_solution') {
        $generated_code = generateSolution($question['problem_statement'], $question['title'], $gemini_api_key, 'mcq');
    } elseif ($type === 'solution') {
        $generated_code = generateSolution($question['problem_statement'], $question['title'], $gemini_api_key, $question['question_type'] ?? 'coding');
    } elseif ($type === 'pregiven') {
        $generated_code = generatePregivenCode($question['problem_statement'], $question['title'], $gemini_api_key);
    }
    
    if ($generated_code && !empty(trim($generated_code))) {
        if ($type === 'mcq_solution') {
            echo json_encode(['status' => 'success', 'mcq_solution' => $generated_code, 'type' => $type]);
        } else {
            echo json_encode(['status' => 'success', 'code' => $generated_code, 'type' => $type, 'language' => $language]);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to generate']);
    }
    
} catch (Exception $e) {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
