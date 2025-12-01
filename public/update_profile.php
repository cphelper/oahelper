<?php

// Include database configuration first to get CORS functions
require_once __DIR__ . '/../db/config.php';
require_once __DIR__ . '/../db/supabase_client.php';

// Set CORS headers based on environment
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Validate API key
validateApiKey();

// Database connection via db/config.php
// We no longer rely on MySQL $conn for profiles.

$input = json_decode(file_get_contents('php://input'), true);

$action = isset($input['action']) ? $input['action'] : '';

// Handle different actions
switch ($action) {
    case 'update_profile':
        $name = isset($input['name']) ? trim($input['name']) : null;
        $userId = isset($input['user_id']) ? $input['user_id'] : null;

        if (!$name || !$userId) {
            echo json_encode([
                "status" => "error",
                "message" => "Name and user ID are required"
            ]);
            exit();
        }

        // Get UUID from userId (which might be int or uuid)
        $profile = null;
        if (is_numeric($userId)) {
            $profile = supabaseGetProfileByLegacyId((int)$userId);
        } else {
            $profile = supabaseGetProfile($userId);
        }
        
        if (!$profile) {
             echo json_encode([
                "status" => "error",
                "message" => "User not found"
            ]);
            exit();
        }

        // Update user profile
        if (supabasePatch('profiles', ['id' => 'eq.' . $profile['id']], ['name' => $name, 'updated_at' => gmdate('c')])) {
            echo json_encode([
                "status" => "success",
                "message" => "Profile updated successfully"
            ]);
        } else {
            echo json_encode([
                "status" => "error",
                "message" => "Failed to update profile"
            ]);
        }
        break;

    case 'change_password':
        $currentPassword = isset($input['current_password']) ? $input['current_password'] : null;
        $newPassword = isset($input['new_password']) ? $input['new_password'] : null;
        $userId = isset($input['user_id']) ? $input['user_id'] : null;

        if (!$currentPassword || !$newPassword || !$userId) {
            echo json_encode([
                "status" => "error",
                "message" => "Current password, new password, and user ID are required"
            ]);
            exit();
        }

        // 1. Get user profile
        $profile = null;
        if (is_numeric($userId)) {
            $profile = supabaseGetProfileByLegacyId((int)$userId);
        } else {
            $profile = supabaseGetProfile($userId);
        }
        
        if (!$profile) {
             echo json_encode([
                "status" => "error",
                "message" => "User not found"
            ]);
            exit();
        }
        
        // 2. Verify current password via Auth Login
        // Note: Supabase Admin API doesn't verify old password on update. 
        // We must try to login with current password to verify identity.
        $login = supabaseSignIn($profile['email'], $currentPassword);
        
        if (!$login['success']) {
             echo json_encode([
                "status" => "error",
                "message" => "Current password is incorrect"
            ]);
            exit();
        }
        
        // 3. Update password via Admin API
        if (supabaseAdminUpdateUserPassword($profile['id'], $newPassword)) {
             echo json_encode([
                "status" => "success",
                "message" => "Password changed successfully"
            ]);
        } else {
            echo json_encode([
                "status" => "error",
                "message" => "Failed to change password"
            ]);
        }
        break;

    default:
        echo json_encode([
            "status" => "error",
            "message" => "Invalid action"
        ]);
        break;
}
?>


