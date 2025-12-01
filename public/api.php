<?php
// public/api.php - Renamed from index.php to avoid conflicts with React app

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

// Validate API key for all non-OPTIONS requests
validateApiKey();

// Route the request to the appropriate file
$request = $_SERVER['REQUEST_URI'];
$base = '/saves/helperr/oa/public/';

// Handle API requests
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action'])) {
    $action = $_GET['action'];
    
    switch ($action) {
        case 'get_dsa_sheet_questions':
            try {
                // Fetch curated DSA sheet questions from Supabase
                // Join sequence: dsasheetcurated -> questions -> companies
                // Note: Using alias syntax 'questions:question_id' if needed, but 'questions' usually works if FK name matches table
                
                $columns = 'lc_level, primary_topic, dsasheet_section, created_at, questions (id, title, problem_statement, lc_tags, company_id, companies (name))';
                $filters = [
                    'order' => 'primary_topic.asc,lc_level.asc,id.asc'
                ];
                
                $data = supabaseSelect('dsasheetcurated', $filters, $columns);

                if ($data === false) {
                    throw new Exception("Failed to fetch questions from Supabase");
                }

                $questions = [];
                foreach ($data as $row) {
                    $q = $row['questions'] ?? [];
                    $c = $q['companies'] ?? [];
                    
                    // Supabase returns JSON columns as arrays/objects automatically if type is json/jsonb
                    // If text, it returns string. We'll handle both.
                    $lc_tags = $q['lc_tags'] ?? [];
                    if (is_string($lc_tags)) {
                        $decoded = json_decode($lc_tags, true);
                        $lc_tags = is_array($decoded) ? $decoded : [];
                    }

                    $item = [
                        'id' => $q['id'] ?? null,
                        'title' => $q['title'] ?? null,
                        'problem_statement' => $q['problem_statement'] ?? null,
                        'lc_tags' => $lc_tags,
                        'company_id' => $q['company_id'] ?? null,
                        'company_name' => $c['name'] ?? null,
                        'lc_level' => $row['lc_level'],
                        'primary_topic' => $row['primary_topic'],
                        'dsasheet_section' => $row['dsasheet_section'],
                        'created_at' => $row['created_at'],
                        'topics' => $row['primary_topic'] ? [$row['primary_topic']] : []
                    ];

                    $questions[] = $item;
                }

                echo json_encode([
                    'status' => 'success',
                    'data' => $questions,
                    'count' => count($questions)
                ]);

            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode([
                    'status' => 'error',
                    'message' => $e->getMessage()
                ]);
            }
            break;


        case 'get_all_questions':
            try {
                // Get pagination parameters
                $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
                $limit = isset($_GET['limit']) ? max(1, min(100, intval($_GET['limit']))) : 50;
                $offset = ($page - 1) * $limit;

                // 1. Get total count
                $total_count = supabaseCount('questions');

                // 2. Fetch paginated questions
                // Join: questions -> companies, questions -> questionclassifications
                $columns = 'id, title, problem_statement, lc_tags, company_id, companies (name), questionclassifications (lc_level, primary_topic, dsasheet_section, topics)';
                $filters = [
                    'limit' => $limit,
                    'offset' => $offset,
                    'order' => 'id.desc'
                ];
                
                $data = supabaseSelect('questions', $filters, $columns);

                if ($data === false) {
                    throw new Exception("Failed to fetch questions from Supabase");
                }

                $questions = [];
                foreach ($data as $row) {
                    $c = $row['companies'] ?? [];
                    // questionclassifications might be an array (one-to-many) or object (one-to-one)
                    // PostgREST usually returns array for has_many. We take the first one.
                    $qc = $row['questionclassifications'] ?? [];
                    if (isset($qc[0]) && is_array($qc)) {
                        $qc = $qc[0];
                    }

                    // Parse lc_tags
                    $lc_tags = $row['lc_tags'] ?? [];
                    if (is_string($lc_tags)) {
                        $decoded = json_decode($lc_tags, true);
                        $lc_tags = is_array($decoded) ? $decoded : [];
                    }

                    // Parse topics
                    $topics = $qc['topics'] ?? [];
                    if (is_string($topics)) {
                        $decoded = json_decode($topics, true);
                        $topics = is_array($decoded) ? $decoded : [];
                    }
                    
                    $primary_topic = $qc['primary_topic'] ?? 'Array';
                    
                    if (empty($topics) && $primary_topic) {
                        $topics = [$primary_topic];
                    }

                    $item = [
                        'id' => $row['id'],
                        'title' => $row['title'],
                        'problem_statement' => $row['problem_statement'],
                        'lc_tags' => $lc_tags,
                        'company_id' => $row['company_id'],
                        'company_name' => $c['name'] ?? null,
                        'lc_level' => $qc['lc_level'] ?? 'Medium',
                        'primary_topic' => $primary_topic,
                        'dsasheet_section' => $qc['dsasheet_section'] ?? null,
                        'topics' => $topics,
                        'created_at' => $qc['created_at'] ?? null // QC created_at or Q created_at? SQL selected qc.created_at
                    ];

                    $questions[] = $item;
                }

                $has_more = ($offset + $limit) < $total_count;

                echo json_encode([
                    'status' => 'success',
                    'data' => $questions,
                    'count' => count($questions),
                    'total' => $total_count,
                    'page' => $page,
                    'limit' => $limit,
                    'has_more' => $has_more
                ]);

            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode([
                    'status' => 'error',
                    'message' => $e->getMessage()
                ]);
            }
            break;
            
        default:
            http_response_code(404);
            echo json_encode(['error' => 'Action not found']);
            break;
    }
    exit;
}


// Handle legacy routing
switch ($request) {
    case $base . 'signup':
        require __DIR__ . '/signup.php';
        break;
    case $base . 'login':
        require __DIR__ . '/login.php';
        break;
    case $base . 'feedback':
        require __DIR__ . '/feedback.php';
        break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Not Found']);
        break;
} 