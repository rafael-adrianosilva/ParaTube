<?php
require_once 'config.php';

header('Content-Type: application/json');

$conn = getDBConnection();

// Get trending videos (most views in the last 7 days)
$stmt = $conn->prepare("
    SELECT v.*, u.username as channel, u.profile_image,
           DATE_FORMAT(v.created_at, '%d/%m/%Y') as date_formatted
    FROM videos v
    JOIN users u ON v.user_id = u.id
    WHERE v.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    ORDER BY v.views DESC, v.likes DESC
    LIMIT 50
");

$stmt->execute();
$result = $stmt->get_result();

$videos = [];
while ($row = $result->fetch_assoc()) {
    $videos[] = [
        'id' => $row['id'],
        'title' => $row['title'],
        'description' => $row['description'],
        'channel_name' => $row['channel'],
        'user_id' => $row['user_id'],
        'avatar' => $row['profile_image'] ? $row['profile_image'] : 'assets/default-avatar.png',
        'views' => (int)$row['views'],
        'likes' => $row['likes'],
        'dislikes' => $row['dislikes'],
        'created_at' => $row['created_at'],
        'thumbnail_url' => $row['thumbnail'] ?? 'https://via.placeholder.com/320x180/667eea/ffffff?text=' . urlencode(substr($row['title'], 0, 20)),
        'duration' => gmdate("i:s", $row['duration'] ?? 0)
    ];
}

echo json_encode(['success' => true, 'videos' => $videos]);

$stmt->close();
$conn->close();
?>
