<?php
/**
 * Clear all entries from interview_experiences table
 * WARNING: This will delete ALL interview experiences data
 */

require_once __DIR__ . '/config.php';

try {
    // Start transaction
    $conn->begin_transaction();
    
    // Delete all entries from InterviewExperiences table
    $deleteQuery = "DELETE FROM InterviewExperiences";
    
    if ($conn->query($deleteQuery)) {
        $deletedCount = $conn->affected_rows;
        
        // Reset auto-increment counter
        $resetQuery = "ALTER TABLE InterviewExperiences AUTO_INCREMENT = 1";
        $conn->query($resetQuery);
        
        // Commit transaction
        $conn->commit();
        
        echo "✅ Successfully cleared interview experiences table\n";
        echo "📊 Deleted $deletedCount entries\n";
        echo "🔄 Reset auto-increment counter\n";
    } else {
        throw new Exception("Failed to delete entries: " . $conn->error);
    }
    
} catch (Exception $e) {
    // Rollback on error
    $conn->rollback();
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
} finally {
    $conn->close();
}
?>
