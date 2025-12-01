<?php
// public/solution-requests.php - API for solution code request functionality

// Include database configuration first to get CORS functions
require_once __DIR__ . '/../db/config.php';
require_once __DIR__ . '/../db/supabase_client.php';

// Set CORS headers based on environment
setCorsHeaders();

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Validate API key
validateApiKey();

// require_once '../db/config.php'; // Already included

function sendJsonResponse($status, $message, $data = null) {
    echo json_encode([
        "status" => $status,
        "message" => $message,
        "data" => $data
    ]);
    exit();
}

// Get user's daily solution limit based on subscription plan
function getUserDailyLimit($user_id) {
    // Determine legacy user ID
    $legacy_id = $user_id;
    if (is_string($user_id) && strlen($user_id) > 20) {
        $profile = supabaseGetProfile($user_id);
        $legacy_id = $profile['mysql_user_id'] ?? 0;
    }

    $filters = [
        'user_id' => 'eq.' . $legacy_id,
        'status' => 'eq.active',
        'end_date' => 'gt.now'
    ];
    $subscriptions = supabaseSelect('premium_subscriptions', array_merge($filters, ['order' => 'end_date.desc']), '*', false);
    
    if (!$subscriptions || count($subscriptions) === 0) {
        return 0; // No active subscription
    }
    
    $subscription = $subscriptions[0];

    // Determine daily limit based on amount
    $amount = (float)$subscription['amount'];
    if ($amount >= 299) {
        return -1; // Unlimited
    } elseif ($amount >= 199) {
        return 15; // Pro plan
    } else {
        return 5; // Basic plan
    }
}

// Check if user can request solution based on their plan
function canUserRequestSolution($user_id) {
    $daily_limit = getUserDailyLimit($user_id);
    
    if ($daily_limit === -1) {
        return true;
    }

    if ($daily_limit === 0) {
        return false;
    }

    $today = date('Y-m-d');
    
    // Resolve UUID to int ID if necessary for legacy tables?
    // user_daily_requests uses TEXT for user_id now.
    // So we can pass UUID or int string directly.
    
    $request_count = supabaseGetDailyRequestCount($user_id, $today);

    // If null, it means 0 or error.
    if ($request_count === null) {
        $request_count = 0;
    }

    return $request_count < $daily_limit;
}

// Update or insert daily request count via Supabase
function updateDailyRequestCount($user_id) {
    $today = date('Y-m-d');
    // Using Supabase only
    supabaseIncrementDailyRequestCount($user_id, $today);
}

// Check if user already requested solution for this question today
function hasUserRequestedToday($user_id, $question_id) {
    $today = date('Y-m-d');
    
    // Check Supabase solution_requests table (needs migration or we use legacy table)
    // Assuming migration happened and we use Supabase table.
    
    $filters = [
        'user_id' => 'eq.' . $user_id,
        'question_id' => 'eq.' . $question_id,
        'request_date' => 'eq.' . $today
    ];
    
    $count = supabaseCount('solution_requests', $filters);
    return $count > 0;
}

