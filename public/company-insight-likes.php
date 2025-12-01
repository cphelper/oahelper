<?php
require_once __DIR__ . '/../db/config.php';
require_once __DIR__ . '/../db/supabase_client.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get client IP
function getClientIP() {
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        return $_SERVER['HTTP_CLIENT_IP'];
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        return explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0];
    }
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    
    if ($action === 'get_likes') {
        // Get like counts for all companies
        try {
            $result = supabaseSelect('company_insight_like_counts', [], '*');
            
            $likeCounts = [];
            if ($result && is_array($result)) {
                foreach ($result as $row) {
                    $likeCounts[$row['company_name']] = (int)$row['like_count'];
                }
            }
            
            echo json_encode(['status' => 'success', 'data' => $likeCounts]);
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    } elseif ($action === 'check_liked') {
        // Check if user has liked a company
        $company_name = $_GET['company_name'] ?? '';
        $user_id = $_GET['user_id'] ?? null;
        $ip_address = getClientIP();
        
        if (empty($company_name)) {
            echo json_encode(['status' => 'error', 'message' => 'Company name required']);
            exit;
        }
        
        try {
            $filters = ['company_name' => 'eq.' . $company_name];
            
            if ($user_id) {
                $filters['user_id'] = 'eq.' . $user_id;
            } else {
                $filters['ip_address'] = 'eq.' . $ip_address;
            }
            
            $result = supabaseSelect('company_insight_likes', $filters, 'id');
            $hasLiked = !empty($result);
            
            echo json_encode(['status' => 'success', 'has_liked' => $hasLiked]);
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    if ($action === 'toggle_like') {
        $company_name = $input['company_name'] ?? '';
        $user_id = $input['user_id'] ?? null;
        $ip_address = getClientIP();
        
        if (empty($company_name)) {
            echo json_encode(['status' => 'error', 'message' => 'Company name required']);
            exit;
        }
        
        try {
            // Check if already liked
            $filters = ['company_name' => 'eq.' . $company_name];
            
            if ($user_id) {
                $filters['user_id'] = 'eq.' . $user_id;
            } else {
                $filters['ip_address'] = 'eq.' . $ip_address;
            }
            
            $existing = supabaseSelect('company_insight_likes', $filters, 'id');
            
            if (!empty($existing)) {
                // Unlike - delete the record
                supabaseDelete('company_insight_likes', $filters);
                $liked = false;
            } else {
                // Like - insert new record
                $data = [
                    'company_name' => $company_name,
                    'ip_address' => $ip_address
                ];
                if ($user_id) {
                    $data['user_id'] = $user_id;
                }
                
                supabaseInsert('company_insight_likes', $data);
                $liked = true;
            }
            
            // Get updated count from the view
            $countResult = supabaseSelect('company_insight_like_counts', ['company_name' => 'eq.' . $company_name], 'like_count', true);
            
            $newCount = 0;
            if ($countResult && isset($countResult['like_count'])) {
                $newCount = (int)$countResult['like_count'];
            }
            
            echo json_encode([
                'status' => 'success',
                'liked' => $liked,
                'like_count' => $newCount
            ]);
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
}
