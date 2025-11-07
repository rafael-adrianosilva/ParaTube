<?php
require_once 'config.php';

header('Content-Type: application/json');

$videoId = $_GET['id'] ?? null;

if (!$videoId) {
    echo json_encode(['error' => 'ID do vídeo não fornecido']);
    exit;
}

$conn = getDBConnection();

$stmt = $conn->prepare("
    SELECT 
        v.id,
        v.title,
        v.description,
        v.views,
        v.likes,
        v.dislikes,
        v.filename,
        v.created_at,
        u.id as channel_id,
        u.username as channel,
        u.profile_image as channel_avatar,
        (SELECT COUNT(*) FROM subscriptions WHERE channel_id = u.id) as subscribers
    FROM videos v
    JOIN users u ON v.user_id = u.id
    WHERE v.id = ?
");

$stmt->bind_param("i", $videoId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['error' => 'Vídeo não encontrado']);
    exit;
}

$video = $result->fetch_assoc();

// Check if current user is subscribed to this channel
$isSubscribed = false;
if (isset($_SESSION['user_id'])) {
    $currentUserId = $_SESSION['user_id'];
    $checkSubStmt = $conn->prepare("SELECT id FROM subscriptions WHERE user_id = ? AND channel_id = ?");
    $checkSubStmt->bind_param("ii", $currentUserId, $video['channel_id']);
    $checkSubStmt->execute();
    $subResult = $checkSubStmt->get_result();
    $isSubscribed = $subResult->num_rows > 0;
    $checkSubStmt->close();
}

echo json_encode([
    'id' => $video['id'],
    'title' => $video['title'],
    'description' => $video['description'],
    'views' => $video['views'],
    'likes' => $video['likes'],
    'dislikes' => $video['dislikes'],
    'date' => timeAgo($video['created_at']),
    'created_at' => $video['created_at'],
    'channel' => $video['channel'],
    'user_id' => $video['channel_id'],
    'channelId' => $video['channel_id'],
    'channel_avatar' => $video['channel_avatar'],
    'subscribers' => formatViews($video['subscribers']),
    'isSubscribed' => $isSubscribed,
    'videoUrl' => 'uploads/' . $video['filename']
]);

$stmt->close();
$conn->close();

function formatViews($views) {
    if ($views >= 1000000) {
        return number_format($views / 1000000, 1) . 'M';
    } elseif ($views >= 1000) {
        return number_format($views / 1000, 1) . 'K';
    }
    return $views;
}

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
