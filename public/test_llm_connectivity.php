<?php
/**
 * Test script for solution generation (LLM Connectivity Check)
 * Usage: php public/test_llm_connectivity.php
 */

// Manually setting the key found in db/config.php to avoid DB connection limit issues during this test
$gemini_api_key = "AIzaSyBIbg-7uiQjwvmSbGO15haveCxwGgO_-To";

// Test question
$test_question = [
    'id' => 999,
    'title' => 'Two Sum',
    'problem_statement' => '<h1>Two Sum</h1><p>Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.</p><p>You may assume that each input would have exactly one solution, and you may not use the same element twice.</p>',
    'question_type' => 'coding'
];

echo "Testing C++ Solution Generation (Connectivity Check)\n";
echo "==================================================\n\n";

// Clean problem statement
$clean_problem = strip_tags($test_question['problem_statement']);

echo "Problem: {$test_question['title']}\n";
echo "Statement: " . substr($clean_problem, 0, 100) . "...\n\n";

// Create prompt
$prompt = "Given the following coding problem, provide ONLY the C++ code solution that passes all test cases and hidden test cases.

Problem: {$test_question['title']}

{$clean_problem}

IMPORTANT INSTRUCTIONS:
1. Provide ONLY the C++ code - no explanations, no comments, no markdown
2. Follow the pre-given function signature if provided in the problem
3. Make sure the solution handles all edge cases and passes all test cases
4. The code should be production-ready and efficient
5. Do NOT add any comments to the code
6. Output ONLY the raw C++ code, nothing else";

echo "Calling Gemini API...\n";

$api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . $gemini_api_key;

$request_data = [
    "contents" => [
        [
            "parts" => [
                ["text" => $prompt]
            ]
        ]
    ],
    "generationConfig" => [
        "temperature" => 1.0,
        "topK" => 40,
        "topP" => 0.95,
        "maxOutputTokens" => 8192
    ]
];

$ch = curl_init($api_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($request_data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_TIMEOUT, 120);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);
curl_close($ch);

if ($curl_error) {
    echo "❌ CURL Error: {$curl_error}\n";
    exit(1);
}

echo "HTTP Status: {$http_code}\n\n";

if ($http_code != 200) {
    echo "❌ API Error Response:\n";
    echo substr($response, 0, 1000) . "\n";
    exit(1);
}

$response_data = json_decode($response, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    echo "❌ JSON Decode Error: " . json_last_error_msg() . "\n";
    echo "Response: " . substr($response, 0, 1000) . "\n";
    exit(1);
}

echo "✅ API Response received\n\n";

// Extract code
if (isset($response_data['candidates'][0]['content']['parts'])) {
    $full_response = '';
    foreach ($response_data['candidates'][0]['content']['parts'] as $part) {
        if (isset($part['text'])) {
            $full_response .= $part['text'];
        }
    }
    
    echo "Generated Response:\n";
    echo "==================\n";
    echo $full_response . "\n\n";
    
    // Try to extract code
    if (preg_match('/```(?:cpp|c\+\+|c)?\s*\n(.*?)\n```/s', $full_response, $matches)) {
        echo "✅ Extracted C++ Code:\n";
        echo "====================\n";
        echo $matches[1] . "\n";
    } else {
        echo "⚠️  No code block found, using full response\n";
    }
} else {
    echo "❌ Unexpected response structure\n";
    echo json_encode($response_data, JSON_PRETTY_PRINT) . "\n";
}

echo "\n✅ Test complete\n";
?>
