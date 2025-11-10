<?php
// Test script to debug my-channel issues
session_start();
require_once 'config.php';

header('Content-Type: application/json');

// Simulate user logged in
$testUserId = isset($_GET['userId']) ? intval($_GET['userId']) : 1;

echo "<h1>Testing My Channel Backend</h1>";
echo "<pre>";

$conn = getDBConnection();

// Test 1: Check if user exists
echo "\n=== TEST 1: User Exists ===\n";
$stmt = $conn->prepare("SELECT id, username, email, profile_image, bio FROM users WHERE id = ?");
$stmt->bind_param("i", $testUserId);
$stmt->execute();
$result = $stmt->get_result();
if ($user = $result->fetch_assoc()) {
    echo "✅ User found:\n";
    print_r($user);
} else {
    echo "❌ User NOT found with ID: $testUserId\n";
}
$stmt->close();

// Test 2: Check videos
echo "\n=== TEST 2: User Videos ===\n";
$stmt = $conn->prepare("SELECT id, title, thumbnail, views, duration, created_at FROM videos WHERE user_id = ?");
$stmt->bind_param("i", $testUserId);
$stmt->execute();
$result = $stmt->get_result();
$videos = [];
while ($row = $result->fetch_assoc()) {
    $videos[] = $row;
}
echo "Total videos: " . count($videos) . "\n";
if (count($videos) > 0) {
    echo "✅ Videos found:\n";
    print_r($videos);
} else {
    echo "⚠️ No videos found for user ID: $testUserId\n";
}
$stmt->close();

// Test 3: Check stats
echo "\n=== TEST 3: Channel Stats ===\n";
$stmt = $conn->prepare("SELECT COUNT(*) as count FROM subscriptions WHERE channel_id = ?");
$stmt->bind_param("i", $testUserId);
$stmt->execute();
$result = $stmt->get_result();
$subData = $result->fetch_assoc();
echo "Subscribers: " . $subData['count'] . "\n";
$stmt->close();

$stmt = $conn->prepare("SELECT COUNT(*) as count FROM videos WHERE user_id = ?");
$stmt->bind_param("i", $testUserId);
$stmt->execute();
$result = $stmt->get_result();
$vidData = $result->fetch_assoc();
echo "Videos: " . $vidData['count'] . "\n";
$stmt->close();

// Test 4: List all users
echo "\n=== TEST 4: All Users in Database ===\n";
$result = $conn->query("SELECT id, username FROM users ORDER BY id");
while ($row = $result->fetch_assoc()) {
    echo "ID: " . $row['id'] . " - Username: " . $row['username'] . "\n";
}

$conn->close();

echo "</pre>";
?>
