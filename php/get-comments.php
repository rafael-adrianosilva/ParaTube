<?php
require_once 'config.php';

header('Content-Type: application/json');

$videoId = $_GET['videoId'] ?? null;

if (!$videoId) {
    echo json_encode([]);
    exit;
}

$conn = getDBConnection();

$stmt = $conn->prepare("
    SELECT 
        c.id,
        c.comment,
        c.likes,
        c.created_at,
        c.user_id,
        c.parent_id,
        c.is_pinned,
        c.is_hearted,
        c.edited_at,
        u.username as author,
        u.profile_image as author_avatar
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.video_id = ?
    ORDER BY c.is_pinned DESC, c.created_at DESC
");

$stmt->bind_param("i", $videoId);
$stmt->execute();
$result = $stmt->get_result();

$comments = [];

while ($row = $result->fetch_assoc()) {
    $comments[] = [
        'id' => $row['id'],
        'author' => $row['author'],
        'user_id' => $row['user_id'],
        'author_avatar' => $row['author_avatar'],
        'text' => $row['comment'],
        'likes' => $row['likes'],
        'date' => timeAgo($row['created_at']),
        'created_at' => $row['created_at'],
        'parent_id' => $row['parent_id'],
        'is_pinned' => (bool)$row['is_pinned'],
        'is_hearted' => (bool)$row['is_hearted'],
        'edited_at' => $row['edited_at']
    ];
}

echo json_encode($comments);

$stmt->close();
$conn->close();

function timeAgo($datetime) {
    $timestamp = strtotime($datetime);
    $diff = time() - $timestamp;
    
    if ($diff < 60) {
        return 'agora';
    } elseif ($diff < 3600) {
        $minutes = floor($diff / 60);
        return $minutes . ' minuto' . ($minutes > 1 ? 's' : '') . ' atrás';
    } elseif ($diff < 86400) {
        $hours = floor($diff / 3600);
        return $hours . ' hora' . ($hours > 1 ? 's' : '') . ' atrás';
    } elseif ($diff < 604800) {
        $days = floor($diff / 86400);
        return $days . ' dia' . ($days > 1 ? 's' : '') . ' atrás';
    } else {
        return date('d/m/Y', $timestamp);
    }
}
?>
