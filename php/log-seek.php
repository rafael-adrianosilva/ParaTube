<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

$video_id = $data['video_id'] ?? null;
$timestamp = $data['timestamp'] ?? null; // Position in seconds
$event_type = $data['event_type'] ?? 'seek_to'; // seek_to, skip_from, rewind_to, replay
$user_id = $_SESSION['user_id'] ?? null;

if (!$video_id || $timestamp === null) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Dados inválidos']);
    exit;
}

try {
    $conn = getDBConnection();
    
    // Log raw event
    if ($user_id) {
        $stmt = $conn->prepare("INSERT INTO video_heatmap (video_id, timestamp_position, event_type, user_id) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("iisi", $video_id, $timestamp, $event_type, $user_id);
    } else {
        $stmt = $conn->prepare("INSERT INTO video_heatmap (video_id, timestamp_position, event_type) VALUES (?, ?, ?)");
        $stmt->bind_param("iis", $video_id, $timestamp, $event_type);
    }
    
    $stmt->execute();
    $stmt->close();
    
    // Update aggregated data (bucket to 5-second intervals)
    $bucket = floor($timestamp / 5) * 5;
    
    $column = match($event_type) {
        'skip_from' => 'skip_count',
        'rewind_to' => 'rewind_count',
        'replay' => 'replay_count',
        default => 'seek_count'
    };
    
    $stmt2 = $conn->prepare("
        INSERT INTO video_heatmap_aggregated (video_id, timestamp_bucket, $column, total_interactions)
        VALUES (?, ?, 1, 1)
        ON DUPLICATE KEY UPDATE 
            $column = $column + 1,
            total_interactions = total_interactions + 1
    ");
    $stmt2->bind_param("ii", $video_id, $bucket);
    $stmt2->execute();
    $stmt2->close();
    
    $conn->close();
    
    echo json_encode(['success' => true]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
