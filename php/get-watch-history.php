<?php
require_once 'config.php';
header('Content-Type: application/json; charset=utf-8');

$userId = $_GET['user_id'] ?? null;

if (!$userId) {
    echo json_encode(['success' => false, 'message' => 'User ID required']);
    exit;
}

try {
    $conn = getDBConnection();
    mysqli_set_charset($conn, "utf8mb4");
    
    $stmt = $conn->prepare("
        SELECT 
            wh.id as history_id,
            wh.created_at as watched_at,
            v.id,
            v.title,
            v.thumbnail,
            v.duration,
            v.views,
            v.created_at,
            v.user_id,
            u.username as channel_name
        FROM watch_history wh
        JOIN videos v ON wh.video_id = v.id
        JOIN users u ON v.user_id = u.id
        WHERE wh.user_id = ?
        ORDER BY wh.created_at DESC
        LIMIT 100
    ");
    
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $history = $result->fetch_all(MYSQLI_ASSOC);
    
    echo json_encode([
        'success' => true,
        'history' => $history
    ]);
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
