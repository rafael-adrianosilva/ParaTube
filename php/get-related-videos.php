<?php
require_once 'config.php';

header('Content-Type: application/json');

$videoId = $_GET['videoId'] ?? null;

if (!$videoId) {
    echo json_encode([]);
    exit;
}

$conn = getDBConnection();

// Get the category of the current video
$stmt = $conn->prepare("SELECT category, user_id FROM videos WHERE id = ?");
$stmt->bind_param("i", $videoId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode([]);
    exit;
}

$currentVideo = $result->fetch_assoc();
$category = $currentVideo['category'];
$userId = $currentVideo['user_id'];

// Get related videos from the same category or same channel
$stmt = $conn->prepare("
    SELECT 
        v.id,
        v.title,
        v.views,
        v.created_at,
        v.thumbnail,
        u.username as channel,
        v.filename
    FROM videos v
    JOIN users u ON v.user_id = u.id
    WHERE (v.category = ? OR v.user_id = ?) AND v.id != ?
    ORDER BY v.views DESC
    LIMIT 10
");

$stmt->bind_param("sii", $category, $userId, $videoId);
$stmt->execute();
$result = $stmt->get_result();

$videos = [];

while ($row = $result->fetch_assoc()) {
    // Use thumbnail from database, or generate placeholder
    $thumbnail = $row['thumbnail'];
    if (!$thumbnail || !file_exists('../' . $thumbnail)) {
        $thumbnail = 'https://via.placeholder.com/168x94/667eea/ffffff?text=' . urlencode(substr($row['title'], 0, 20));
    }
    
    $videos[] = [
        'id' => $row['id'],
        'title' => $row['title'],
        'channel' => $row['channel'],
        'views' => formatViews($row['views']),
        'date' => timeAgo($row['created_at']),
        'thumbnail' => $thumbnail
    ];
}

echo json_encode($videos);

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
    
    if ($diff < 3600) {
        return floor($diff / 60) . ' minutos atrás';
    } elseif ($diff < 86400) {
        return floor($diff / 3600) . ' horas atrás';
    } elseif ($diff < 604800) {
        return floor($diff / 86400) . ' dias atrás';
    } else {
        return date('d/m/Y', $timestamp);
    }
}
?>
