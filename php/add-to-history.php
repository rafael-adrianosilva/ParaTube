<?php
require_once 'config.php';
header('Content-Type: application/json; charset=utf-8');

$userId = $_SERVER['HTTP_X_USER_ID'] ?? null;

if (!$userId) {
    echo json_encode(['success' => false, 'message' => 'Authentication required']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$videoId = $data['video_id'] ?? null;

if (!$videoId) {
    echo json_encode(['success' => false, 'message' => 'Video ID required']);
    exit;
}

try {
    $conn = getDBConnection();
    mysqli_set_charset($conn, "utf8mb4");
    
    // Check if already watched today
    $stmt = $conn->prepare("
        SELECT id FROM watch_history 
        WHERE user_id = ? AND video_id = ? 
        AND DATE(created_at) = CURDATE()
    ");
    $stmt->bind_param("ii", $userId, $videoId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->fetch_assoc()) {
        // Already watched today, just update timestamp
        $stmt->close();
        $stmt = $conn->prepare("
            UPDATE watch_history 
            SET updated_at = NOW() 
            WHERE user_id = ? AND video_id = ? AND DATE(created_at) = CURDATE()
        ");
        $stmt->bind_param("ii", $userId, $videoId);
        $stmt->execute();
    } else {
        // Add new history entry
        $stmt->close();
        $stmt = $conn->prepare("
            INSERT INTO watch_history (user_id, video_id) 
            VALUES (?, ?)
        ");
        $stmt->bind_param("ii", $userId, $videoId);
        $stmt->execute();
    }
    
    echo json_encode(['success' => true]);
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
