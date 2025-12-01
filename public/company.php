<?php
// public/company.php
// Supabase-only version

// Include database configuration first to get CORS functions
require_once __DIR__ . '/../db/config.php';

// Set CORS headers based on environment
setCorsHeaders();

// Validate API key
validateApiKey();

try {
    // Handle POST requests for admin operations
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? '';
        
        if ($action === 'update') {
            $companyId = $input['company_id'] ?? 0;
            $newName = $input['name'] ?? '';
            
            if (!$companyId || !$newName) {
                throw new Exception("Company ID and name are required");
            }
            
            if (supabaseUpdateCompany((int)$companyId, ['name' => $newName])) {
                echo json_encode([
                    "status" => "success",
                    "message" => "Company updated successfully"
                ]);
            } else {
                throw new Exception("Error updating company");
            }
            exit();
            
        } else if ($action === 'delete') {
            $companyId = $input['company_id'] ?? 0;

            if (!$companyId) {
                throw new Exception("Company ID is required");
            }

            // First, delete all question images for this company's questions
            $questions = supabaseGetQuestionsByCompanyId((int)$companyId);
            foreach ($questions as $question) {
                supabaseDeleteQuestionImages((int)$question['id']);
            }

            // Then delete all questions for this company
            supabaseDelete('Questions', ['company_id' => 'eq.' . $companyId]);

            // Finally delete the company
            if (supabaseDeleteCompany((int)$companyId)) {
                echo json_encode([
                    "status" => "success",
                    "message" => "Company and all its questions deleted successfully"
                ]);
            } else {
                throw new Exception("Error deleting company");
            }
            exit();

        } else if ($action === 'update_question') {
            $questionId = $input['question_id'] ?? 0;
            $title = $input['title'] ?? '';
            $problemStatement = $input['problem_statement'] ?? '';
            $solutionCpp = $input['solution_cpp'] ?? null;

            if (!$questionId || !$title || !$problemStatement) {
                throw new Exception("Question ID, title, and problem statement are required");
            }

            $updateData = [
                'title' => $title,
                'problem_statement' => $problemStatement,
                'solution_cpp' => $solutionCpp
            ];

            // Check for optional fields
            if (array_key_exists('pregiven_code_cpp', $input)) {
                $updateData['pregiven_code_cpp'] = $input['pregiven_code_cpp'];
            }
            if (array_key_exists('pregiven_code_python', $input)) {
                $updateData['pregiven_code_python'] = $input['pregiven_code_python'];
            }
            if (array_key_exists('pregiven_code_java', $input)) {
                $updateData['pregiven_code_java'] = $input['pregiven_code_java'];
            }
            if (array_key_exists('input_test_case', $input)) {
                $updateData['input_test_case'] = $input['input_test_case'];
            }
            if (array_key_exists('output_test_case', $input)) {
                $updateData['output_test_case'] = $input['output_test_case'];
            }

            if (supabaseUpdateQuestion((int)$questionId, $updateData)) {
                echo json_encode([
                    "status" => "success",
                    "message" => "Question updated successfully"
                ]);
            } else {
                throw new Exception("Error updating question");
            }
            exit();
            
        } else if ($action === 'delete_question') {
            $questionId = $input['question_id'] ?? 0;
            
            if (!$questionId) {
                throw new Exception("Question ID is required");
            }
            
            // First delete question images
            supabaseDeleteQuestionImages((int)$questionId);
            
            // Then delete the question
            if (supabaseDeleteQuestion((int)$questionId)) {
                echo json_encode([
                    "status" => "success",
                    "message" => "Question deleted successfully"
                ]);
            } else {
                throw new Exception("Error deleting question");
            }
            exit();
            
        } else if ($action === 'update_solution') {
            $question_id = $input['question_id'] ?? 0;
            $solution_cpp = $input['solution_cpp'] ?? null;
            $solution_python = $input['solution_python'] ?? null;
            $solution_java = $input['solution_java'] ?? null;

            if ($question_id > 0) {
                $updateData = [
                    'solution_cpp' => $solution_cpp,
                    'solution_python' => $solution_python,
                    'solution_java' => $solution_java
                ];
                
                if (supabaseUpdateQuestion((int)$question_id, $updateData)) {
                    echo json_encode(["status" => "success", "message" => "Solution updated successfully"]);
                } else {
                    throw new Exception("Failed to update solution");
                }
            } else {
                throw new Exception("Invalid question ID");
            }
            exit();
        } else if ($action === 'update_question_fields') {
            // Update multiple fields at once (inline editing)
            $questionId = intval($input['question_id'] ?? 0);
            $updates = $input['updates'] ?? [];
            
            if (!$questionId) {
                throw new Exception("Question ID is required");
            }
            
            if (empty($updates)) {
                throw new Exception("No updates provided");
            }
            
            // Validate field names
            $allowedFields = ['title', 'problem_statement', 'solution_cpp', 'solution_python', 'solution_java', 
                             'input_test_case', 'output_test_case', 'question_type', 'difficulty', 'premium_required',
                             'pregiven_code_cpp', 'pregiven_code_python', 'pregiven_code_java'];
            
            $validUpdates = [];
            foreach ($updates as $field => $value) {
                if (in_array($field, $allowedFields)) {
                    $validUpdates[$field] = $value;
                }
            }
            
            if (empty($validUpdates)) {
                throw new Exception("No valid fields to update");
            }
            
            if (supabaseUpdateQuestion($questionId, $validUpdates)) {
                echo json_encode([
                    "status" => "success",
                    "message" => "Question updated successfully"
                ]);
            } else {
                throw new Exception("Failed to update question");
            }
            exit();
        }
    }
    
    // Handle GET requests for fetching all questions (admin)
    if (isset($_GET['action']) && $_GET['action'] === 'get_all_questions') {
        $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
        $limit = isset($_GET['limit']) ? max(1, min(100, intval($_GET['limit']))) : 50;
        $offset = ($page - 1) * $limit;
        
        // Get total count
        $totalCount = supabaseCount('Questions');
        
        // Fetch questions with pagination - select all columns
        $questions = supabaseSelect('Questions', [
            'order' => 'created_at.desc',
            'limit' => $limit,
            'offset' => $offset
        ], '*');
        
        if ($questions === false) {
            echo json_encode([
                "status" => "error",
                "message" => "Failed to fetch questions from database"
            ]);
            exit();
        }
        
        if (!$questions) $questions = [];
        
        // Get all company IDs for batch lookup
        $companyIds = array_unique(array_filter(array_column($questions, 'company_id')));
        $companiesMap = [];
        
        if (!empty($companyIds)) {
            // Batch fetch companies
            $companies = supabaseSelect('Companies', [
                'id' => 'in.(' . implode(',', $companyIds) . ')'
            ], 'id,name');
            
            if ($companies) {
                foreach ($companies as $company) {
                    $companiesMap[$company['id']] = $company['name'];
                }
            }
        }
        
        // Enrich with company name
        foreach ($questions as &$question) {
            $question['company_name'] = $companiesMap[$question['company_id']] ?? 'Unknown';
        }
        
        echo json_encode([
            "status" => "success",
            "data" => $questions,
            "total" => $totalCount,
            "page" => $page,
            "limit" => $limit,
            "hasMore" => ($offset + $limit) < $totalCount
        ]);
        exit();
    }

    // Handle GET requests for fetching a specific question by ID (admin)
    if (isset($_GET['action']) && $_GET['action'] === 'get_question_by_id' && isset($_GET['id'])) {
        $questionId = intval($_GET['id']);

        $question = supabaseGetQuestionById($questionId);

        if ($question) {
            // Get company name
            if ($question['company_id']) {
                $company = supabaseGetCompanyById((int)$question['company_id']);
                $question['company_name'] = $company['name'] ?? 'Unknown';
            } else {
                $question['company_name'] = 'Unknown';
            }
            
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
        exit();
    }

    // Handle GET requests for fetching questions by company name (admin)
    if (isset($_GET['action']) && $_GET['action'] === 'get_questions_by_company_name' && isset($_GET['name'])) {
        $companyName = $_GET['name'];

        // Search companies by name
        $companies = supabaseSearchCompanies($companyName);
        $questions = [];
        
        foreach ($companies as $company) {
            $companyQuestions = supabaseGetQuestionsByCompanyId((int)$company['id']);
            foreach ($companyQuestions as &$q) {
                $q['company_name'] = $company['name'];
            }
            $questions = array_merge($questions, $companyQuestions);
        }

        echo json_encode([
            "status" => "success",
            "data" => $questions
        ]);
        exit();
    }
    
    // Handle company search
    if (isset($_GET['action']) && $_GET['action'] === 'search') {
        $searchTerm = isset($_GET['q']) ? trim($_GET['q']) : '';
        
        if (empty($searchTerm)) {
            echo json_encode([
                "status" => "success",
                "data" => []
            ]);
            exit();
        }
        
        $companies = supabaseSearchCompanies($searchTerm);
        
        if (!empty($companies)) {
            // Get all company IDs for batch queries
            $companyIds = array_map(function($c) { return (int)$c['id']; }, $companies);
            
            // Batch fetch question counts and recent questions
            $questionCounts = supabaseGetQuestionCountsForCompanies($companyIds);
            $recentQuestions = supabaseGetRecentQuestionsForCompanies($companyIds, 2);
            
            // Enrich companies with the batch-fetched data
            foreach ($companies as &$company) {
                $companyId = (int)$company['id'];
                $company['question_count'] = $questionCounts[$companyId] ?? 0;
                $company['recent_questions'] = $recentQuestions[$companyId] ?? [];
            }
        }
        
        echo json_encode([
            "status" => "success",
            "data" => $companies
        ]);
        exit();
    }
    
    // Handle company creation
    if (isset($_GET['action']) && $_GET['action'] === 'create_company') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['name']) || empty($input['name'])) {
            throw new Exception("Company name is required");
        }

        $result = supabaseInsertCompany(
            $input['name'],
            $input['date'] ?? null,
            $input['solutions_available'] ?? false
        );
        
        if ($result) {
            echo json_encode([
                "status" => "success",
                "message" => "Company added successfully",
                "id" => $result['id']
            ]);
        } else {
            throw new Exception("Error adding company");
        }
        exit();
    }

    if (isset($_GET['id'])) {
        // Fetch single company by id
        $id = (int)$_GET['id'];
        $company = supabaseGetCompanyById($id);
        
        if ($company) {
            // Get question count
            $company['question_count'] = supabaseCountQuestions($id);
            
            // Get recent questions (limit 2)
            $questions = supabaseSelect('Questions', [
                'company_id' => 'eq.' . $id,
                'order' => 'created_at.desc',
                'limit' => 2
            ], 'title');
            
            $company['recent_questions'] = $questions ? array_column($questions, 'title') : [];
            
            echo json_encode([
                "status" => "success",
                "data" => $company
            ]);
        } else {
            echo json_encode([
                "status" => "error",
                "message" => "Company not found."
            ]);
        }
        
    } else {
        // Fetch companies with pagination
        $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
        $limit = isset($_GET['limit']) ? max(1, min(100, intval($_GET['limit']))) : 20;
        $offset = ($page - 1) * $limit;
        
        // Get total count of companies
        $totalCompanies = supabaseCountCompanies();
        $hasMore = ($offset + $limit) < $totalCompanies;
        
        // Fetch companies with pagination
        $companies = supabaseGetCompanies($limit, $offset);
        
        // Get all company IDs for batch queries
        $companyIds = array_map(function($c) { return (int)$c['id']; }, $companies);
        
        // Batch fetch question counts and recent questions (2 requests instead of 200+)
        $questionCounts = supabaseGetQuestionCountsForCompanies($companyIds);
        $recentQuestions = supabaseGetRecentQuestionsForCompanies($companyIds, 2);
        
        // Enrich companies with the batch-fetched data
        foreach ($companies as &$company) {
            $companyId = (int)$company['id'];
            $company['question_count'] = $questionCounts[$companyId] ?? 0;
            $company['recent_questions'] = $recentQuestions[$companyId] ?? [];
        }
        
        echo json_encode([
            "status" => "success",
            "data" => $companies,
            "hasMore" => $hasMore,
            "total" => $totalCompanies,
            "page" => $page,
            "limit" => $limit
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
?>
