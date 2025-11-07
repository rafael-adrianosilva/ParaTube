<?php
require_once 'config.php';

header('Content-Type: application/json');

// Check localStorage user if session doesn't exist
if (!isset($_SESSION['user_id'])) {
    // Try to get from request headers if sent
    $headers = getallheaders();
    if (isset($headers['X-User-Id'])) {
        $userId = (int)$headers['X-User-Id'];
    } else {
        echo json_encode([]);
        exit;
    }
} else {
    $userId = $_SESSION['user_id'];
}

$conn = getDBConnection();

// Get list of subscribed channels
$stmt = $conn->prepare("
    SELECT u.id, u.username, u.profile_image,
           COUNT(DISTINCT v.id) as video_count,
           COUNT(DISTINCT s2.user_id) as subscriber_count
    FROM subscriptions s
    JOIN users u ON s.channel_id = u.id
    LEFT JOIN videos v ON v.user_id = u.id
    LEFT JOIN subscriptions s2 ON s2.channel_id = u.id
    WHERE s.user_id = ?
    GROUP BY u.id, u.username, u.profile_image
    ORDER BY s.created_at DESC
");

$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

$channels = [];
while ($row = $result->fetch_assoc()) {
    $channels[] = [
        'id' => $row['id'],
        'username' => $row['username'],
        'avatar' => $row['profile_image'] ?? null,
        'videoCount' => (int)$row['video_count'],
        'subscribers' => (int)$row['subscriber_count']
    ];
}

echo json_encode($channels);

$stmt->close();
$conn->close();
?>
