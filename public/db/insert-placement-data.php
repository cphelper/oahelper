<?php
// Database configuration
require_once 'config.php';

try {
    // All placement data - directly included here from the JavaScript file
    $placementData = [
        ['timestamp' => '31/07/2025 19:44:11', 'college' => 'IIT Guwahati', 'company' => 'Amazon', 'role' => 'Internship Applied Scientist', 'oaDate' => '', 'oaTime' => '', 'cgpa' => '', 'mtechEligible' => 'YES', 'ctc' => '1 lac stipend', 'otherInfo' => '6 month internship'],
        ['timestamp' => '31/07/2025 19:50:31', 'college' => 'Birla Institute of Technology Mesra (BIT Mesra)', 'company' => 'Make My Trip', 'role' => 'Software Engineer', 'oaDate' => '02/08/2025', 'oaTime' => '05:00:00', 'cgpa' => '7', 'mtechEligible' => 'No', 'ctc' => '13', 'otherInfo' => '-'],
        ['timestamp' => '31/07/2025 20:05:24', 'college' => 'NITC', 'company' => 'Qualcomm', 'role' => 'Only for hardware', 'oaDate' => '31/07/2025', 'oaTime' => '06:00:00', 'cgpa' => '70%', 'mtechEligible' => 'YES', 'ctc' => '30LPA', 'otherInfo' => ''],
        ['timestamp' => '05/08/2025 22:38:45', 'college' => 'IITG', 'company' => 'Amazon', 'role' => 'Applied Scientist, SDE Internship', 'oaDate' => '05/08/2025', 'oaTime' => '08:30:00', 'cgpa' => 'No', 'mtechEligible' => 'YES', 'ctc' => '', 'otherInfo' => 'Easy'],
        ['timestamp' => '08/08/2025 00:30:13', 'college' => 'IIIT B', 'company' => 'Urban Company', 'role' => 'SDE', 'oaDate' => '08/08/2025', 'oaTime' => '', 'cgpa' => '', 'mtechEligible' => 'YES', 'ctc' => '18 Base', 'otherInfo' => '3 HARD QUESTIONS IN OA'],
        ['timestamp' => '08/08/2025 08:12:00', 'college' => 'IIT BHU', 'company' => 'Get to know in September', 'role' => 'Sde, ds, da', 'oaDate' => '30/09/2025', 'oaTime' => '', 'cgpa' => '', 'mtechEligible' => 'YES', 'ctc' => '', 'otherInfo' => ''],
        ['timestamp' => '08/08/2025 13:19:57', 'college' => 'IIITV', 'company' => 'Media.net', 'role' => 'Intern', 'oaDate' => '13/08/2025', 'oaTime' => '', 'cgpa' => '6', 'mtechEligible' => 'No', 'ctc' => '1L/M', 'otherInfo' => ''],
        ['timestamp' => '09/08/2025 00:54:13', 'college' => 'BITS Pilani', 'company' => 'Mathworks', 'role' => 'SDE', 'oaDate' => '08/08/2025', 'oaTime' => '', 'cgpa' => '7', 'mtechEligible' => 'YES', 'ctc' => '30', 'otherInfo' => '2 medium level dsa quetion and mcq of computer science and maths'],
        ['timestamp' => '09/08/2025 01:42:35', 'college' => 'IIIT B', 'company' => 'Urban Company', 'role' => 'SDE I', 'oaDate' => '07/08/2025', 'oaTime' => '02:00:00', 'cgpa' => '7+', 'mtechEligible' => 'YES', 'ctc' => '24L CTC', 'otherInfo' => '3 Coding; Sliding window, Graph; Medium to High'],
        ['timestamp' => '10/08/2025 18:53:00', 'college' => 'Mnit Jaipur', 'company' => 'Eatclub brands(Box8)', 'role' => 'Sde', 'oaDate' => '04/08/2025', 'oaTime' => '10:00:00', 'cgpa' => '6.5 throughout the academic career', 'mtechEligible' => 'No', 'ctc' => '22/12', 'otherInfo' => '2 coding questions']
    ];

    echo "📊 Found " . count($placementData) . " placement records to insert\n";

    // Prepare insert statement
    $stmt = $conn->prepare("INSERT INTO PlacementData
        (timestamp, college, company, role, oa_date, oa_time, cgpa_criteria, mtech_eligible, ctc_base, other_info)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        college = VALUES(college),
        company = VALUES(company),
        role = VALUES(role),
        oa_date = VALUES(oa_date),
        oa_time = VALUES(oa_time),
        cgpa_criteria = VALUES(cgpa_criteria),
        mtech_eligible = VALUES(mtech_eligible),
        ctc_base = VALUES(ctc_base),
        other_info = VALUES(other_info)");

    $inserted = 0;
    $updated = 0;

    foreach ($placementData as $record) {
        $stmt->bind_param("ssssssssss",
            $record['timestamp'],
            $record['college'],
            $record['company'],
            $record['role'],
            $record['oaDate'],
            $record['oaTime'],
            $record['cgpa'],
            $record['mtechEligible'],
            $record['ctc'],
            $record['otherInfo']
        );

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                $inserted++;
            } else {
                $updated++;
            }
        } else {
            echo "❌ Error inserting record for {$record['company']}: " . $stmt->error . "\n";
        }
    }

    echo "✅ Successfully inserted/updated placement data!\n";
    echo "📈 Records inserted: $inserted\n";
    echo "🔄 Records updated: $updated\n";

    // Show some statistics
    $statsQuery = "SELECT
        COUNT(*) as total_records,
        COUNT(DISTINCT college) as unique_colleges,
        COUNT(DISTINCT company) as unique_companies,
        COUNT(CASE WHEN mtech_eligible = 'YES' THEN 1 END) as mtech_eligible_count,
        COUNT(CASE WHEN mtech_eligible = 'No' THEN 1 END) as mtech_not_eligible_count
        FROM PlacementData";

    $result = $conn->query($statsQuery);
    if ($result) {
        $stats = $result->fetch_assoc();
        echo "\n📊 Database Statistics:\n";
        echo "- Total records: {$stats['total_records']}\n";
        echo "- Unique colleges: {$stats['unique_colleges']}\n";
        echo "- Unique companies: {$stats['unique_companies']}\n";
        echo "- MTech eligible: {$stats['mtech_eligible_count']}\n";
        echo "- MTech not eligible: {$stats['mtech_not_eligible_count']}\n";
    }

    echo "\n✨ Data migration completed successfully!\n";

} catch(Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}

$conn->close();
?>
