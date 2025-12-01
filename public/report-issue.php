<?php

// Include database configuration first to get CORS functions
require_once __DIR__ . '/../db/config.php';
require_once __DIR__ . '/../db/supabase_client.php';

// Set CORS headers based on environment
setCorsHeaders();

/**
 * Report Issue API
 * Handles reporting of issues with questions and solutions
 */

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Validate API key
validateApiKey();

try {
    // We no longer rely on MySQL PDO. Using Supabase via REST.
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            echo json_encode(['status' => 'error', 'message' => 'Invalid JSON input']);
            exit;
        }
        
        $action = $input['action'] ?? '';
        
        if ($action === 'submit_report') {
            $type = $input['type'] ?? '';
            $question_id = $input['question_id'] ?? '';
            $user_email = $input['user_email'] ?? '';
            $description = $input['description'] ?? '';
            $question_link = $input['question_link'] ?? '';
            
            // Validate input
            if (empty($type) || empty($question_id) || empty($user_email) || empty($description) || empty($question_link)) {
                echo json_encode(['status' => 'error', 'message' => 'All fields are required']);
                exit;
            }
            
            if (!in_array($type, ['question', 'solution'])) {
                echo json_encode(['status' => 'error', 'message' => 'Invalid report type']);
                exit;
            }
            
            if (!filter_var($user_email, FILTER_VALIDATE_EMAIL)) {
                echo json_encode(['status' => 'error', 'message' => 'Invalid email address']);
                exit;
            }
            
            // Determine which table to use
            $table = $type === 'question' ? 'question_reports' : 'solution_reports';
            
            // Check if user has already reported this issue recently (within 24 hours)
            // Using Supabase to check.
            $oneDayAgo = date('Y-m-d H:i:s', strtotime('-24 hours'));
            $filters = [
                'question_id' => 'eq.' . $question_id,
                'user_email' => 'eq.' . $user_email,
                'created_at' => 'gt.' . $oneDayAgo
            ];
            
            $existing = supabaseSelect($table, $filters, 'id', true);
            
            if ($existing) {
                echo json_encode(['status' => 'error', 'message' => 'You have already reported this issue recently. Please wait 24 hours before reporting again.']);
                exit;
            }
            
            // Insert the report
            $payload = [
                'question_id' => $question_id,
                'user_email' => $user_email,
                'description' => $description,
                'question_link' => $question_link,
                'created_at' => gmdate('c')
            ];
            
            if (supabaseInsert($table, $payload)) {
                // We don't get ID back easily, but success implies it was created.
                echo json_encode([
                    'status' => 'success', 
                    'message' => 'Report submitted successfully'
                ]);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Failed to submit report']);
            }
            
        } elseif ($action === 'update_report_status') {
            $report_id = $input['report_id'] ?? '';
            $table_name = $input['table_name'] ?? '';
            $status = $input['status'] ?? '';
            $admin_notes = $input['admin_notes'] ?? null;
            
            // Validate input
            if (empty($report_id) || empty($table_name) || empty($status)) {
                echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
                exit;
            }
            
            if (!in_array($table_name, ['question_reports', 'solution_reports'])) {
                echo json_encode(['status' => 'error', 'message' => 'Invalid table name']);
                exit;
            }
            
            if (!in_array($status, ['pending', 'in_progress', 'resolved', 'dismissed'])) {
                echo json_encode(['status' => 'error', 'message' => 'Invalid status']);
                exit;
            }
            
            // Update the report
            $updateData = [
                'status' => $status,
                'admin_notes' => $admin_notes,
                'updated_at' => gmdate('c')
            ];
            
            if (supabasePatch($table_name, ['id' => 'eq.' . $report_id], $updateData)) {
                echo json_encode(['status' => 'success', 'message' => 'Report status updated successfully']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Failed to update report status']);
            }
            
        } elseif ($action === 'delete_report') {
            $report_id = $input['report_id'] ?? '';
            $table_name = $input['table_name'] ?? '';
            
            // Validate input
            if (empty($report_id) || empty($table_name)) {
                echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
                exit;
            }
            
            if (!in_array($table_name, ['question_reports', 'solution_reports'])) {
                echo json_encode(['status' => 'error', 'message' => 'Invalid table name']);
                exit;
            }
            
            // Delete the report
            if (supabaseDelete($table_name, ['id' => 'eq.' . $report_id])) {
                echo json_encode(['status' => 'success', 'message' => 'Report deleted successfully']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Failed to delete report']);
            }
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
        }
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get reports for admin (requires authentication check)
        $action = $_GET['action'] ?? '';
        
        if ($action === 'get_reports') {
            $type = $_GET['type'] ?? 'all';
            $status = $_GET['status'] ?? 'all';
            
            $filters = [];
            if ($status !== 'all') {
                $filters['status'] = 'eq.' . $status;
            }
            
            $all_reports = [];
            
            // Get question reports if type is 'all' or 'question'
            if ($type === 'all' || $type === 'question') {
                // Add order filter if possible
                $qFilters = $filters;
                $qFilters['order'] = 'created_at.desc';
                
                $question_reports = supabaseSelect('question_reports', $qFilters);
                if ($question_reports) {
                    foreach ($question_reports as &$r) {
                        $r['table_name'] = 'question_reports';
                    }
                    $all_reports = array_merge($all_reports, $question_reports);
                }
            }
            
            // Get solution reports if type is 'all' or 'solution'
            if ($type === 'all' || $type === 'solution') {
                $sFilters = $filters;
                $sFilters['order'] = 'created_at.desc';
                
                $solution_reports = supabaseSelect('solution_reports', $sFilters);
                if ($solution_reports) {
                    foreach ($solution_reports as &$r) {
                        $r['table_name'] = 'solution_reports';
                    }
                    $all_reports = array_merge($all_reports, $solution_reports);
                }
            }
            
            // Sort by created_at desc (since we merged two lists)
            usort($all_reports, function($a, $b) {
                return strtotime($b['created_at']) - strtotime($a['created_at']);
            });
        
            echo json_encode([
                    'status' => 'success',
                    'data' => $all_reports
            ]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
        }
        
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    }

} catch (Exception $e) {
    $error_msg = ($environment === 'development') ? 'Server error: ' . $e->getMessage() : 'Server error occurred';
    echo json_encode(['status' => 'error', 'message' => $error_msg]);
}
?> 