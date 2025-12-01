<?php
/**
 * Import Placement Data from CSV
 * 
 * Instructions:
 * 1. Export your Excel file as CSV
 * 2. Place the CSV file in the same directory as this script
 * 3. Update the $csvFile variable below with your CSV filename
 * 4. Run: php db/import-placement-data-csv.php
 * 
 * CSV Format (columns in order):
 * Timestamp, College, Company, Role, OA Date, OA Time, CGPA Criteria, MTech Eligible, CTC/Base, Other Info
 */

require_once 'config.php';

// Configuration
$csvFile = 'placement_data.csv'; // Change this to your CSV filename
$skipFirstRow = true; // Set to true if your CSV has headers

// Check if file exists
if (!file_exists(__DIR__ . '/' . $csvFile)) {
    die("❌ Error: CSV file '$csvFile' not found in db/ directory\n");
}

echo "📂 Reading CSV file: $csvFile\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

// Open CSV file
$handle = fopen(__DIR__ . '/' . $csvFile, 'r');
if (!$handle) {
    die("❌ Error: Could not open CSV file\n");
}

// Prepare SQL statement
$sql = "INSERT INTO PlacementData 
        (timestamp, college, company, role, oa_date, oa_time, cgpa_criteria, mtech_eligible, ctc_base, other_info) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    die("❌ Error preparing statement: " . $conn->error . "\n");
}

$rowCount = 0;
$successCount = 0;
$errorCount = 0;
$errors = [];

// Read CSV line by line
while (($data = fgetcsv($handle, 10000, ',')) !== FALSE) {
    $rowCount++;
    
    // Skip header row if configured
    if ($skipFirstRow && $rowCount === 1) {
        echo "⏭️  Skipping header row\n";
        continue;
    }
    
    // Validate row has enough columns
    if (count($data) < 10) {
        $errorCount++;
        $errors[] = "Row $rowCount: Not enough columns (" . count($data) . " found, 10 expected)";
        continue;
    }
    
    // Extract data (trim whitespace)
    $timestamp = trim($data[0]);
    $college = trim($data[1]);
    $company = trim($data[2]);
    $role = trim($data[3]);
    $oaDate = trim($data[4]);
    $oaTime = trim($data[5]);
    $cgpaCriteria = trim($data[6]);
    $mtechEligible = trim($data[7]);
    $ctcBase = trim($data[8]);
    $otherInfo = trim($data[9]);
    
    // Validate required fields
    if (empty($timestamp) || empty($college) || empty($company)) {
        $errorCount++;
        $errors[] = "Row $rowCount: Missing required fields (timestamp, college, or company)";
        continue;
    }
    
    // Insert into database
    $stmt->bind_param('ssssssssss', 
        $timestamp,
        $college,
        $company,
        $role,
        $oaDate,
        $oaTime,
        $cgpaCriteria,
        $mtechEligible,
        $ctcBase,
        $otherInfo
    );
    
    if ($stmt->execute()) {
        $successCount++;
        if ($successCount % 10 === 0) {
            echo "✅ Imported $successCount records...\n";
        }
    } else {
        $errorCount++;
        $errors[] = "Row $rowCount: Database error - " . $stmt->error;
    }
}

fclose($handle);
$stmt->close();
$conn->close();

// Print summary
echo "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "📊 IMPORT SUMMARY\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "Total rows processed: " . ($rowCount - ($skipFirstRow ? 1 : 0)) . "\n";
echo "✅ Successfully imported: $successCount\n";
echo "❌ Errors: $errorCount\n";

if (!empty($errors)) {
    echo "\n⚠️  ERROR DETAILS:\n";
    foreach ($errors as $error) {
        echo "  • $error\n";
    }
}

echo "\n✨ Import completed!\n";
?>
