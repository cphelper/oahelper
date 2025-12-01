<?php
/**
 * Admin Authentication API
 * Supabase-only version
 */

require_once '../db/config.php';

// Set CORS headers
setCorsHeaders();

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Validate API key
validateApiKey();

header('Content-Type: application/json');

// Get request data
$request_body = file_get_contents('php://input');
$data = json_decode($request_body, true);
$action = $_GET['action'] ?? ($data['action'] ?? '');

/**
 * Verify admin credentials
 */
function verifyAdminCredentials($username, $password, $role) {
    // Check for ultra admin with hardcoded password
    if ($role === 'ultra_admin' && $password === 'Kam100hai@123') {
        return [
            'status' => 'success',
            'message' => 'Authentication successful',
            'data' => [
                'admin_id' => 0,
                'username' => 'ultra_admin',
                'email' => 'ultra@admin.com',
                'role' => 'ultra_admin',
                'last_login' => date('Y-m-d H:i:s')
            ]
        ];
    }
    
    // Check for regular admin from Supabase
    if ($role === 'admin') {
        $admin = supabaseGetAdminByUsername($username);
        
        if (!$admin) {
            return [
                'status' => 'error',
                'message' => 'Invalid credentials'
            ];
        }
        
        // Verify password
        if (password_verify($password, $admin['password_hash'])) {
            // Update last login time
            supabaseUpdateAdminLastLogin((int)$admin['id']);
            
            return [
                'status' => 'success',
                'message' => 'Authentication successful',
                'data' => [
                    'admin_id' => $admin['id'],
                    'username' => $admin['username'],
                    'email' => $admin['email'],
                    'role' => 'admin',
                    'last_login' => $admin['last_login']
                ]
            ];
        } else {
            return [
                'status' => 'error',
                'message' => 'Invalid credentials'
            ];
        }
    }
    
    return [
        'status' => 'error',
        'message' => 'Invalid credentials'
    ];
}

/**
 * Change admin password
 */
function changeAdminPassword($username, $old_password, $new_password) {
    // First verify old password
    $verify_result = verifyAdminCredentials($username, $old_password, 'admin');
    
    if ($verify_result['status'] !== 'success') {
        return [
            'status' => 'error',
            'message' => 'Current password is incorrect'
        ];
    }
    
    // Validate new password
    if (strlen($new_password) < 5) {
        return [
            'status' => 'error',
            'message' => 'New password must be at least 5 characters long'
        ];
    }
    
    // Get admin to get ID
    $admin = supabaseGetAdminByUsername($username);
    if (!$admin) {
        return [
            'status' => 'error',
            'message' => 'Admin not found'
        ];
    }
    
    // Update password
    $new_password_hash = password_hash($new_password, PASSWORD_BCRYPT);
    
    if (supabaseUpdateAdminPassword((int)$admin['id'], $new_password_hash)) {
        return [
            'status' => 'success',
            'message' => 'Password changed successfully'
        ];
    } else {
        return [
            'status' => 'error',
            'message' => 'Failed to change password'
        ];
    }
}

/**
 * Get admin info
 */
function getAdminInfo($username) {
    $admin = supabaseGetAdminByUsername($username);
    
    if (!$admin) {
        return [
            'status' => 'error',
            'message' => 'Admin not found'
        ];
    }
    
    return [
        'status' => 'success',
        'data' => [
            'id' => $admin['id'],
            'username' => $admin['username'],
            'email' => $admin['email'],
            'created_at' => $admin['created_at'],
            'last_login' => $admin['last_login']
        ]
    ];
}

// Handle different actions
try {
    switch ($action) {
        case 'login':
            $username = $data['username'] ?? 'admin';
            $password = $data['password'] ?? '';
            $role = $data['role'] ?? 'admin';
            
            if (empty($password)) {
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Password is required'
                ]);
                exit;
            }
            
            $result = verifyAdminCredentials($username, $password, $role);
            echo json_encode($result);
            break;
            
        case 'change_password':
            $username = $data['username'] ?? 'admin';
            $old_password = $data['old_password'] ?? '';
            $new_password = $data['new_password'] ?? '';
            
            if (empty($old_password) || empty($new_password)) {
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Both old and new passwords are required'
                ]);
                exit;
            }
            
            $result = changeAdminPassword($username, $old_password, $new_password);
            echo json_encode($result);
            break;
            
        case 'get_info':
            $username = $_GET['username'] ?? 'admin';
            $result = getAdminInfo($username);
            echo json_encode($result);
            break;
            
        default:
            echo json_encode([
                'status' => 'error',
                'message' => 'Invalid action. Received: ' . ($action ?: 'empty'),
                'debug' => [
                    'method' => $_SERVER['REQUEST_METHOD'],
                    'action' => $action,
                    'data_keys' => $data ? array_keys($data) : []
                ]
            ]);
            break;
    }
} catch (Exception $e) {
    $error_msg = ($environment === 'development') ? 'Server error: ' . $e->getMessage() : 'An internal error occurred';
    echo json_encode([
        'status' => 'error',
        'message' => $error_msg
    ]);
}
?>
