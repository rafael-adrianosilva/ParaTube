<?php
require_once 'config.php';

header('Content-Type: application/json');

$video_id = $_GET['video_id'] ?? null;

if (!$video_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'video_id required']);
    exit;
}

try {
    $conn = getDBConnection();
    
    // Get aggregated heatmap data
    $stmt = $conn->prepare("
        SELECT 
            timestamp_bucket,
            seek_count,
            skip_count,
            rewind_count,
            replay_count,
            total_interactions
        FROM video_heatmap_aggregated
        WHERE video_id = ?
        ORDER BY timestamp_bucket ASC
    ");
    $stmt->bind_param("i", $video_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $heatmap = [];
    $max_interactions = 0;
    
    while ($row = $result->fetch_assoc()) {
        $heatmap[] = [
            'timestamp' => (int)$row['timestamp_bucket'],
            'seek_count' => (int)$row['seek_count'],
            'skip_count' => (int)$row['skip_count'],
            'rewind_count' => (int)$row['rewind_count'],
            'replay_count' => (int)$row['replay_count'],
            'total' => (int)$row['total_interactions']
        ];
        
        if ($row['total_interactions'] > $max_interactions) {
            $max_interactions = $row['total_interactions'];
        }
    }
    
    // Get total views for context
    $stmt2 = $conn->prepare("SELECT views FROM videos WHERE id = ?");
    $stmt2->bind_param("i", $video_id);
    $stmt2->execute();
    $video_data = $stmt2->get_result()->fetch_assoc();
    
    echo json_encode([
        'success' => true,
        'heatmap' => $heatmap,
        'max_interactions' => $max_interactions,
        'total_views' => (int)$video_data['views']
    ]);
    
    $stmt->close();
    $stmt2->close();
    $conn->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
