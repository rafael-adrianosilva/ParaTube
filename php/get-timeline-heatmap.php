<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

$conn = getDBConnection();

$videoId = intval($_GET['video_id'] ?? 0);

if (!$videoId) {
    echo json_encode([]);
    exit;
}

// Get heatmap data for video
$stmt = $conn->prepare("
    SELECT 
        timestamp_seconds,
        view_count,
        skip_count,
        replay_count
    FROM video_timeline_data
    WHERE video_id = ?
    ORDER BY timestamp_seconds ASC
");
$stmt->bind_param("i", $videoId);
$stmt->execute();
$result = $stmt->get_result();

$heatmap = [];
while ($row = $result->fetch_assoc()) {
    $heatmap[] = [
        'timestamp_seconds' => intval($row['timestamp_seconds']),
        'view_count' => intval($row['view_count']),
        'skip_count' => intval($row['skip_count']),
        'replay_count' => intval($row['replay_count'])
    ];
}

echo json_encode($heatmap);

$stmt->close();
$conn->close();
?>
