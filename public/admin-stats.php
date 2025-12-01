<?php
// public/admin-stats.php
// Supabase-only version

// Include database configuration first to get CORS functions
require_once __DIR__ . '/../db/config.php';

// Set CORS headers based on environment
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Validate API key
validateApiKey();

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $action = isset($_GET['action']) ? $_GET['action'] : 'get_all_stats';
        
        if ($action === 'get_all_stats') {
            // Get today's date
            $today = date('Y-m-d');
            $yesterday = date('Y-m-d', strtotime('-1 day'));
            $thisWeek = date('Y-m-d', strtotime('-7 days'));
            $thisMonth = date('Y-m-d', strtotime('-30 days'));
            
            $stats = [];
            
            // 1. User Registration Stats (from Users table)
            $userStats = [];
            
            // Total users
            $userStats['total'] = supabaseCount('Users');
            
            // Verified users
            $userStats['verified'] = supabaseCount('Users', ['verified' => 'eq.true']);
            
            // Today's registrations
            $userStats['today'] = supabaseCount('Users', ['created_at' => 'gte.' . $today . 'T00:00:00']);
            
            // Yesterday's registrations
            $userStats['yesterday'] = supabaseCount('Users', [
                'created_at' => 'gte.' . $yesterday . 'T00:00:00',
                'and' => '(created_at.lt.' . $today . 'T00:00:00)'
            ]);
            
            // This week's registrations
            $userStats['this_week'] = supabaseCount('Users', ['created_at' => 'gte.' . $thisWeek . 'T00:00:00']);
            
            // This month's registrations
            $userStats['this_month'] = supabaseCount('Users', ['created_at' => 'gte.' . $thisMonth . 'T00:00:00']);
            
            $stats['users'] = $userStats;
            
            // 2. Premium Subscription Stats
            $premiumStats = [];
            
            // Total active subscriptions
            $premiumStats['total_active'] = supabaseCount('premium_subscriptions', ['status' => 'eq.active']);
            
            // Today's subscriptions
            $premiumStats['today'] = supabaseCount('premium_subscriptions', [
                'status' => 'eq.active',
                'start_date' => 'gte.' . $today . 'T00:00:00'
            ]);
            
            // This week's subscriptions
            $premiumStats['this_week'] = supabaseCount('premium_subscriptions', [
                'status' => 'eq.active',
                'start_date' => 'gte.' . $thisWeek . 'T00:00:00'
            ]);
            
            // This month's subscriptions
            $premiumStats['this_month'] = supabaseCount('premium_subscriptions', [
                'status' => 'eq.active',
                'start_date' => 'gte.' . $thisMonth . 'T00:00:00'
            ]);
            
            // Total revenue (approximate - sum all active)
            $allSubs = supabaseSelect('premium_subscriptions', ['status' => 'eq.active'], 'amount');
            $premiumStats['total_revenue'] = 0;
            $premiumStats['today_revenue'] = 0;
            if ($allSubs) {
                foreach ($allSubs as $sub) {
                    $premiumStats['total_revenue'] += (float)($sub['amount'] ?? 0);
                }
            }
            
            $premiumStats['yesterday'] = 0; // Simplified
            
            $stats['premium'] = $premiumStats;
            
            // 3. User Submissions Stats
            $submissionStats = [];
            
            // Total submissions
            $submissionStats['total'] = supabaseCount('UserQuestionSubmissions');
            
            // Today's submissions
            $submissionStats['today'] = supabaseCount('UserQuestionSubmissions', [
                'submitted_at' => 'gte.' . $today . 'T00:00:00'
            ]);
            
            // Completed submissions
            $submissionStats['completed'] = supabaseCount('UserQuestionSubmissions', ['status' => 'eq.completed']);
            
            // Pending submissions
            $submissionStats['pending'] = supabaseCount('UserQuestionSubmissions', ['status' => 'eq.pending']);
            
            $submissionStats['yesterday'] = 0;
            $submissionStats['this_week'] = supabaseCount('UserQuestionSubmissions', [
                'submitted_at' => 'gte.' . $thisWeek . 'T00:00:00'
            ]);
            $submissionStats['this_month'] = supabaseCount('UserQuestionSubmissions', [
                'submitted_at' => 'gte.' . $thisMonth . 'T00:00:00'
            ]);
            
            $stats['submissions'] = $submissionStats;
            
            // 4. Company Requests Stats (simplified - may not have this table)
            $companyRequestStats = [
                'today' => 0,
                'total' => 0,
                'pending' => 0,
                'approved' => 0
            ];
            $stats['company_requests'] = $companyRequestStats;
            
            // 5. Payment Requests Stats (simplified)
            $paymentRequestStats = [
                'today' => 0,
                'total' => 0,
                'pending' => 0,
                'approved' => 0
            ];
            $stats['payment_requests'] = $paymentRequestStats;
            
            // 6. Issues Stats (simplified)
            $issueStats = [
                'today' => 0,
                'total' => 0,
                'pending' => 0,
                'resolved' => 0
            ];
            $stats['issues'] = $issueStats;
            
            // 7. Report Issues Stats (simplified)
            $reportStats = [
                'today' => 0,
                'total' => 0,
                'pending' => 0
            ];
            $stats['reports'] = $reportStats;
            
            // 8. Companies Stats
            $companyStats = [];
            $companyStats['total'] = supabaseCountCompanies();
            $companyStats['total_questions'] = supabaseCountQuestions();
            $stats['companies'] = $companyStats;
            
            // 9. Banned Emails Stats
            $bannedStats = [];
            $bannedStats['total'] = supabaseCount('banned_emails');
            $stats['banned_emails'] = $bannedStats;
            
            // 10. Recent Activity (simplified)
            $recentActivity = [];
            for ($i = 6; $i >= 0; $i--) {
                $date = date('Y-m-d', strtotime("-$i days"));
                $dateLabel = date('M j', strtotime("-$i days"));
                
                $recentActivity[] = [
                    'date' => $dateLabel,
                    'users' => supabaseCount('Users', ['created_at' => 'gte.' . $date . 'T00:00:00', 'and' => '(created_at.lt.' . date('Y-m-d', strtotime("-" . ($i-1) . " days")) . 'T00:00:00)']),
                    'subscriptions' => 0,
                    'submissions' => 0
                ];
            }
            $stats['recent_activity'] = $recentActivity;
            
            echo json_encode([
                'status' => 'success',
                'data' => $stats
            ]);
            
        } else if ($action === 'check_notifications') {
            // Simplified notifications
            $notifications = [];
            
            // Check for pending submissions
            $pendingSubmissions = supabaseCount('UserQuestionSubmissions', ['status' => 'eq.pending']);
            if ($pendingSubmissions > 0) {
                $notifications[] = [
                    'type' => 'user_submission',
                    'count' => $pendingSubmissions,
                    'message' => $pendingSubmissions . ' pending submission' . ($pendingSubmissions > 1 ? 's' : ''),
                    'icon' => 'paper-plane',
                    'color' => 'purple'
                ];
            }
            
            // Check for pending interview experiences
            $pendingExperiences = supabaseCountInterviewExperiences('pending');
            if ($pendingExperiences > 0) {
                $notifications[] = [
                    'type' => 'experience',
                    'count' => $pendingExperiences,
                    'message' => $pendingExperiences . ' pending experience' . ($pendingExperiences > 1 ? 's' : ''),
                    'icon' => 'file-text',
                    'color' => 'orange'
                ];
            }
            
            echo json_encode([
                'status' => 'success',
                'data' => [
                    'notifications' => $notifications,
                    'has_new' => count($notifications) > 0,
                    'last_check' => date('Y-m-d H:i:s')
                ]
            ]);
            
        } else {
            throw new Exception("Invalid action");
        }
        
    } else {
        throw new Exception("Method not allowed");
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
