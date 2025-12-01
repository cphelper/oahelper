<?php
require_once __DIR__ . '/config.php';

echo "Testing InterviewExperiences table...\n\n";

// Test 1: Check if table exists
echo "1. Checking if table exists...\n";
$result = $conn->query("SHOW TABLES LIKE 'InterviewExperiences'");
if ($result->num_rows > 0) {
    echo "✅ Table exists\n\n";
} else {
    echo "❌ Table does not exist\n";
    exit;
}

// Test 2: Check table structure
echo "2. Checking table structure...\n";
$result = $conn->query("DESCRIBE InterviewExperiences");
while ($row = $result->fetch_assoc()) {
    echo "   - {$row['Field']} ({$row['Type']}) {$row['Null']} {$row['Key']}\n";
}
echo "\n";

// Test 3: Try inserting a test record
echo "3. Testing insert...\n";
$stmt = $conn->prepare("
    INSERT INTO InterviewExperiences 
    (company, role, college, interview_date, interview_type, result, difficulty, 
     rounds, topics_asked, experience, user_email, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
");

$company = "Test Company";
$role = "Test Role";
$college = "Test College";
$interview_date = "Dec 2024";
$interview_type = "On-Campus";
$result_val = "Selected";
$difficulty = "Medium";
$rounds = "3 rounds";
$topics_asked = "DSA, System Design";
$experience = "This is a test experience";
$user_email = "test@example.com";

$stmt->bind_param(
    "sssssssssss",
    $company,
    $role,
    $college,
    $interview_date,
    $interview_type,
    $result_val,
    $difficulty,
    $rounds,
    $topics_asked,
    $experience,
    $user_email
);

if ($stmt->execute()) {
    echo "✅ Test record inserted successfully\n";
    $insert_id = $stmt->insert_id;
    echo "   Insert ID: $insert_id\n\n";
    
    // Test 4: Try to retrieve the record
    echo "4. Testing retrieval...\n";
    $stmt2 = $conn->prepare("SELECT * FROM InterviewExperiences WHERE id = ?");
    $stmt2->bind_param("i", $insert_id);
    $stmt2->execute();
    $result = $stmt2->get_result();
    
    if ($row = $result->fetch_assoc()) {
        echo "✅ Record retrieved successfully\n";
        echo "   Company: {$row['company']}\n";
        echo "   Role: {$row['role']}\n";
        echo "   Status: {$row['status']}\n\n";
    }
    
    // Clean up test record
    echo "5. Cleaning up test record...\n";
    $stmt3 = $conn->prepare("DELETE FROM InterviewExperiences WHERE id = ?");
    $stmt3->bind_param("i", $insert_id);
    if ($stmt3->execute()) {
        echo "✅ Test record deleted\n";
    }
    
} else {
    echo "❌ Failed to insert test record\n";
    echo "   Error: " . $stmt->error . "\n";
}

$stmt->close();
$conn->close();

echo "\n✅ All tests completed!\n";
?>
