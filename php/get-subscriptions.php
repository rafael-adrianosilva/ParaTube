<?php
require_once 'config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode([]);
    exit;
}

$userId = $_SESSION['user_id'];
$conn = getDBConnection();

// Get videos from subscribed channels
$stmt = $conn->prepare("
    SELECT v.*, u.username as channel, 
           DATE_FORMAT(v.created_at, '%d/%m/%Y') as date_formatted
    FROM videos v
    JOIN users u ON v.user_id = u.id
    JOIN subscriptions s ON s.channel_id = v.user_id
    WHERE s.user_id = ?
    ORDER BY v.created_at DESC
    LIMIT 100
");

$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

$videos = [];
while ($row = $result->fetch_assoc()) {
    $videos[] = [
        'id' => $row['id'],
        'title' => $row['title'],
        'description' => $row['description'],
        'channel' => $row['channel'],
        'channelId' => $row['user_id'],
        'views' => (int)$row['views'],
        'likes' => $row['likes'],
        'dislikes' => $row['dislikes'],
        'date' => $row['date_formatted'],
        'created_at' => $row['created_at'],
        'thumbnail' => $row['thumbnail'] ?? 'https://via.placeholder.com/320x180/667eea/ffffff?text=' . urlencode(substr($row['title'], 0, 20)),
        'duration' => gmdate("i:s", $row['duration'])
    ];
}

echo json_encode($videos);

$stmt->close();
$conn->close();
?>
