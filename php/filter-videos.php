<?php
require_once 'config.php';

header('Content-Type: application/json');

$category = $_GET['category'] ?? '';

if (empty($category)) {
    echo json_encode([]);
    exit;
}

$conn = getDBConnection();

// Map Portuguese categories to database values
$categoryMap = [
    'Música' => 'music',
    'Jogos' => 'games',
    'Notícias' => 'news',
    'Esportes' => 'sports',
    'Educação' => 'education',
    'Tecnologia' => 'tech',
    'Culinária' => 'cooking'
];

$dbCategory = $categoryMap[$category] ?? strtolower($category);

$stmt = $conn->prepare("
    SELECT 
        v.id,
        v.title,
        v.views,
        v.duration,
        v.created_at,
        v.thumbnail,
        u.username as channel,
        u.profile_image,
        v.filename
    FROM videos v
    JOIN users u ON v.user_id = u.id
    WHERE v.category = ?
    ORDER BY v.created_at DESC
    LIMIT 30
");

$stmt->bind_param("s", $dbCategory);
$stmt->execute();
$result = $stmt->get_result();

$videos = [];

while ($row = $result->fetch_assoc()) {
    // Use thumbnail from database, or generate placeholder
    $thumbnail = $row['thumbnail'];
    if (!$thumbnail || !file_exists('../' . $thumbnail)) {
        $thumbnail = 'https://via.placeholder.com/320x180/667eea/ffffff?text=' . urlencode(substr($row['title'], 0, 30));
    }
    
    $videos[] = [
        'id' => $row['id'],
        'title' => $row['title'],
        'channel' => $row['channel'],
        'profile_image' => $row['profile_image'],
        'views' => (int)$row['views'],
        'date' => timeAgo($row['created_at']),
        'created_at' => $row['created_at'],
        'duration' => formatDuration($row['duration']),
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
