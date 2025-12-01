<?php
// db/config.php
// Supabase-only configuration - MySQL connection removed

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/supabase_client.php';

// Environment Configuration
// Smart Environment Detection
$host = $_SERVER['HTTP_HOST'] ?? ($_SERVER['SERVER_NAME'] ?? '');
$appEnvOverride = getenv('APP_ENV') ?: getenv('OA_ENV');
$environment = 'production';

if (!empty($appEnvOverride)) {
    $environment = strtolower($appEnvOverride);
} elseif (empty($host) && PHP_SAPI === 'cli') {
    // Default CLI scripts to development unless overridden
    $environment = 'development';
} elseif (stripos($host, 'localhost') !== false || stripos($host, '127.0.0.1') !== false) {
    $environment = 'development';
} elseif (stripos($host, 'placement.helperr.io') !== false) {
    // Placement helper acts as the staging domain
    $environment = 'staging';
}

$validEnvironments = ['development', 'staging', 'production'];
if (!in_array($environment, $validEnvironments, true)) {
    $environment = 'production';
}

// Gemini API Keys - Replace with your actual keys
$gemini_api_key_1 = "AIzaSyDVDPAnrKCXDJRC5b9I2KEODS5uMT3veRU";
$gemini_api_key_2 = "AIzaSyDVDPAnrKCXDJRC5b9I2KEODS5uMT3veRU";

// Default API key (for backward compatibility)
$gemini_api_key = $gemini_api_key_1;

// API Key for frontend authentication
define('API_KEY', 'oa_helper_secure_key_2024_v1_prod');

// Function to validate API key from request headers
function validateApiKey() {
    // 0. Security: Basic User-Agent Filtering to block script kiddies
    // This stops simple curl/python scripts that don't spoof the User-Agent
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $blockedAgents = ['curl', 'python', 'wget', 'libwww-perl', 'http-client'];
    
    foreach ($blockedAgents as $agent) {
        if (stripos($userAgent, $agent) !== false) {
            http_response_code(403);
            echo json_encode([
                'status' => 'error',
                'message' => 'Forbidden: Automated access denied'
            ]);
            exit;
        }
    }

    // 1. Security: Validate Origin/Referer to prevent unauthorized external access
    // This prevents users from simply copying the API key and using it elsewhere
    $allowedOrigins = getAllowedOrigins();
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $referer = $_SERVER['HTTP_REFERER'] ?? '';
    
    $isOriginAllowed = false;
    
    // Check Origin header (sent by browsers in CORS requests)
    if (!empty($origin)) {
        if (in_array($origin, $allowedOrigins)) {
            $isOriginAllowed = true;
        }
    }
    // Fallback: Check Referer (for same-origin requests or simple GETs)
    elseif (!empty($referer)) {
        foreach ($allowedOrigins as $allowed) {
            if (strpos($referer, $allowed) === 0) {
                $isOriginAllowed = true;
                break;
            }
        }
    }

    // In Development, allow requests without Origin/Referer (e.g. local tools)
    // In Production, require strict Origin/Referer match
    global $environment;
    if (!$isOriginAllowed) {
        // If in development, allow missing origin (likely local scripts/tools)
        // But if origin IS present and wrong, still block it.
        if ($environment === 'development' && empty($origin) && empty($referer)) {
            // Allow local tools
        } else {
            http_response_code(403);
            echo json_encode([
                'status' => 'error',
                'message' => 'Forbidden: Unauthorized Origin'
            ]);
            exit;
        }
    }

    // 2. Validate API Key
    // Robust header retrieval for different server environments
    $apiKey = '';
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        $apiKey = $headers['X-API-Key'] ?? $headers['X-Api-Key'] ?? $headers['x-api-key'] ?? '';
    }
    // Fallback to $_SERVER if getallheaders() is missing
    if (empty($apiKey)) {
        $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
    }
    
    if ($apiKey !== API_KEY) {
        http_response_code(401);
        echo json_encode([
            'status' => 'error',
            'message' => 'Unauthorized: Invalid API key'
        ]);
        exit;
    }
    
    return true;
}

// CORS Configuration
function getAllowedOrigins() {
    global $environment;
    
    $origins = [
        'development' => [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3001',
            'http://localhost:8888',
            'http://127.0.0.1:8888'
        ],
        'staging' => [
            'https://placement.helperr.io',
            'https://oahelper.in'
        ],
        'production' => [
            'https://oahelper.in',
            'https://placement.helperr.io'
        ],
    ];
    
    return $origins[$environment] ?? $origins['production'];
}

function setCorsHeaders() {
    $allowedOrigins = getAllowedOrigins();
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    if (in_array($origin, $allowedOrigins)) {
        header("Access-Control-Allow-Origin: $origin");
        header("Access-Control-Allow-Credentials: true");
    }
    
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key");
    
    // Handle preflight OPTIONS request
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        http_response_code(200);
        exit();
    }
    
    // Set Content-Type for all other requests
    header("Content-Type: application/json");
}

// Helper function for safe error messages (Supabase version)
function getSafeDbError(?string $error = null) {
    global $environment;
    if ($environment === 'development' && $error) {
        return $error;
    }
    return "A database error occurred.";
}
?>
