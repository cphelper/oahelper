<?php
// public/placement-data.php
// Supabase version

error_reporting(0);
ini_set('display_errors', 0);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../db/config.php';
require_once '../db/supabase_client.php';

require_once __DIR__ . '/phpmailer/src/Exception.php';
require_once __DIR__ . '/phpmailer/src/PHPMailer.php';
require_once __DIR__ . '/phpmailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

function getMailer() {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = 'smtp.hostinger.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'support@oahelper.in';
    $mail->Password = 'Kam25hai@123';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port = 465;
    $mail->setFrom('support@oahelper.in', 'OAHelper');
    return $mail;
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';

if (empty($action)) {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    if ($data && isset($data['action'])) {
        $action = $data['action'];
    }
}

try {
    switch ($action) {
        case 'get_all':
            getAllPlacementData();
            break;
        case 'get_by_college':
            getByCollege();
            break;
        case 'get_by_company':
            getByCompany();
            break;
        case 'search':
            searchPlacementData();
            break;
        case 'add':
            addPlacementData();
            break;
        case 'submit':
            submitPlacementData();
            break;
        case 'get_unverified':
            getUnverifiedPlacements();
            break;
        case 'verify_placement':
            verifyPlacement();
            break;
        case 'delete_placement':
            deletePlacementEntry();
            break;
        case 'get_verified_placements':
            getVerifiedPlacements();
            break;
        case 'bulk_reward_placements':
            bulkRewardPlacements();
            break;
        case 'update':
            updatePlacementData();
            break;
        case 'delete':
            deletePlacementData();
            break;
        case 'get_colleges':
            getUniqueColleges();
            break;
        case 'get_companies':
            getUniqueCompanies();
            break;
        default:
            echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Server error: ' . $e->getMessage()]);
}

function getAllPlacementData() {
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
    $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    
    $limit = max(1, min(100, $limit));
    $offset = max(0, $offset);
    
    $filters = ['verified' => 'eq.true', 'order' => 'created_at.desc', 'limit' => $limit, 'offset' => $offset];
    
    if (!empty($search)) {
        $filters['or'] = '(college.ilike.*' . $search . '*,company.ilike.*' . $search . '*,role.ilike.*' . $search . '*)';
    }
    
    $totalFilters = ['verified' => 'eq.true'];
    if (!empty($search)) {
        $totalFilters['or'] = '(college.ilike.*' . $search . '*,company.ilike.*' . $search . '*,role.ilike.*' . $search . '*)';
    }
    $total_count = supabaseCount('PlacementData', $totalFilters);
    
    $data = supabaseSelect('PlacementData', $filters);
    
    echo json_encode([
        'status' => 'success',
        'data' => $data ?: [],
        'count' => count($data ?: []),
        'total' => $total_count,
        'offset' => $offset,
        'limit' => $limit,
        'has_more' => ($offset + $limit) < $total_count,
        'search' => $search
    ]);
}

function getByCollege() {
    $college = $_GET['college'] ?? '';
    if (empty($college)) {
        echo json_encode(['status' => 'error', 'message' => 'College name is required']);
        return;
    }
    
    $data = supabaseSelect('PlacementData', ['college' => 'eq.' . $college, 'order' => 'created_at.desc']);
    echo json_encode(['status' => 'success', 'data' => $data ?: [], 'count' => count($data ?: [])]);
}

function getByCompany() {
    $company = $_GET['company'] ?? '';
    if (empty($company)) {
        echo json_encode(['status' => 'error', 'message' => 'Company name is required']);
        return;
    }
    
    $data = supabaseSelect('PlacementData', ['company' => 'eq.' . $company, 'order' => 'created_at.desc']);
    echo json_encode(['status' => 'success', 'data' => $data ?: [], 'count' => count($data ?: [])]);
}

function searchPlacementData() {
    $searchTerm = $_GET['search'] ?? '';
    $college = $_GET['college'] ?? '';
    $company = $_GET['company'] ?? '';
    
    $filters = ['order' => 'created_at.desc'];
    
    if (!empty($searchTerm)) {
        $filters['or'] = '(college.ilike.*' . $searchTerm . '*,company.ilike.*' . $searchTerm . '*,role.ilike.*' . $searchTerm . '*,other_info.ilike.*' . $searchTerm . '*)';
    }
    if (!empty($college)) {
        $filters['college'] = 'eq.' . $college;
    }
    if (!empty($company)) {
        $filters['company'] = 'eq.' . $company;
    }
    
    $data = supabaseSelect('PlacementData', $filters);
    echo json_encode(['status' => 'success', 'data' => $data ?: [], 'count' => count($data ?: [])]);
}

function addPlacementData() {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $required = ['timestamp', 'college', 'company'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            echo json_encode(['status' => 'error', 'message' => "Field '$field' is required"]);
            return;
        }
    }
    
    $payload = [
        'timestamp' => $data['timestamp'],
        'college' => $data['college'],
        'company' => $data['company'],
        'role' => $data['role'] ?? null,
        'oa_date' => $data['oa_date'] ?? null,
        'oa_time' => $data['oa_time'] ?? null,
        'cgpa_criteria' => $data['cgpa_criteria'] ?? null,
        'mtech_eligible' => $data['mtech_eligible'] ?? null,
        'ctc_base' => $data['ctc_base'] ?? null,
        'other_info' => $data['other_info'] ?? null,
        'verified' => true,
        'created_at' => gmdate('c')
    ];
    
    $result = supabaseInsertPlacementData($payload);
    
    if ($result) {
        echo json_encode(['status' => 'success', 'message' => 'Placement data added successfully', 'id' => $result['id']]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to add placement data']);
    }
}

function submitPlacementData() {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $required = ['college', 'company', 'role', 'user_email'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            echo json_encode(['status' => 'error', 'message' => "Field '$field' is required"]);
            return;
        }
    }
    
    if (!filter_var($data['user_email'], FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid email address']);
        return;
    }
    
    $payload = [
        'timestamp' => date('Y-m-d H:i:s'),
        'college' => $data['college'],
        'company' => $data['company'],
        'role' => $data['role'],
        'oa_date' => $data['oa_date'] ?? null,
        'oa_time' => $data['oa_time'] ?? null,
        'cgpa_criteria' => $data['cgpa_criteria'] ?? null,
        'mtech_eligible' => $data['mtech_eligible'] ?? null,
        'ctc_base' => $data['ctc_base'] ?? null,
        'other_info' => $data['other_info'] ?? null,
        'user_email' => $data['user_email'],
        'verified' => false,
        'created_at' => gmdate('c')
    ];
    
    $result = supabaseInsertPlacementData($payload);
    
    if ($result) {
        echo json_encode(['status' => 'success', 'message' => 'Thank you! Your submission is under review.', 'id' => $result['id']]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to submit placement data']);
    }
}

function updatePlacementData() {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['id'])) {
        echo json_encode(['status' => 'error', 'message' => 'ID is required']);
        return;
    }
    
    $updateData = [
        'timestamp' => $data['timestamp'] ?? null,
        'college' => $data['college'] ?? null,
        'company' => $data['company'] ?? null,
        'role' => $data['role'] ?? null,
        'oa_date' => $data['oa_date'] ?? null,
        'oa_time' => $data['oa_time'] ?? null,
        'cgpa_criteria' => $data['cgpa_criteria'] ?? null,
        'mtech_eligible' => $data['mtech_eligible'] ?? null,
        'ctc_base' => $data['ctc_base'] ?? null,
        'other_info' => $data['other_info'] ?? null,
        'updated_at' => gmdate('c')
    ];
    
    $updateData = array_filter($updateData, fn($v) => $v !== null);
    
    if (supabasePatch('PlacementData', ['id' => 'eq.' . $data['id']], $updateData)) {
        echo json_encode(['status' => 'success', 'message' => 'Placement data updated successfully']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to update placement data']);
    }
}

function deletePlacementData() {
    $id = $_GET['id'] ?? $_POST['id'] ?? '';
    
    if (empty($id)) {
        echo json_encode(['status' => 'error', 'message' => 'ID is required']);
        return;
    }
    
    if (supabaseDelete('PlacementData', ['id' => 'eq.' . $id])) {
        echo json_encode(['status' => 'success', 'message' => 'Placement data deleted successfully']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to delete placement data']);
    }
}

function getUniqueColleges() {
    $data = supabaseSelect('PlacementData', ['order' => 'college.asc'], 'college');
    $colleges = array_unique(array_column($data ?: [], 'college'));
    echo json_encode(['status' => 'success', 'data' => array_values($colleges)]);
}

function getUniqueCompanies() {
    $data = supabaseSelect('PlacementData', ['order' => 'company.asc'], 'company');
    $companies = array_unique(array_column($data ?: [], 'company'));
    echo json_encode(['status' => 'success', 'data' => array_values($companies)]);
}

function getUnverifiedPlacements() {
    $data = supabaseSelect('PlacementData', ['verified' => 'eq.false', 'order' => 'created_at.desc']);
    
    if ($data) {
        foreach ($data as &$row) {
            if (!empty($row['user_email'])) {
                $verifiedCount = supabaseCount('PlacementData', ['user_email' => 'eq.' . $row['user_email'], 'verified' => 'eq.true']);
                $row['user_submission_count'] = $verifiedCount;
                $futureCount = $verifiedCount + 1;
                $row['suggested_oacoins'] = $futureCount == 1 ? 4 : ($futureCount == 2 ? 2 : 1);
            } else {
                $row['user_submission_count'] = 0;
                $row['suggested_oacoins'] = 4;
            }
        }
    }
    
    echo json_encode(['status' => 'success', 'data' => $data ?: [], 'count' => count($data ?: [])]);
}

function verifyPlacement() {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['placement_id'])) {
        echo json_encode(['status' => 'error', 'message' => 'Placement ID is required']);
        return;
    }
    
    $placement = supabaseSelect('PlacementData', ['id' => 'eq.' . $data['placement_id']], '*', true);
    
    if (!$placement || empty($placement['user_email'])) {
        echo json_encode(['status' => 'error', 'message' => 'Placement not found or no user email']);
        return;
    }
    
    if (!supabasePatch('PlacementData', ['id' => 'eq.' . $data['placement_id']], ['verified' => true, 'updated_at' => gmdate('c')])) {
        echo json_encode(['status' => 'error', 'message' => 'Failed to verify placement']);
        return;
    }
    
    if (isset($data['oacoins_amount']) && $data['oacoins_amount'] > 0) {
        $oacoins_amount = intval($data['oacoins_amount']);
        $user = supabaseGetProfileByEmail($placement['user_email']);
        
        if ($user) {
            $currentCoins = $user['oacoins'] ?? 0;
            $newBalance = $currentCoins + $oacoins_amount;
            
            supabaseUpdateProfile($user['id'], ['oacoins' => $newBalance]);
            
            if ($user['mysql_user_id']) {
                supabaseInsertOacoinsTransaction($user['mysql_user_id'], $oacoins_amount, 'credit', 'Placement data verification reward', $newBalance);
            }
            
            try {
                $mail = getMailer();
                $mail->addAddress($user['email'], $user['name']);
                $mail->isHTML(true);
                $mail->Subject = 'Placement Data Verified - OACoins Reward';
                $mail->Body = "
                    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                        <div style='background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;'>
                            <h1 style='color: white; margin: 0;'>🎉 Placement Data Verified!</h1>
                        </div>
                        <div style='padding: 30px; background: #f8f9fa;'>
                            <p>Hi <strong>{$user['name']}</strong>,</p>
                            <p>Your placement data for <strong>{$placement['company']}</strong> has been verified!</p>
                            <div style='background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;'>
                                <h3 style='color: white; margin: 0;'>+{$oacoins_amount} OACoins</h3>
                                <p style='color: white; margin: 5px 0;'>New Balance: {$newBalance}</p>
                            </div>
                        </div>
                    </div>";
                $mail->send();
            } catch (Exception $e) {
                error_log("Mailer Error: " . $e->getMessage());
            }
            
            echo json_encode(['status' => 'success', 'message' => "Placement verified and {$oacoins_amount} OACoins added"]);
        } else {
            echo json_encode(['status' => 'success', 'message' => 'Placement verified but user not found for reward']);
        }
    } else {
        echo json_encode(['status' => 'success', 'message' => 'Placement verified successfully']);
    }
}

function deletePlacementEntry() {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['placement_id'])) {
        echo json_encode(['status' => 'error', 'message' => 'Placement ID is required']);
        return;
    }
    
    if (supabaseDelete('PlacementData', ['id' => 'eq.' . $data['placement_id']])) {
        echo json_encode(['status' => 'success', 'message' => 'Placement deleted successfully']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to delete placement']);
    }
}

