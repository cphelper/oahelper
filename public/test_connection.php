<?php
// public/test_connection.php

require_once __DIR__ . '/../db/config.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Content-Type: application/json");

try {
    if (!isset($conn) || !$conn instanceof mysqli) {
        throw new Exception('Database handle not initialized via config.php');
    }

    // ping() throws if the connection is unhealthy
    if ($conn->ping()) {
        echo json_encode(["status" => "success", "message" => "Connected successfully!"]);
    } else {
        throw new Exception('Database ping failed.');
    }
} catch (Throwable $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
