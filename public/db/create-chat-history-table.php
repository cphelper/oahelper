<?php
require_once 'config.php';

// Create chat_history table
$sql = "CREATE TABLE IF NOT EXISTS ChatHistory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    user_email VARCHAR(255) NULL,
    user_message TEXT NOT NULL,
    bot_response TEXT NOT NULL,
    is_logged_in BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    premium_plan VARCHAR(50) NULL,
    session_id VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_email (user_email),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_session_id (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

if ($conn->query($sql) === TRUE) {
    echo "ChatHistory table created successfully!\n";
} else {
    echo "Error creating table: " . $conn->error . "\n";
}

$conn->close();
?>
