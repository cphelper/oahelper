<?php
require_once 'config.php';

// Create page_views table
$sql = "CREATE TABLE IF NOT EXISTS page_views (
    id INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    page_name VARCHAR(50) NOT NULL,
    user_id INT(11) DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (page_name),
    INDEX (viewed_at)
)";

if ($conn->query($sql) === TRUE) {
    echo "Table 'page_views' created successfully\n";
} else {
    echo "Error creating table: " . $conn->error . "\n";
}

$conn->close();
?>


