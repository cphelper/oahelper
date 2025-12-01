<?php

// Include database configuration first to get CORS functions
require_once __DIR__ . '/../db/config.php';
require_once __DIR__ . '/../db/supabase_client.php';

// Set CORS headers based on environment
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Validate API key
validateApiKey();

// require_once __DIR__ . '/../db/config.php'; // Already included

try {
    // We no longer use MySQL $conn
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Fetch all issues
        // Using Supabase
        $issues = supabaseSelect('issues', ['order' => 'created_at.desc']);
        
        if ($issues === false) {
            throw new Exception("Error fetching issues from Supabase");
        }
        
        echo json_encode([
            "status" => "success",
            "data" => $issues
        ]);
        
    } else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? '';
        
        if ($action === 'update_status') {
            $issueId = $input['issue_id'] ?? 0;
            $status = $input['status'] ?? '';
            
            if (!$issueId || !$status) {
                throw new Exception("Issue ID and status are required");
            }
            
            $validStatuses = ['pending', 'in_progress', 'resolved'];
            if (!in_array($status, $validStatuses)) {
                throw new Exception("Invalid status");
            }
            
            if (supabasePatch('issues', ['id' => 'eq.' . $issueId], ['status' => $status])) {
                echo json_encode([
                    "status" => "success",
                    "message" => "Issue status updated successfully"
                ]);
            } else {
                throw new Exception("Error updating issue status");
            }
            
        } else if ($action === 'delete') {
            $issueId = $input['issue_id'] ?? 0;
            
            if (!$issueId) {
                throw new Exception("Issue ID is required");
            }
            
            if (supabaseDelete('issues', ['id' => 'eq.' . $issueId])) {
                echo json_encode([
                    "status" => "success",
                    "message" => "Issue deleted successfully"
                ]);
            } else {
                throw new Exception("Error deleting issue");
            }
            
        } else if ($action === 'submit_issue') {
            $issueText = $input['issue'] ?? '';
            $pageUrl = $input['page_url'] ?? '';
            $userId = $input['user_id'] ?? null;
            
            if (empty($issueText)) {
                throw new Exception("Issue description is required");
            }
            
            // Note: Issues table might use legacy user_id int.
            // If user_id is passed, we check if it is int or uuid.
            // If the table 'issues' has user_id as int, we might need profile mapping if uuid is passed.
            // Assuming we use the ID passed.
            
            $payload = [
                'user_id' => $userId,
                'issue_text' => $issueText,
                'page_url' => $pageUrl,
                'status' => 'pending',
                'created_at' => gmdate('c')
            ];
            
            if (supabaseInsert('issues', $payload)) {
                echo json_encode([
                    "status" => "success",
                    "message" => "Issue submitted successfully"
                ]);
            } else {
                throw new Exception("Error submitting issue");
            }
            
        } else {
            throw new Exception("Invalid action");
        }
    }
    
    // $conn->close();

} catch (Exception $e) {
    error_log("Error in admin-issues.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
?> 