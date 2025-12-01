<?php
require_once __DIR__ . '/../db/config.php';
require_once __DIR__ . '/../db/supabase_client.php';

// Set CORS headers
setCorsHeaders();

header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$action = $_GET['action'] ?? $_POST['action'] ?? null;
$input = json_decode(file_get_contents('php://input'), true);
if ($input) {
    $action = $action ?? $input['action'] ?? null;
}

switch ($action) {
    case 'submit_report':
        submitTestCaseReport($input);
        break;
    case 'get_reports':
        getTestCaseReports();
        break;
    case 'update_status':
        updateReportStatus($input);
        break;
    default:
        echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
}

function submitTestCaseReport($input) {
    $question_id = $input['question_id'] ?? null;
    $test_case_index = $input['test_case_index'] ?? null;
    $user_id = $input['user_id'] ?? null;
    $user_email = $input['user_email'] ?? null;
    $issue_type = $input['issue_type'] ?? 'other';
    $description = $input['description'] ?? '';
    $test_input = $input['test_input'] ?? '';
    $expected_output = $input['expected_output'] ?? '';
    $actual_output = $input['actual_output'] ?? '';

    if (!$question_id || !$test_case_index) {
        echo json_encode(['status' => 'error', 'message' => 'Question ID and test case index are required']);
        return;
    }

    $data = [
        'question_id' => (int)$question_id,
        'test_case_index' => (int)$test_case_index,
        'user_id' => $user_id,
        'user_email' => $user_email,
        'issue_type' => $issue_type,
        'description' => $description,
        'test_input' => $test_input,
        'expected_output' => $expected_output,
        'actual_output' => $actual_output,
        'status' => 'pending',
        'created_at' => gmdate('c'),
        'updated_at' => gmdate('c')
    ];

    $result = supabaseInsert('test_case_reports', $data);

    if ($result) {
        echo json_encode(['status' => 'success', 'message' => 'Report submitted successfully']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to submit report']);
    }
}

function getTestCaseReports() {
    $question_id = $_GET['question_id'] ?? null;
    $status = $_GET['status'] ?? null;

    $filters = ['order' => 'created_at.desc'];
    
    if ($question_id) {
        $filters['question_id'] = 'eq.' . (int)$question_id;
    }
    if ($status) {
        $filters['status'] = 'eq.' . $status;
    }

    $result = supabaseSelect('test_case_reports', $filters);

    if ($result !== false) {
        echo json_encode(['status' => 'success', 'data' => $result ?: []]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to fetch reports']);
    }
}

function updateReportStatus($input) {
    $report_id = $input['report_id'] ?? null;
    $status = $input['status'] ?? null;

    if (!$report_id || !$status) {
        echo json_encode(['status' => 'error', 'message' => 'Report ID and status are required']);
        return;
    }

    $result = supabasePatch('test_case_reports', ['id' => 'eq.' . (int)$report_id], [
        'status' => $status,
        'updated_at' => gmdate('c')
    ]);

    if ($result) {
        echo json_encode(['status' => 'success', 'message' => 'Status updated successfully']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to update status']);
    }
}
?>
