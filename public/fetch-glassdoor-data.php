<?php
// Suppress PHP errors from being output (they break JSON)
error_reporting(0);
ini_set('display_errors', 0);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get company name from request
$company = $_GET['company'] ?? $_POST['company'] ?? '';

// If no company found, try to get it from JSON body
if (empty($company)) {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    if ($data && isset($data['company'])) {
        $company = $data['company'];
    }
}

if (empty($company)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Company name is required'
    ]);
    exit();
}

// Sanitize company name for shell execution
$company = escapeshellarg($company);

// Path to the Python script
$scriptPath = __DIR__ . '/../scripts/fetch_glassdoor_interviews.py';
$venvPath = __DIR__ . '/../scripts/venv/bin/activate';

// Check if script exists
if (!file_exists($scriptPath)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Python script not found'
    ]);
    exit();
}

// Execute the Python script with virtual environment
$command = "source {$venvPath} && python {$scriptPath} {$company} 2>&1";
$output = shell_exec($command);

if ($output === null) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to execute Python script'
    ]);
    exit();
}

// Parse the output to extract the summary
// The summary is between the "INTERVIEW EXPERIENCES SUMMARY" markers
$pattern = '/INTERVIEW EXPERIENCES SUMMARY\n={80}\n\n(.*?)\n={80}/s';
if (preg_match($pattern, $output, $matches)) {
    $summary = trim($matches[1]);
    
    // Extract sources if available
    $sources = [];
    if (preg_match('/📚 Sources used:\n(.*?)(?:\n\n|$)/s', $output, $sourceMatches)) {
        $sourceLines = explode("\n", trim($sourceMatches[1]));
        foreach ($sourceLines as $line) {
            if (preg_match('/- (.+)/', $line, $urlMatch)) {
                $sources[] = trim($urlMatch[1]);
            }
        }
    }
    
    echo json_encode([
        'status' => 'success',
        'data' => [
            'company' => str_replace("'", "", $company),
            'summary' => $summary,
            'sources' => $sources,
            'generated_at' => date('Y-m-d H:i:s')
        ]
    ]);
} else {
    // If parsing fails, return the raw output
    echo json_encode([
        'status' => 'success',
        'data' => [
            'company' => str_replace("'", "", $company),
            'summary' => $output,
            'sources' => [],
            'generated_at' => date('Y-m-d H:i:s')
        ]
    ]);
}
?>
