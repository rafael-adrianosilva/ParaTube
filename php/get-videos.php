<?php
require_once 'config.php';

header('Content-Type: application/json');

$conn = getDBConnection();

$query = "
    SELECT 
        v.id,
        v.title,
        v.views,
        v.duration,
        v.created_at,
        v.thumbnail,
        v.visibility,
        v.user_id,
        u.username as channel,
        u.profile_image,
        v.filename
    FROM videos v
    JOIN users u ON v.user_id = u.id
    WHERE v.visibility = 'public'
    ORDER BY v.created_at DESC
    LIMIT 50
";

$result = $conn->query($query);

$videos = [];

while ($row = $result->fetch_assoc()) {
    // Use thumbnail from database, or generate placeholder
    $thumbnail = $row['thumbnail'];
    if (!$thumbnail || !file_exists('../' . $thumbnail)) {
        // Generate placeholder with video title
        $thumbnail = 'https://via.placeholder.com/320x180/667eea/ffffff?text=' . urlencode(substr($row['title'], 0, 30));
    }
    
    $videos[] = [
        'id' => $row['id'],
        'title' => $row['title'],
        'channel' => $row['channel'],
        'user_id' => $row['user_id'],
        'profile_image' => $row['profile_image'] ? $row['profile_image'] : null,
        'views' => (int)$row['views'],
        'date' => timeAgo($row['created_at']),
        'created_at' => $row['created_at'],
        'duration' => formatDuration($row['duration']),
        'thumbnail' => $thumbnail,
        'visibility' => $row['visibility']
    ];
}

echo json_encode($videos);

$conn->close();

function formatViews($views) {
    if ($views >= 1000000) {
        return number_format($views / 1000000, 1) . 'M';
    } elseif ($views >= 1000) {
        return number_format($views / 1000, 1) . 'K';
    }
    return $views;
}

function formatDuration($seconds) {
    $hours = floor($seconds / 3600);
    $minutes = floor(($seconds % 3600) / 60);
    $seconds = $seconds % 60;
    
    if ($hours > 0) {
        return sprintf('%d:%02d:%02d', $hours, $minutes, $seconds);
    }
    return sprintf('%d:%02d', $minutes, $seconds);
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
    } elseif ($diff < 2592000) {
        $weeks = floor($diff / 604800);
        return $weeks . ' semana' . ($weeks > 1 ? 's' : '') . ' atrás';
    } else {
        $months = floor($diff / 2592000);
        return $months . ' ' . ($months > 1 ? 'meses' : 'mês') . ' atrás';
    }
}
?>
