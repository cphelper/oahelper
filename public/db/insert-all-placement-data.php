<?php
// Database configuration
require_once 'config.php';

try {
    // All placement data from the JavaScript file
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
        ['timestamp' => '10/08/2025 18:53:00', 'college' => 'Mnit Jaipur', 'company' => 'Eatclub brands(Box8)', 'role' => 'Sde', 'oaDate' => '04/08/2025', 'oaTime' => '10:00:00', 'cgpa' => '6.5 throughout the academic career', 'mtechEligible' => 'No', 'ctc' => '22/12', 'otherInfo' => '2 coding questions'],
        ['timestamp' => '11/08/2025 09:48:20', 'college' => 'NITK', 'company' => 'Chevron Engine', 'role' => 'SE', 'oaDate' => '30/07/2025', 'oaTime' => '', 'cgpa' => '7', 'mtechEligible' => 'YES', 'ctc' => '', 'otherInfo' => 'DSA not required for whole interview, only the basics of CS fundamental, behavioral, and project'],
        ['timestamp' => '16/08/2025 18:36:33', 'college' => 'IIT BHU', 'company' => 'HPCL', 'role' => 'Graduate Trainee', 'oaDate' => '25/08/2025', 'oaTime' => '', 'cgpa' => '0', 'mtechEligible' => 'No', 'ctc' => '17.5/17.5', 'otherInfo' => ''],
        ['timestamp' => '16/08/2025 19:16:29', 'college' => 'IIIT B', 'company' => 'Cohesity', 'role' => 'SE Intern', 'oaDate' => '16/08/2025', 'oaTime' => '01:00:00', 'cgpa' => 'All', 'mtechEligible' => 'YES', 'ctc' => '1,40,000', 'otherInfo' => ''],
        ['timestamp' => '20/08/2025 23:34:01', 'college' => 'IIIT B', 'company' => 'IBM', 'role' => 'Multiple Roles (I+F)', 'oaDate' => '20/08/2025', 'oaTime' => '02:00:00', 'cgpa' => '7+', 'mtechEligible' => 'YES', 'ctc' => '17 CTC', 'otherInfo' => 'CS Core fundamentals, C Programming; 3 DSA - 2 Easy, 1 Medium'],
        ['timestamp' => '21/08/2025 14:55:18', 'college' => 'Indian institute of technology Bombay', 'company' => 'Adobe', 'role' => 'SDE', 'oaDate' => '25/08/2025', 'oaTime' => '16:30:00', 'cgpa' => '7', 'mtechEligible' => 'No', 'ctc' => '45lpa', 'otherInfo' => 'OA pattern is aptitude round first, next coding round based on DSA'],
        ['timestamp' => '25/08/2025 00:16:21', 'college' => 'NIT Hamirpur', 'company' => 'Quizzes(Wayground)', 'role' => 'SDE', 'oaDate' => '02/08/2025', 'oaTime' => '', 'cgpa' => '7', 'mtechEligible' => 'No', 'ctc' => '41.4', 'otherInfo' => '3 DSA + 1 React js + 10 Mcqs'],
        ['timestamp' => '25/08/2025 00:18:54', 'college' => 'NIT Hamirpur', 'company' => 'BlackRock', 'role' => 'SDE, Alladin Data Analyst', 'oaDate' => '15/08/2025', 'oaTime' => '', 'cgpa' => '7', 'mtechEligible' => 'No', 'ctc' => '18(15 base + 1.5 joining + 1.5 other)', 'otherInfo' => 'Flowchart , SQL DBMS ,OS ,Oops ,Aptitude Numerical , Data Cross checking'],
        ['timestamp' => '25/08/2025 00:20:26', 'college' => 'NIT Hamirpur', 'company' => 'DE Shaw', 'role' => 'SDE', 'oaDate' => '09/08/2025', 'oaTime' => '', 'cgpa' => '6', 'mtechEligible' => 'No', 'ctc' => '58 lpa (2 lakh/month 6 month intern)', 'otherInfo' => 'code snipptes , 1 dsa question , Aptitude'],
        ['timestamp' => '25/08/2025 00:22:00', 'college' => 'NIT Hamirpur', 'company' => 'Cvent', 'role' => 'SDE', 'oaDate' => '16/08/2025', 'oaTime' => '', 'cgpa' => '7', 'mtechEligible' => 'No', 'ctc' => '15 ( 11.5 + others)', 'otherInfo' => '30 Mcqs Round 1 , 1 dsa question Round 2'],
        ['timestamp' => '25/08/2025 15:46:30', 'college' => 'IIT GUWAHATI', 'company' => 'Cisco', 'role' => 'Sde', 'oaDate' => '24/06/2025', 'oaTime' => '', 'cgpa' => "Don't Know", 'mtechEligible' => "Don't Know", 'ctc' => '', 'otherInfo' => 'https://drive.google.com/drive/folders/1beHXoxAUE9MvqzyUkh-tRPiJBdwZhzvM'],
        ['timestamp' => '26/08/2025 00:35:09', 'college' => 'Nit Patna', 'company' => 'InfoEdge', 'role' => 'SDE', 'oaDate' => '23/08/2025', 'oaTime' => '04:06:00', 'cgpa' => 'NO', 'mtechEligible' => 'No', 'ctc' => '14.5/13', 'otherInfo' => 'OA + 3 rounds(2 technical + 1 HR)'],
        ['timestamp' => '26/08/2025 00:40:29', 'college' => 'NIT Patna', 'company' => 'Trilogy Innovations', 'role' => 'SDE', 'oaDate' => '08/08/2025', 'oaTime' => '06:08:00', 'cgpa' => 'NO', 'mtechEligible' => 'No', 'ctc' => '32.5/30', 'otherInfo' => 'OA + (15 mins CCAT where 45+ questions needs to be correct) + (1-4 rounds of interview) + (again 15 mins of CCAT where 45+ questions is the criteria)'],
        ['timestamp' => '26/08/2025 17:45:51', 'college' => 'nit patna', 'company' => 'na', 'role' => 'front end developer', 'oaDate' => '27/08/2025', 'oaTime' => '20:00:00', 'cgpa' => '6.5', 'mtechEligible' => 'No', 'ctc' => '20', 'otherInfo' => ''],
        ['timestamp' => '28/08/2025 16:11:45', 'college' => 'Nit raipur', 'company' => 'Phonepe', 'role' => 'Analyst', 'oaDate' => '21/08/2025', 'oaTime' => '12:30:00', 'cgpa' => '6', 'mtechEligible' => 'YES', 'ctc' => '17', 'otherInfo' => ''],
        ['timestamp' => '01/09/2025 22:00:42', 'college' => 'IIIT B', 'company' => 'Texas Instruments', 'role' => 'SDE', 'oaDate' => '01/09/2025', 'oaTime' => '01:30:00', 'cgpa' => '6+', 'mtechEligible' => 'YES', 'ctc' => '43LPA CTC', 'otherInfo' => 'Aptitude, OS, DBMS, CN, Linux, OOPs fundamentals. 2 Coding (Easy & Medium)'],
        ['timestamp' => '21/09/2025 04:22:06', 'college' => 'Iit patna', 'company' => 'Bpcl', 'role' => 'Trainee', 'oaDate' => '29/09/2025', 'oaTime' => '', 'cgpa' => '6.5', 'mtechEligible' => "Don't Know", 'ctc' => '20', 'otherInfo' => ''],
        ['timestamp' => '22/09/2025 13:44:45', 'college' => 'Nit raipur', 'company' => 'Impact Analytics', 'role' => 'Ai analyst', 'oaDate' => '19/09/2025', 'oaTime' => '08:00:00', 'cgpa' => '', 'mtechEligible' => "Don't Know", 'ctc' => '10 lpa', 'otherInfo' => 'Oa ( 24 questions in 1hr ) try to complete atleast 20 min before time ends and keep accuracy high'],
        ['timestamp' => '22/09/2025 14:00:41', 'college' => 'NIT Raipur', 'company' => 'Impact Analytics', 'role' => 'Ai Analyst, Software developer', 'oaDate' => '19/09/2025', 'oaTime' => '08:09:00', 'cgpa' => 'Above 7 i guess', 'mtechEligible' => "Don't Know", 'ctc' => '13 LPA', 'otherInfo' => '24 questions, 1hour time, easy questions, be prepared for 1 long question based on Sim rates ( which one is cost effective), another one question based on bitwise exclusive and or operator. And also one based on Identifying which one of them is Recursive algorithm'],
        ['timestamp' => '22/09/2025 14:22:56', 'college' => 'IIT Patna', 'company' => 'Matters.ai', 'role' => 'ML Intern', 'oaDate' => '21/09/2025', 'oaTime' => '11:00:00', 'cgpa' => 'NO', 'mtechEligible' => 'YES', 'ctc' => '1L per month stipend', 'otherInfo' => '1hr test, ML round, Technical , HR'],
        ['timestamp' => '22/09/2025 14:56:43', 'college' => 'IIT madras', 'company' => 'squarepoint', 'role' => 'quant desk trader, software,infrastructure', 'oaDate' => '', 'oaTime' => '', 'cgpa' => 'cs - 7, all other - 8', 'mtechEligible' => "Don't Know", 'ctc' => '65 ctc', 'otherInfo' => ''],
        ['timestamp' => '22/09/2025 19:45:38', 'college' => 'Indian Institute of Technology BHU Varanasi', 'company' => 'SquarePoint Capital', 'role' => 'Desk Quant Analyst, Infrastructure Engg., SDE', 'oaDate' => '', 'oaTime' => '', 'cgpa' => 'Yes - 8 generally', 'mtechEligible' => 'No', 'ctc' => '66/41', 'otherInfo' => ''],
        ['timestamp' => '22/09/2025 22:09:29', 'college' => 'IIT BHU', 'company' => 'Teradata', 'role' => 'Sde', 'oaDate' => '', 'oaTime' => '', 'cgpa' => '7', 'mtechEligible' => 'No', 'ctc' => '25/22', 'otherInfo' => ''],
        ['timestamp' => '22/09/2025 22:12:09', 'college' => 'IIT BHU', 'company' => 'Wex', 'role' => 'SDE', 'oaDate' => '', 'oaTime' => '', 'cgpa' => '7 only circutal', 'mtechEligible' => 'No', 'ctc' => '30/20', 'otherInfo' => ''],
        ['timestamp' => '22/09/2025 22:13:37', 'college' => 'IIT BHU', 'company' => 'Inmobi', 'role' => 'SDE', 'oaDate' => '29/09/2025', 'oaTime' => '18:00:00', 'cgpa' => '7 only circutal', 'mtechEligible' => 'No', 'ctc' => '27/22', 'otherInfo' => ''],
        ['timestamp' => '22/09/2025 23:54:40', 'college' => 'IIT BHU', 'company' => 'SquarePoint capital', 'role' => 'Sde, Desk quant analyst, Infrastructure', 'oaDate' => '', 'oaTime' => '', 'cgpa' => '7 for cse and mat 7.5 for remaining', 'mtechEligible' => 'No', 'ctc' => '66lpa ctc 41lpa base', 'otherInfo' => ''],
        ['timestamp' => '23/09/2025 00:15:29', 'college' => 'VNIT', 'company' => 'Reliance', 'role' => 'GET', 'oaDate' => '01/10/2025', 'oaTime' => '14:00:00', 'cgpa' => '7', 'mtechEligible' => "YES, Don't Know", 'ctc' => '7.5 lpa', 'otherInfo' => 'Need high speed'],
        ['timestamp' => '23/09/2025 23:21:02', 'college' => 'IIT BBS', 'company' => 'Flipkart', 'role' => 'SDE', 'oaDate' => '', 'oaTime' => '', 'cgpa' => '7.5', 'mtechEligible' => 'No', 'ctc' => '30', 'otherInfo' => 'NA'],
        ['timestamp' => '24/09/2025 00:30:05', 'college' => 'IIT ISM Dhanbad', 'company' => 'Squarepoint', 'role' => 'Software Developer, Desk Quant Analyst, Infrastructure Engineer', 'oaDate' => '06/10/2025', 'oaTime' => '', 'cgpa' => '', 'mtechEligible' => "Don't Know", 'ctc' => '60+LPA CTC', 'otherInfo' => ''],
        ['timestamp' => '24/09/2025 17:12:59', 'college' => 'IIT BHU', 'company' => 'Axtria', 'role' => 'Analyst', 'oaDate' => '', 'oaTime' => '', 'cgpa' => '7.5', 'mtechEligible' => 'YES', 'ctc' => '14/12', 'otherInfo' => 'Only CSE Dual degree/MTech and DSE MTech'],
        ['timestamp' => '24/09/2025 17:15:17', 'college' => 'IIT BHU', 'company' => 'Paytm', 'role' => 'SDE', 'oaDate' => '28/09/2025', 'oaTime' => '', 'cgpa' => '7.5', 'mtechEligible' => 'No', 'ctc' => '24/15', 'otherInfo' => ''],
        ['timestamp' => '24/09/2025 18:19:55', 'college' => 'IIT Jodhpur', 'company' => 'Perceptive Analytics', 'role' => 'Data Analytics', 'oaDate' => '', 'oaTime' => '', 'cgpa' => '7', 'mtechEligible' => 'No', 'ctc' => '20LPA', 'otherInfo' => 'Online Test (90 mins) and 1-2 technical and HR rounds (online)'],
        ['timestamp' => '25/09/2025 18:57:25', 'college' => 'IIT BHU (Varanasi)', 'company' => 'Square point capital', 'role' => 'Quant desk analyst, Infrastructure Engineer, Graduate software developer', 'oaDate' => '04/10/2025', 'oaTime' => '', 'cgpa' => '', 'mtechEligible' => 'YES', 'ctc' => '60 lacs', 'otherInfo' => ''],
        ['timestamp' => '26/09/2025 00:41:01', 'college' => 'IIT ISM DHANBAD', 'company' => 'Tredence analytics', 'role' => 'Data science and data analyst', 'oaDate' => '25/09/2025', 'oaTime' => '18:00:00', 'cgpa' => '6.99', 'mtechEligible' => "Don't Know", 'ctc' => 'Ctc- 12 for ds 10 for da', 'otherInfo' => 'MCQ + 3 long question (1sql+1dsa+1ml)'],
        ['timestamp' => '26/09/2025 19:11:54', 'college' => 'IIIT Delhi', 'company' => 'Axtria', 'role' => 'Data Analyst', 'oaDate' => '30/08/2025', 'oaTime' => '', 'cgpa' => '7 in all academics from 10th to mtech', 'mtechEligible' => 'YES', 'ctc' => '14/11.5', 'otherInfo' => 'Majorly Aptitude..Medium to hard. Most of the questions were from Data interpretation and passage.'],
        ['timestamp' => '26/09/2025 19:15:00', 'college' => 'IIIT Delhi', 'company' => 'Augnito', 'role' => 'NLP Engineer and Backend Engineer', 'oaDate' => '', 'oaTime' => '', 'cgpa' => '6.5', 'mtechEligible' => 'YES', 'ctc' => '21', 'otherInfo' => 'Backend: 3 Coding questions. easy, medium, hard. Online test with No camera and microphone. Interviews are DSA and Machine coding based. NLP: Take home assignment was given.'],
        ['timestamp' => '26/09/2025 19:16:54', 'college' => 'IIIT Delhi', 'company' => 'Qualcomm', 'role' => 'Hardware/Software', 'oaDate' => '', 'oaTime' => '', 'cgpa' => "6.5 But Only students above 8.5 get's selected final list", 'mtechEligible' => 'YES', 'ctc' => '30', 'otherInfo' => 'OA had mix of COA, CN, OS, C output based and some aptitude questions.'],
        ['timestamp' => '26/09/2025 19:18:32', 'college' => 'IIIT Delhi', 'company' => 'Flipkart', 'role' => 'Frontend Engineer', 'oaDate' => '', 'oaTime' => '', 'cgpa' => '6.5', 'mtechEligible' => 'YES', 'ctc' => '32', 'otherInfo' => 'OA had 3 coding questions with different different languages. java, kotlin and one more. level was medium to hard.'],
        ['timestamp' => '26/09/2025 22:12:16', 'college' => 'IIT Roorkee', 'company' => 'All software company', 'role' => 'Sde, analyst', 'oaDate' => '', 'oaTime' => '', 'cgpa' => '', 'mtechEligible' => 'No', 'ctc' => '', 'otherInfo' => '']
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