function getVerifiedPlacements() {
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
    $limit = max(1, min(1000, $limit));
    
    $data = supabaseSelect('PlacementData', [
        'verified' => 'eq.true',
        'user_email' => 'neq.',
        'order' => 'created_at.desc',
        'limit' => $limit
    ]);
    
    if ($data) {
        foreach ($data as &$row) {
            $count = supabaseCount('PlacementData', ['user_email' => 'eq.' . $row['user_email'], 'verified' => 'eq.true']);
            $row['user_submission_count'] = $count;
            $row['suggested_oacoins'] = $count == 1 ? 4 : ($count == 2 ? 2 : 1);
        }
    }
    
    echo json_encode(['status' => 'success', 'data' => $data ?: [], 'count' => count($data ?: [])]);
}

function bulkRewardPlacements() {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['placement_ids']) || !is_array($data['placement_ids'])) {
        echo json_encode(['status' => 'error', 'message' => 'Placement IDs array is required']);
        return;
    }
    
    if (empty($data['oacoins_amount']) || $data['oacoins_amount'] <= 0) {
        echo json_encode(['status' => 'error', 'message' => 'Valid OACoins amount is required']);
        return;
    }
    
    $oacoins_amount = intval($data['oacoins_amount']);
    $success_count = 0;
    $error_count = 0;
    
    foreach ($data['placement_ids'] as $placement_id) {
        $placement = supabaseSelect('PlacementData', ['id' => 'eq.' . $placement_id, 'verified' => 'eq.true'], '*', true);
        
        if (!$placement || empty($placement['user_email'])) {
            $error_count++;
            continue;
        }
        
        $user = supabaseGetProfileByEmail($placement['user_email']);
        if (!$user) {
            $error_count++;
            continue;
        }
        
        $currentCoins = $user['oacoins'] ?? 0;
        $newBalance = $currentCoins + $oacoins_amount;
        
        supabaseUpdateProfile($user['id'], ['oacoins' => $newBalance]);
        
        if ($user['mysql_user_id']) {
            supabaseInsertOacoinsTransaction($user['mysql_user_id'], $oacoins_amount, 'credit', 'Bulk placement reward', $newBalance);
        }
        
        $success_count++;
    }
    
    echo json_encode([
        'status' => 'success',
        'message' => "Rewarded {$success_count} users, {$error_count} errors",
        'success_count' => $success_count,
        'error_count' => $error_count
    ]);
}
?>
