<?php
// public/company-insights.php
// Lightweight proxy endpoint that exposes company insights stored in Supabase

require_once __DIR__ . '/../db/config.php';

// CORS + security layers
setCorsHeaders();
validateApiKey();

header('Content-Type: application/json');

try {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }

    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 12;
    $limit = max(1, min(60, $limit)); // prevent abuse

    $minQuestions = isset($_GET['min_questions']) ? (int)$_GET['min_questions'] : 0;
    $search = trim($_GET['search'] ?? '');

    $query = [
        'order' => 'question_count.desc,company_name.asc',
        'limit' => $limit
    ];

    if ($minQuestions > 0) {
        $query['question_count'] = 'gte.' . $minQuestions;
    }

    if ($search !== '') {
        // Search by either company or canonical name
        $query['or'] = '(company_name.ilike.*' . $search . '*,canonical_name.ilike.*' . $search . '*)';
    }

    $insights = supabaseSelect('company_insights', $query);

    if ($insights === false) {
        throw new Exception("Failed to fetch insights");
    }

    echo json_encode([
        'status' => 'success',
        'data' => $insights ?: []
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => getSafeDbError($e->getMessage())
    ]);
}


