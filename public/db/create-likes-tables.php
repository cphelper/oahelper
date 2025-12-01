<?php
require_once 'config.php';

try {
    // Create SolutionLikes table
    $sql = "CREATE TABLE IF NOT EXISTS SolutionLikes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        solution_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_solution (user_id, solution_id),
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (solution_id) REFERENCES CommunitySolutions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    if ($conn->query($sql) === TRUE) {
        echo "Table 'SolutionLikes' created successfully\n";
    } else {
        echo "Error creating table 'SolutionLikes': " . $conn->error . "\n";
    }

    // Create CommentLikes table
    $sql = "CREATE TABLE IF NOT EXISTS CommentLikes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        comment_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_comment (user_id, comment_id),
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (comment_id) REFERENCES SolutionComments(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    if ($conn->query($sql) === TRUE) {
        echo "Table 'CommentLikes' created successfully\n";
    } else {
        echo "Error creating table 'CommentLikes': " . $conn->error . "\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

$conn->close();
?>




