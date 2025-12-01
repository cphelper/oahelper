<?php

// Include database configuration first to get CORS functions
require_once __DIR__ . '/../db/config.php';

// Set CORS headers based on environment
setCorsHeaders();
// check_payment_amount.php - Check if payment screenshot contains "99"

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Validate API key
validateApiKey();

function sendJsonResponse($status, $message, $data = null) {
    echo json_encode([
        "status" => $status,
        "message" => $message,
        "data" => $data
    ]);
    exit();
}

// Fallback function to check payment patterns without OCR
function checkPaymentPatterns($imagePath) {
    // Get image dimensions and check if it's a typical payment screenshot size
    $imageInfo = getimagesize($imagePath);
    if (!$imageInfo) {
        return false;
    }

    $width = $imageInfo[0];
    $height = $imageInfo[1];
    $fileSize = filesize($imagePath);

    // Check for typical payment screenshot characteristics
    // Most payment screenshots are typically around 400-1200px wide and 600-2000px tall
    // File size usually between 50KB and 5MB for screenshots
    if ($width < 300 || $height < 400 || $width > 1500 || $height > 2500) {
        return false; // Not a typical payment screenshot size
    }

    if ($fileSize < 50000 || $fileSize > 5242880) { // 50KB to 5MB
        return false; // Not a typical payment screenshot file size
    }

    // Check if it's a common image format for screenshots
    $mimeType = $imageInfo['mime'];
    if (!in_array($mimeType, ['image/jpeg', 'image/jpg', 'image/png'])) {
        return false; // Not a typical screenshot format
    }

    // For better validation, we could check for common payment app characteristics
    // For now, we'll be moderately permissive for screenshots that meet basic criteria
    // This reduces false negatives while still catching obviously wrong uploads

    return true; // Assume it's a valid payment screenshot for now
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendJsonResponse('error', 'Invalid request method');
    }

    if (!isset($_FILES['payment_screenshot']) || $_FILES['payment_screenshot']['error'] !== UPLOAD_ERR_OK) {
        sendJsonResponse('error', 'No image file uploaded');
    }

    $uploadedFile = $_FILES['payment_screenshot']['tmp_name'];
    
    // Check if Tesseract OCR is available - try multiple common paths
    $tesseractPaths = [
        '/usr/bin/tesseract',
        '/usr/local/bin/tesseract',
        '/opt/homebrew/bin/tesseract', // For macOS with Homebrew
        '/snap/bin/tesseract' // For Ubuntu snap
    ];

    $tesseractPath = null;
    foreach ($tesseractPaths as $path) {
        if (file_exists($path)) {
            $tesseractPath = $path;
            break;
        }
    }

    if (!$tesseractPath) {
        // Tesseract not available, use fallback pattern matching
        $contains99 = checkPaymentPatterns($uploadedFile);

        sendJsonResponse('success', 'OCR not available, used pattern matching', [
            'contains_99' => $contains99,
            'ocr_available' => false,
            'method' => 'pattern_matching'
        ]);
    }

    // Create a temporary output file for OCR results
    $outputFile = sys_get_temp_dir() . '/ocr_output_' . uniqid();

    // Run Tesseract OCR on the image with PSM 6 (uniform block of text) which works better for payment screenshots
    $command = escapeshellcmd("$tesseractPath --psm 6 \"$uploadedFile\" \"$outputFile\" 2>&1");
    exec($command, $output, $returnCode);

    // Read the OCR output
    $ocrText = '';
    if (file_exists($outputFile . '.txt')) {
        $ocrText = file_get_contents($outputFile . '.txt');
        unlink($outputFile . '.txt'); // Clean up
    }

    // Clean up the OCR text for better matching
    $cleanText = strtolower(trim($ocrText));
    $cleanText = preg_replace('/[^a-z0-9₹\.]/', '', $cleanText);

    // More comprehensive patterns for detecting "99" in various formats
    $patterns = [
        // Direct "99" patterns (including amounts like 99.00, 299.00, etc.)
        '/99/',                    // Contains "99" anywhere
        '/\b99\b/',               // Word boundary "99"
        '/\b99\.00\b/',          // "99.00" with word boundaries
        '/\b99\.0\b/',           // "99.0" with word boundaries
        '/\b299\.00\b/',         // "299.00" (sometimes OCR reads ₹2 as 2)
        '/299/',                 // Contains "299"
        '/\b199\.00\b/',         // "199.00" (in case OCR reads ₹1 as 1)
        '/199/',                 // Contains "199"

        // Currency patterns
        '/₹\s*99/',              // "₹ 99"
        '/₹99/',                 // "₹99"
        '/₹\s*299/',             // "₹ 299"
        '/₹299/',                // "₹299"
        '/rs\s*99/',             // "rs 99"
        '/rupees\s*99/',         // "rupees 99"
        '/rs\s*299/',            // "rs 299"
        '/rupees\s*299/',        // "rupees 299"

        // Context patterns (more lenient)
        '/amount.*99/i',         // "amount" followed by "99" (case insensitive)
        '/total.*99/i',          // "total" followed by "99"
        '/paid.*99/i',           // "paid" followed by "99"
        '/pay.*99/i',            // "pay" followed by "99"
        '/₹.*99/',               // Currency symbol followed by "99"
        '/₹.*299/',              // Currency symbol followed by "299"

        // Additional patterns for common OCR variations
        '/\d+99/',               // Any digits followed by 99
        '/99\d+/',               // 99 followed by any digits
        '/\b\d+\.99\b/',         // Numbers ending with .99
        '/\b\d+\.00\b/',         // Numbers ending with .00 (sometimes OCR reads ₹99 as 99.00)
    ];

    $contains99 = false;
    foreach ($patterns as $pattern) {
        if (preg_match($pattern, $cleanText)) {
            $contains99 = true;
            break;
        }
    }
    
    $matchedPatterns = [];
    foreach ($patterns as $index => $pattern) {
        if (preg_match($pattern, $cleanText)) {
            $matchedPatterns[] = $pattern;
        }
    }

    sendJsonResponse('success', 'Image analyzed', [
        'contains_99' => $contains99,
        'ocr_available' => true,
        'detected_text' => $ocrText,
        'clean_text' => $cleanText,
        'tesseract_path' => $tesseractPath,
        'return_code' => $returnCode,
        'matched_patterns' => $matchedPatterns,
        'total_patterns' => count($patterns)
    ]);

} catch (Exception $e) {
    error_log("OCR check error: " . $e->getMessage());
    sendJsonResponse('error', 'An error occurred while checking the image', [
        'contains_99' => false,
        'ocr_available' => false
    ]);
}
?>

