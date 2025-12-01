<?php
// public/index.php
// Supabase version - SEO meta tag injection for React SPA

require_once __DIR__ . '/../db/config.php';
require_once __DIR__ . '/../db/supabase_client.php';

// Default Meta Tags
$title = "OAHelper - Ace Your Online Assessments";
$description = "OAHelper: Your ultimate resource for Online Assessment (OA) questions from top companies. Practice real interview questions with solutions to ace your coding interviews.";
$ogTitle = "OAHelper - Ace Your Online Assessments";
$ogDescription = "OAHelper: Your ultimate resource for Online Assessment (OA) questions from top companies. Practice real interview questions with solutions to ace your coding interviews.";
$ogUrl = "https://oahelper.in" . $_SERVER['REQUEST_URI'];

// Parse URL
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);
$query = parse_url($requestUri, PHP_URL_QUERY);
$queryParams = [];
if ($query) {
    parse_str($query, $queryParams);
}

try {
    // Case 1: Company Questions Page (/company-questions?id=...)
    if ($path === '/company-questions' && isset($queryParams['id'])) {
        $encryptedId = $queryParams['id'];
        $decoded = base64_decode($encryptedId);
        $parts = explode('|', $decoded);
        $companyId = isset($parts[0]) ? intval($parts[0]) : 0;
        
        if ($companyId > 0) {
            $company = supabaseGetCompanyById($companyId);
            if ($company) {
                $companyName = $company['name'];
                $title = "OA Questions for $companyName - OAHelper";
                $description = "Practice the latest Online Assessment questions for $companyName. Updated daily with solutions.";
                $ogTitle = $title;
                $ogDescription = $description;
            }
        }
    }
    
    // Case 2: Specific Question Page (/questions/ENCRYPTED_ID)
    elseif (preg_match('#^/questions/([^/]+)#', $path, $matches)) {
        $encryptedId = $matches[1];
        $decoded = base64_decode(urldecode($encryptedId));
        $parts = explode('|', $decoded);
        $questionId = isset($parts[0]) ? intval($parts[0]) : 0;
        
        if ($questionId > 0) {
            $question = supabaseGetQuestionById($questionId);
            if ($question) {
                $qTitle = $question['title'];
                $company = supabaseGetCompanyById((int)$question['company_id']);
                $cName = $company['name'] ?? 'Unknown';
                $title = "$qTitle - $cName OA Question | OAHelper";
                $description = "Solution to $qTitle asked in $cName Online Assessment. Practice this and more on OAHelper.";
                $ogTitle = $title;
                $ogDescription = $description;
            }
        }
    }
} catch (Exception $e) {
    // Fallback to defaults on error
}

// Read the React App HTML
$htmlPath = __DIR__ . '/index.html';
if (file_exists($htmlPath)) {
    $html = file_get_contents($htmlPath);

    // Replace Title
    $html = preg_replace('/<title>.*?<\/title>/', "<title>$title</title>", $html);

    // Replace Meta Description
    $html = preg_replace('/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i', '<meta name="description" content="' . htmlspecialchars($description) . '" />', $html);

    // Replace OG Title
    $html = preg_replace('/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i', '<meta property="og:title" content="' . htmlspecialchars($ogTitle) . '" />', $html);

    // Replace OG Description
    $html = preg_replace('/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i', '<meta property="og:description" content="' . htmlspecialchars($ogDescription) . '" />', $html);

    // Replace OG URL
    $html = preg_replace('/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i', '<meta property="og:url" content="' . htmlspecialchars($ogUrl) . '" />', $html);

    echo $html;
} else {
    echo "Error: index.html not found.";
}
?>
