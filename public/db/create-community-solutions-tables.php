<?php
require_once 'config.php';

try {
    // Create CommunitySolutions table
    $sql = "CREATE TABLE IF NOT EXISTS CommunitySolutions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        question_id INT NOT NULL,
        solution_code TEXT NOT NULL,
        language VARCHAR(50) NOT NULL,
        explanation TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES Users(id),
        FOREIGN KEY (question_id) REFERENCES Questions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    if ($conn->query($sql) === TRUE) {
        echo "Table 'CommunitySolutions' created successfully\n";
    } else {
        echo "Error creating table 'CommunitySolutions': " . $conn->error . "\n";
    }

    // Create SolutionComments table
    $sql = "CREATE TABLE IF NOT EXISTS SolutionComments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        solution_id INT NOT NULL,
        user_id INT NOT NULL,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (solution_id) REFERENCES CommunitySolutions(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES Users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    if ($conn->query($sql) === TRUE) {
        echo "Table 'SolutionComments' created successfully\n";
    } else {
        echo "Error creating table 'SolutionComments': " . $conn->error . "\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

$conn->close();
?>
