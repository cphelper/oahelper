<?php
// public/community-solutions.php
// Supabase-only version

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Include database configuration first to get CORS functions
require_once __DIR__ . '/../db/config.php';

// Set CORS headers based on environment
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Validate API key
validateApiKey();

// Helper function to get JSON input
function getJsonInput() {
    return json_decode(file_get_contents('php://input'), true);
}

// Action handling
$action = isset($_GET['action']) ? $_GET['action'] : '';
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET' && $action === 'get_solutions') {
        $question_id = isset($_GET['question_id']) ? intval($_GET['question_id']) : 0;
        $user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;
        
        if ($question_id <= 0) {
            throw new Exception("Invalid question ID");
        }

        // Get solutions from Supabase
        $solutions = supabaseGetCommunitySolutions($question_id);
        
        // Enrich with user info, comment count, like count
        foreach ($solutions as &$solution) {
            // Get user info
            if ($solution['user_id']) {
                if (is_numeric($solution['user_id'])) {
                    $profile = supabaseGetProfileByLegacyId((int)$solution['user_id']);
                } else {
                    $profile = supabaseGetProfile($solution['user_id']);
                }
                $solution['user_name'] = $profile['name'] ?? 'Unknown';
            } else {
                $solution['user_name'] = 'Unknown';
            }
            
            // Get comment count
            $solution['comment_count'] = supabaseCount('SolutionComments', ['solution_id' => 'eq.' . $solution['id']]);
            
            // Get like count
            $solution['like_count'] = supabaseCountSolutionLikes($solution['id']);
            
            // Check if current user liked
            $solution['is_liked'] = false;
            if (!empty($user_id)) {
                $like = supabaseGetSolutionLike($user_id, $solution['id']);
                $solution['is_liked'] = $like !== null;
            }
        }
        
        // Sort by like_count desc, then created_at desc
        usort($solutions, function($a, $b) {
            if ($b['like_count'] !== $a['like_count']) {
                return $b['like_count'] - $a['like_count'];
            }
            return strcmp($b['created_at'], $a['created_at']);
        });
        
        echo json_encode([
            "status" => "success",
            "data" => $solutions
        ]);

    } elseif ($method === 'GET' && $action === 'get_all_solutions_admin') {
        // Admin: Get all solutions across all questions
        $solutions = supabaseGetCommunitySolutions(null, 200, 0);
        
        // Enrich with user info, question info
        foreach ($solutions as &$solution) {
            // Get user info
            if ($solution['user_id']) {
                if (is_numeric($solution['user_id'])) {
                    $profile = supabaseGetProfileByLegacyId((int)$solution['user_id']);
                } else {
                    $profile = supabaseGetProfile($solution['user_id']);
                }
                $solution['user_name'] = $profile['name'] ?? 'Unknown';
                $solution['user_email'] = $profile['email'] ?? '';
            } else {
                $solution['user_name'] = 'Unknown';
                $solution['user_email'] = '';
            }
            
            // Get question info
            if ($solution['question_id']) {
                $question = supabaseGetQuestionById((int)$solution['question_id']);
                $solution['question_title'] = $question['title'] ?? 'Unknown';
                $solution['company_id'] = $question['company_id'] ?? null;
            } else {
                $solution['question_title'] = 'Unknown';
                $solution['company_id'] = null;
            }
            
            // Get counts
            $solution['comment_count'] = supabaseCount('SolutionComments', ['solution_id' => 'eq.' . $solution['id']]);
            $solution['like_count'] = supabaseCountSolutionLikes($solution['id']);
        }
        
        echo json_encode([
            "status" => "success",
            "data" => $solutions
        ]);

    } elseif ($method === 'POST' && $action === 'add_solution') {
        $input = getJsonInput();
        
        $user_id = isset($input['user_id']) ? $input['user_id'] : null;
        $question_id = isset($input['question_id']) ? intval($input['question_id']) : 0;
        $solution_code = isset($input['solution_code']) ? trim($input['solution_code']) : '';
        $language = isset($input['language']) ? trim($input['language']) : '';
        $explanation = isset($input['explanation']) ? trim($input['explanation']) : '';
        
        if (empty($user_id) || $question_id <= 0 || empty($solution_code) || empty($language)) {
            throw new Exception("Missing required fields");
        }
        
        $result = supabaseInsertCommunitySolution($user_id, $question_id, $solution_code, $language, $explanation);
        
        if ($result) {
            echo json_encode([
                "status" => "success",
                "message" => "Solution posted successfully",
                "data" => [
                    "id" => $result['id'],
                    "created_at" => $result['created_at'] ?? date('Y-m-d H:i:s')
                ]
            ]);
        } else {
            throw new Exception("Error posting solution");
        }

    } elseif ($method === 'GET' && $action === 'get_comments') {
        $solution_id = isset($_GET['solution_id']) ? intval($_GET['solution_id']) : 0;
        $user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;
        
        if ($solution_id <= 0) {
            throw new Exception("Invalid solution ID");
        }

        // Get comments from Supabase
        $comments = supabaseGetSolutionComments($solution_id);
        
        // Enrich with user info and like info
        foreach ($comments as &$comment) {
            // Get user info
            if ($comment['user_id']) {
                if (is_numeric($comment['user_id'])) {
                    $profile = supabaseGetProfileByLegacyId((int)$comment['user_id']);
                } else {
                    $profile = supabaseGetProfile($comment['user_id']);
                }
                $comment['user_name'] = $profile['name'] ?? 'Unknown';
            } else {
                $comment['user_name'] = 'Unknown';
            }
            
            // Get like count
            $comment['like_count'] = supabaseCountCommentLikes($comment['id']);
            
            // Check if current user liked
            $comment['is_liked'] = false;
            if (!empty($user_id)) {
                $like = supabaseGetCommentLike($user_id, $comment['id']);
                $comment['is_liked'] = $like !== null;
            }
        }
        
        // Sort by like_count desc, then created_at asc
        usort($comments, function($a, $b) {
            if ($b['like_count'] !== $a['like_count']) {
                return $b['like_count'] - $a['like_count'];
            }
            return strcmp($a['created_at'], $b['created_at']);
        });
        
        echo json_encode([
            "status" => "success",
            "data" => $comments
        ]);

    } elseif ($method === 'GET' && $action === 'get_all_comments_admin') {
        // Admin: Get all comments across all solutions
        $comments = supabaseSelect('SolutionComments', ['order' => 'created_at.desc', 'limit' => 200]);
        if (!$comments) $comments = [];
        
        // Enrich with user info, solution info
        foreach ($comments as &$comment) {
            // Get user info
            if ($comment['user_id']) {
                if (is_numeric($comment['user_id'])) {
                    $profile = supabaseGetProfileByLegacyId((int)$comment['user_id']);
                } else {
                    $profile = supabaseGetProfile($comment['user_id']);
                }
                $comment['user_name'] = $profile['name'] ?? 'Unknown';
                $comment['user_email'] = $profile['email'] ?? '';
            } else {
                $comment['user_name'] = 'Unknown';
                $comment['user_email'] = '';
            }
            
            // Get solution info
            if ($comment['solution_id']) {
                $solution = supabaseGetCommunitySolutionById((int)$comment['solution_id']);
                if ($solution && $solution['question_id']) {
                    $question = supabaseGetQuestionById((int)$solution['question_id']);
                    $comment['question_title'] = $question['title'] ?? 'Unknown';
                    $comment['question_id'] = $solution['question_id'];
                    $comment['company_id'] = $question['company_id'] ?? null;
                } else {
                    $comment['question_title'] = 'Unknown';
                    $comment['question_id'] = null;
                    $comment['company_id'] = null;
                }
            }
        }
        
        echo json_encode([
            "status" => "success",
            "data" => $comments
        ]);

    } elseif ($method === 'POST' && $action === 'add_comment') {
        $input = getJsonInput();
        
        $user_id = isset($input['user_id']) ? $input['user_id'] : null;
        $solution_id = isset($input['solution_id']) ? intval($input['solution_id']) : 0;
        $comment = isset($input['comment']) ? trim($input['comment']) : '';
        
        if (empty($user_id) || $solution_id <= 0 || empty($comment)) {
            throw new Exception("Missing required fields");
        }
        
        $result = supabaseInsertSolutionComment($solution_id, $user_id, $comment);
        
        if ($result) {
            echo json_encode([
                "status" => "success",
                "message" => "Comment posted successfully",
                "data" => [
                    "id" => $result['id'],
                    "created_at" => $result['created_at'] ?? date('Y-m-d H:i:s')
                ]
            ]);
        } else {
            throw new Exception("Error posting comment");
        }

    } elseif ($method === 'POST' && $action === 'toggle_solution_like') {
        $input = getJsonInput();
        $user_id = isset($input['user_id']) ? $input['user_id'] : null;
        $solution_id = isset($input['solution_id']) ? intval($input['solution_id']) : 0;

        if (empty($user_id) || $solution_id <= 0) {
            throw new Exception("Missing required fields");
        }

        // Check if already liked
        $existingLike = supabaseGetSolutionLike($user_id, $solution_id);

        if ($existingLike) {
            // Unlike
            supabaseDeleteSolutionLike($user_id, $solution_id);
            $liked = false;
        } else {
            // Like
            supabaseInsertSolutionLike($user_id, $solution_id);
            $liked = true;
        }

        // Get updated count
        $newCount = supabaseCountSolutionLikes($solution_id);

        echo json_encode([
            "status" => "success",
            "liked" => $liked,
            "new_count" => $newCount
        ]);

    } elseif ($method === 'POST' && $action === 'toggle_comment_like') {
        $input = getJsonInput();
        $user_id = isset($input['user_id']) ? $input['user_id'] : null;
        $comment_id = isset($input['comment_id']) ? intval($input['comment_id']) : 0;

        if (empty($user_id) || $comment_id <= 0) {
            throw new Exception("Missing required fields");
        }

        // Check if already liked
        $existingLike = supabaseGetCommentLike($user_id, $comment_id);

        if ($existingLike) {
            // Unlike
            supabaseDeleteCommentLike($user_id, $comment_id);
            $liked = false;
        } else {
            // Like
            supabaseInsertCommentLike($user_id, $comment_id);
            $liked = true;
        }

        // Get updated count
        $newCount = supabaseCountCommentLikes($comment_id);

        echo json_encode([
            "status" => "success",
            "liked" => $liked,
            "new_count" => $newCount
        ]);

    } else {
        throw new Exception("Invalid action or method");
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
?>
