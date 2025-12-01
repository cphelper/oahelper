<?php

// Include database configuration first to get CORS functions
require_once __DIR__ . '/../db/config.php';

// Set CORS headers based on environment
setCorsHeaders();
// upload_payment_image.php - Handle payment screenshot uploads

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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse("error", "Invalid request method");
}

if (!isset($_FILES['payment_screenshot'])) {
    sendJsonResponse("error", "No file uploaded");
}

$file = $_FILES['payment_screenshot'];

// Validate file
if ($file['error'] !== UPLOAD_ERR_OK) {
    sendJsonResponse("error", "File upload error: " . $file['error']);
}

// Check file size (5MB limit)
if ($file['size'] > 5 * 1024 * 1024) {
    sendJsonResponse("error", "File size exceeds 5MB limit");
}

// Check file type
$allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
$file_type = mime_content_type($file['tmp_name']);

if (!in_array($file_type, $allowed_types)) {
    sendJsonResponse("error", "Invalid file type. Only images are allowed.");
}

// Create upload directory if it doesn't exist
$upload_dir = __DIR__ . '/payment_images/';
if (!is_dir($upload_dir)) {
    if (!mkdir($upload_dir, 0755, true)) {
        sendJsonResponse("error", "Failed to create upload directory");
    }
}

// Generate unique filename
$file_extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$unique_filename = 'payment_' . uniqid() . '_' . time() . '.' . $file_extension;
$file_path = $upload_dir . $unique_filename;

// Move uploaded file
if (move_uploaded_file($file['tmp_name'], $file_path)) {
    // Return the relative URL path
    $base_url = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]";
    $image_url = $base_url . dirname($_SERVER['REQUEST_URI']) . '/payment_images/' . $unique_filename;
    
    sendJsonResponse("success", "Image uploaded successfully", [
        'image_url' => $image_url,
        'filename' => $unique_filename
    ]);
} else {
    sendJsonResponse("error", "Failed to save uploaded file");
}
?>