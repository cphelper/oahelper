<?php
// Clear solution_cpp for question IDs 2486 to 2556

require_once 'config.php';

// Update solution_cpp to NULL for the specified range
$sql = "UPDATE Questions 
        SET solution_cpp = NULL 
        WHERE id BETWEEN 2486 AND 2556";

if ($conn->query($sql) === TRUE) {
    $affected_rows = $conn->affected_rows;
    echo "Success! Updated $affected_rows questions.\n";
    echo "Set solution_cpp to NULL for question IDs (id column) 2486 to 2556.\n";
} else {
    echo "Error: " . $conn->error . "\n";
}

$conn->close();
?>
