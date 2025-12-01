<?php
// public/search.php
// Supabase-only version

// Include database configuration first to get CORS functions
require_once __DIR__ . '/../db/config.php';

// Set CORS headers based on environment
setCorsHeaders();

// Validate API key
validateApiKey();

try {
    if (isset($_GET['query'])) {
        $searchQuery = trim($_GET['query']);
        
        if (empty($searchQuery)) {
            echo json_encode([
                "status" => "success",
                "data" => []
            ]);
            exit();
        }
        
        // Search companies using Supabase
        $companies = supabaseSearchCompanies($searchQuery, 10);
        
        // Enrich with question count
        foreach ($companies as &$company) {
            $company['question_count'] = supabaseCountQuestions((int)$company['id']);
        }
        
        // Sort results: exact match first, then starts with, then contains
        usort($companies, function($a, $b) use ($searchQuery) {
            $aName = strtolower($a['name']);
            $bName = strtolower($b['name']);
            $query = strtolower($searchQuery);
            
            // Exact match gets priority 1
            $aScore = ($aName === $query) ? 1 : (strpos($aName, $query) === 0 ? 2 : 3);
            $bScore = ($bName === $query) ? 1 : (strpos($bName, $query) === 0 ? 2 : 3);
            
            if ($aScore !== $bScore) {
                return $aScore - $bScore;
            }
            
            return strcmp($aName, $bName);
        });
        
        echo json_encode([
            "status" => "success",
            "data" => $companies
        ]);
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "No search query provided"
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
?>
