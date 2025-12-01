<?php
/**
 * Clear all placement data from the database
 * 
 * WARNING: This will delete ALL records from the PlacementData table!
 * Use this only if you want to start fresh with new data.
 * 
 * Run: php db/clear-placement-data.php
 */

require_once 'config.php';

echo "⚠️  WARNING: This will delete ALL placement data!\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

// Check current count
$result = $conn->query("SELECT COUNT(*) as count FROM PlacementData");
$row = $result->fetch_assoc();
$currentCount = $row['count'];

echo "Current records in database: $currentCount\n\n";

if ($currentCount === 0) {
    echo "✅ Table is already empty. Nothing to delete.\n";
    exit(0);
}

// Ask for confirmation
echo "Type 'DELETE' to confirm deletion: ";
$handle = fopen("php://stdin", "r");
$confirmation = trim(fgets($handle));
fclose($handle);

if ($confirmation !== 'DELETE') {
    echo "\n❌ Deletion cancelled. No data was deleted.\n";
    exit(0);
}

// Delete all records
echo "\n🗑️  Deleting all records...\n";

if ($conn->query("DELETE FROM PlacementData")) {
    echo "✅ Successfully deleted $currentCount records\n";
    
    // Reset auto-increment
    $conn->query("ALTER TABLE PlacementData AUTO_INCREMENT = 1");
    echo "✅ Reset auto-increment counter\n";
    
    echo "\n✨ Table cleared successfully!\n";
} else {
    echo "❌ Error deleting records: " . $conn->error . "\n";
    exit(1);
}

$conn->close();
?>
