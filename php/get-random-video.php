<?php
require_once 'config.php';
header('Content-Type: application/json; charset=utf-8');

$currentVideoId = $_GET['exclude'] ?? null;

try {
    $conn = getDBConnection();
    mysqli_set_charset($conn, "utf8mb4");
    
    // Get a random video (excluding the current one if provided)
    $sql = "SELECT v.id, v.title, v.thumbnail, v.duration, v.views, v.created_at, v.user_id, u.username as channel_name 
            FROM videos v
            JOIN users u ON v.user_id = u.id
            WHERE v.visibility = 'public'";
    
    if ($currentVideoId) {
        $sql .= " AND v.id != ?";
        $stmt = $conn->prepare($sql . " ORDER BY RAND() LIMIT 1");
        $stmt->bind_param("i", $currentVideoId);
    } else {
        $stmt = $conn->prepare($sql . " ORDER BY RAND() LIMIT 1");
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    $video = $result->fetch_assoc();
    
    if ($video) {
        echo json_encode([
            'success' => true,
            'video' => $video
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'No videos found'
        ]);
    }
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
