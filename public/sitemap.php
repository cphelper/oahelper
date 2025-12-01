<?php
// public/sitemap.php
// Supabase-only version

header('Content-Type: application/xml; charset=utf-8');

// Database configuration
require_once '../db/config.php';

// Set timezone
date_default_timezone_set('UTC');

// Start XML sitemap
echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' . "\n";
echo '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">' . "\n";

// Base URL
$baseUrl = "https://oahelper.in";

// Home page
echo '<url>' . "\n";
echo '<loc>' . $baseUrl . '</loc>' . "\n";
echo '<lastmod>' . date('Y-m-d\TH:i:s\Z') . '</lastmod>' . "\n";
echo '<changefreq>daily</changefreq>' . "\n";
echo '<priority>1.0</priority>' . "\n";
echo '</url>' . "\n";

// Static pages
$staticPages = [
    ['url' => '/login', 'priority' => '0.6', 'changefreq' => 'monthly'],
    ['url' => '/signup', 'priority' => '0.6', 'changefreq' => 'monthly'],
    ['url' => '/premium', 'priority' => '0.7', 'changefreq' => 'weekly']
];

foreach ($staticPages as $page) {
    echo '<url>' . "\n";
    echo '<loc>' . $baseUrl . $page['url'] . '</loc>' . "\n";
    echo '<lastmod>' . date('Y-m-d\TH:i:s\Z') . '</lastmod>' . "\n";
    echo '<changefreq>' . $page['changefreq'] . '</changefreq>' . "\n";
    echo '<priority>' . $page['priority'] . '</priority>' . "\n";
    echo '</url>' . "\n";
}

try {
    // Fetch all companies using Supabase
    $companies = supabaseSelect('Companies', ['order' => 'name.asc'], 'id,name,created_at');
    
    if ($companies && is_array($companies)) {
        foreach ($companies as $company) {
            // Create encrypted ID for URL
            $encryptedId = base64_encode($company['id'] . '|' . time());
            
            echo '<url>' . "\n";
            echo '<loc>' . $baseUrl . '/company-questions?id=' . urlencode($encryptedId) . '</loc>' . "\n";
            echo '<lastmod>' . date('Y-m-d\TH:i:s\Z', strtotime($company['created_at'] ?? 'now')) . '</lastmod>' . "\n";
            echo '<changefreq>weekly</changefreq>' . "\n";
            echo '<priority>0.9</priority>' . "\n";
            echo '</url>' . "\n";
            
            // Add individual questions for this company (limit to top 50 per company)
            $questions = supabaseSelect('Questions', [
                'company_id' => 'eq.' . $company['id'],
                'order' => 'created_at.desc',
                'limit' => 50
            ], 'id,title,created_at');
            
            if ($questions && is_array($questions)) {
                foreach ($questions as $question) {
                    $questionEncryptedId = base64_encode($question['id'] . '|' . time());
                    
                    echo '<url>' . "\n";
                    echo '<loc>' . $baseUrl . '/questions/' . urlencode($questionEncryptedId) . '</loc>' . "\n";
                    echo '<lastmod>' . date('Y-m-d\TH:i:s\Z', strtotime($question['created_at'] ?? 'now')) . '</lastmod>' . "\n";
                    echo '<changefreq>monthly</changefreq>' . "\n";
                    echo '<priority>0.8</priority>' . "\n";
                    echo '</url>' . "\n";
                }
            }
        }
    }
} catch (Exception $e) {
    error_log("Sitemap generation error: " . $e->getMessage());
    echo '<!-- Error generating dynamic sitemap content -->' . "\n";
}

echo '</urlset>' . "\n";
?>