try {
    $action = isset($_GET['action']) ? $_GET['action'] : '';

    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            if ($action === 'get_daily_request_count') {
                // Get user's daily request count
                if (!isset($_GET['user_id'])) {
                    sendJsonResponse('error', 'User ID is required');
                }

                $user_id = intval($_GET['user_id']);
                $today = date('Y-m-d');

                // Get user's daily limit based on their plan
                $daily_limit = getUserDailyLimit($user_id);

                // Check today's request count via Supabase
                $request_count = supabaseGetDailyRequestCount($user_id, $today);
                if ($request_count === null) {
                    $request_count = 0; // fallback default
                }
                $request_count = (int)$request_count;
                $remaining_requests = $daily_limit === -1 ? -1 : max(0, $daily_limit - $request_count);

                sendJsonResponse('success', 'Daily request count retrieved', [
                    'request_count' => $request_count,
                    'remaining_requests' => $remaining_requests,
                    'daily_limit' => $daily_limit,
                    'is_unlimited' => $daily_limit === -1,
                    'reset_date' => date('Y-m-d', strtotime('+1 day'))
                ]);

            } elseif ($action === 'get_solution') {
                // Direct solution fetching from Questions table
                error_log("=== GET SOLUTION API CALLED ===");
                
                if (!isset($_GET['user_id']) || !isset($_GET['question_id'])) {
                    sendJsonResponse("error", "User ID and Question ID are required");
                }

                $user_id = $_GET['user_id']; // Can be int or UUID
                $question_id = (int)$_GET['question_id'];

                // Check if user is premium (has active subscription)
                $legacy_id = $user_id;
                if (is_string($user_id) && strlen($user_id) > 20) {
                    $profile = supabaseGetProfile($user_id);
                    $legacy_id = $profile['mysql_user_id'] ?? 0;
                }
                
                $filters = [
                    'user_id' => 'eq.' . $legacy_id,
                    'status' => 'eq.active',
                    'end_date' => 'gt.now'
                ];
                $subscriptions = supabaseSelect('premium_subscriptions', $filters, 'id', true);
                $is_premium = ($subscriptions !== null);

                if (!$is_premium) {
                    sendJsonResponse("error", "Premium subscription required to access solution codes");
                }

                // Check if user has already viewed this solution (don't charge again)
                $viewFilters = [
                    'user_id' => 'eq.' . $user_id, 
                    'question_id' => 'eq.' . $question_id
                ];
                $solution_view = supabaseSelect('user_solution_views', $viewFilters, 'id, view_count', true);
                
                $has_viewed_before = $solution_view !== null;

                // Check daily limit (only if not already viewed before)
                if (!$has_viewed_before) {
                    $can_request = canUserRequestSolution($user_id);

                    if (!$can_request) {
                        $daily_limit = getUserDailyLimit($user_id);
                        $limit_message = $daily_limit === -1 ? "unlimited" : $daily_limit;
                        sendJsonResponse("error", "Daily limit reached. Your plan allows up to {$limit_message} solution codes per day.");
                    }
                }

                // Get solution from Questions table
                // Using Supabase to fetch Question
                $question = supabaseSelect('questions', ['id' => 'eq.' . $question_id], 'solution_cpp, company_id', true);

                if (!$question || empty($question['solution_cpp'])) {
                    sendJsonResponse("error", "Solution not available for this question");
                }

                // Update daily request count (only if not already viewed before)
                if (!$has_viewed_before) {
                    updateDailyRequestCount($user_id);
                }

                // Record or update solution view
                if ($has_viewed_before) {
                    // Update existing view record
                    $newCount = ($solution_view['view_count'] ?? 0) + 1;
                    supabasePatch('user_solution_views', ['id' => 'eq.' . $solution_view['id']], ['view_count' => $newCount, 'last_viewed_at' => gmdate('c')]);
                } else {
                    // Create new view record
                    $payload = [
                        'user_id' => $user_id,
                        'question_id' => $question_id,
                        'company_id' => $question['company_id'],
                        'view_count' => 1,
                        'last_viewed_at' => gmdate('c')
                    ];
                    supabaseInsert('user_solution_views', $payload);
                }

                sendJsonResponse("success", "Solution retrieved successfully", [
                    'solution' => $question['solution_cpp']
                ]);

            } elseif ($action === 'check_request_status') {
                if (!isset($_GET['user_id']) || !isset($_GET['question_id'])) {
                    sendJsonResponse("error", "User ID and Question ID are required");
                }

                $user_id = $_GET['user_id'];
                $question_id = (int)$_GET['question_id'];

                // Check if user is premium (has active subscription)
                $legacy_id = $user_id;
                if (is_string($user_id) && strlen($user_id) > 20) {
                    $profile = supabaseGetProfile($user_id);
                    $legacy_id = $profile['mysql_user_id'] ?? 0;
                }
                
                $filters = [
                    'user_id' => 'eq.' . $legacy_id,
                    'status' => 'eq.active',
                    'end_date' => 'gt.now'
                ];
                $subscriptions = supabaseSelect('premium_subscriptions', $filters, 'id', true);
                $is_premium = ($subscriptions !== null);

                if (!$is_premium) {
                    sendJsonResponse("error", "Premium subscription required to request solution codes");
                }

                $can_request = canUserRequestSolution($user_id);
                $already_requested = hasUserRequestedToday($user_id, $question_id);

                sendJsonResponse("success", "Request status checked", [
                    'can_request' => $can_request && !$already_requested,
                    'already_requested' => $already_requested,
                    'daily_limit_reached' => !$can_request
                ]);

            } elseif ($action === 'get_requests') {
                // Admin function to get all solution requests
                // Join sequence: solution_requests -> users (profiles in Supabase?), questions, companies
                // Solution requests might use legacy user IDs.
                // We'll need to join manually or use embedded resources if relations exist.
                // Assuming relations: solution_requests.user_id -> profiles.mysql_user_id might be hard.
                // Let's just fetch requests and enrich.
                
                $requests = supabaseSelect('solution_requests', ['order' => 'created_at.desc']);
                
                if ($requests === false) {
                    $requests = [];
                }
                
                // Enrich data manually if joins are complex or missing relations
                // Ideally we should have relations defined in Supabase.
                
                sendJsonResponse("success", "Solution requests retrieved", $requests);
            }
            break;

        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);

            if ($action === 'request_solution') {
                $required_fields = ['user_id', 'question_id', 'company_id'];
                foreach ($required_fields as $field) {
                    if (!isset($input[$field]) || empty($input[$field])) {
                        sendJsonResponse("error", "Missing required field: $field");
                    }
                }

                $user_id = $input['user_id'];
                $question_id = (int)$input['question_id'];
                $company_id = (int)$input['company_id'];
                $requested_language = isset($input['requested_language']) ? $input['requested_language'] : 'cpp';

                // Check if user is premium (has active subscription)
                $legacy_id = $user_id;
                if (is_string($user_id) && strlen($user_id) > 20) {
                    $profile = supabaseGetProfile($user_id);
                    $legacy_id = $profile['mysql_user_id'] ?? 0;
                }
                
                $filters = [
                    'user_id' => 'eq.' . $legacy_id,
                    'status' => 'eq.active',
                    'end_date' => 'gt.now'
                ];
                $subscriptions = supabaseSelect('premium_subscriptions', $filters, 'id', true);
                $is_premium = ($subscriptions !== null);

                if (!$is_premium) {
                    sendJsonResponse("error", "Premium subscription required to request solution codes");
                }

                // Check daily limit
                if (!canUserRequestSolution($user_id)) {
                    $daily_limit = getUserDailyLimit($user_id);
                    $limit_message = $daily_limit === -1 ? "unlimited" : $daily_limit;
                    sendJsonResponse("error", "Daily limit reached. Your plan allows up to {$limit_message} solution codes per day.");
                }

                // Check if already requested today
                if (hasUserRequestedToday($user_id, $question_id)) {
                    sendJsonResponse("error", "You have already requested the solution for this question today.");
                }

                // Create solution request
                $today = date('Y-m-d');
                $payload = [
                    'user_id' => $user_id, // can be uuid or int string
                    'question_id' => $question_id,
                    'company_id' => $company_id,
                    'request_date' => $today,
                    'requested_language' => $requested_language,
                    'status' => 'pending',
                    'created_at' => gmdate('c')
                ];
                
                if (supabaseInsert('solution_requests', $payload)) {
                    // Update daily request count
                    updateDailyRequestCount($user_id);

                    // Send email notification to admin (Optional: could skip if relying on admin panel)
                    // We'll skip sending email here to simplify, or assume mailer works
                    
                    sendJsonResponse("success", "Solution request submitted successfully. Admin will review and send the code.");
                } else {
                    sendJsonResponse("error", "Failed to submit solution request");
                }

            } elseif ($action === 'send_solution') {
                $required_fields = ['request_id', 'solution_code'];
                foreach ($required_fields as $field) {
                    if (!isset($input[$field]) || empty($input[$field])) {
                        sendJsonResponse("error", "Missing required field: $field");
                    }
                }

                $request_id = (int)$input['request_id'];
                $solution_code = $input['solution_code'];

                // Get request details for email
                // Using Supabase
                $request = supabaseSelect('solution_requests', ['id' => 'eq.' . $request_id], '*', true);

                if (!$request) {
                    sendJsonResponse("error", "Solution request not found");
                }
                
                // Get user details
                $user = null;
                if (is_numeric($request['user_id'])) {
                    $user = supabaseGetProfileByLegacyId((int)$request['user_id']);
                } else {
                    $user = supabaseGetProfile($request['user_id']);
                }
                
                // Get Question title
                $question = supabaseSelect('questions', ['id' => 'eq.' . $request['question_id']], 'title', true);

                // Update request with solution code
                $updateData = [
                    'status' => 'sent',
                    'solution_code' => $solution_code,
                    'sent_at' => gmdate('c'),
                    'sent_by' => 'admin'
                ];
                
                if (supabasePatch('solution_requests', ['id' => 'eq.' . $request_id], $updateData)) {
                    // Send email to user with solution code
                    $email_data = [
                        'user_name' => $user['name'] ?? 'User',
                        'question_title' => $question['title'] ?? 'Unknown Question',
                        'solution_code' => $solution_code,
                        'requested_language' => $request['requested_language'] ?: 'cpp',
                        'request_id' => $request_id
                    ];

                    $email_payload = [
                        'type' => 'solution_sent',
                        'user_id' => $request['user_id'],
                        'email' => $user['email'] ?? '',
                        'data' => $email_data
                    ];

                    $ch = curl_init();
                    curl_setopt($ch, CURLOPT_URL, 'http://localhost:8888/saves/oa/public/send_email.php');
                    curl_setopt($ch, CURLOPT_POST, 1);
                    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($email_payload));
                    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    $email_response = curl_exec($ch);
                    curl_close($ch);

                    sendJsonResponse("success", "Solution code sent to user successfully");
                } else {
                    sendJsonResponse("error", "Failed to send solution code");
                }
            }
            break;

        case 'PUT':
            if ($action === 'update_request_status') {
                $input = json_decode(file_get_contents('php://input'), true);

                $required_fields = ['request_id', 'status'];
                foreach ($required_fields as $field) {
                    if (!isset($input[$field])) {
                        sendJsonResponse("error", "Missing required field: $field");
                    }
                }

                $request_id = (int)$input['request_id'];
                $status = $input['status'];
                $admin_notes = $input['admin_notes'] ?? null;

                $updateData = [
                    'status' => $status,
                    'admin_notes' => $admin_notes,
                    'updated_at' => gmdate('c')
                ];
                
                if (supabasePatch('solution_requests', ['id' => 'eq.' . $request_id], $updateData)) {
                    sendJsonResponse("success", "Solution request status updated successfully");
                } else {
                    sendJsonResponse("error", "Failed to update solution request status");
                }
            }
            break;

        default:
            sendJsonResponse("error", "Invalid request method");
            break;
    }

} catch (Exception $e) {
    error_log("Solution requests API error: " . $e->getMessage());
    sendJsonResponse("error", "An error occurred: " . $e->getMessage());
}

// $conn->close();
?>
