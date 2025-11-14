<?php
require_once 'config.php';
header('Content-Type: application/json; charset=utf-8');

// Usar sessão ao invés de parâmetro
$userId = $_SESSION['user_id'] ?? null;
$currentVideoId = $_GET['video_id'] ?? null;

if (!$userId) {
    echo json_encode(['success' => false, 'error' => 'Não autenticado', 'message' => 'User not authenticated']);
    exit;
}

try {
    $conn = getDBConnection();
    mysqli_set_charset($conn, "utf8mb4");
    
    $sql = "SELECT 
                p.id,
                p.name,
                p.description,
                p.visibility,
                p.created_at,
                COUNT(pv.video_id) as video_count";
    
    if ($currentVideoId) {
        $sql .= ",
                EXISTS(
                    SELECT 1 FROM playlist_videos pv2 
                    WHERE pv2.playlist_id = p.id 
                    AND pv2.video_id = ?
                ) as has_video";
    }
    
    $sql .= "
            FROM playlists p
            LEFT JOIN playlist_videos pv ON p.id = pv.playlist_id
            WHERE p.user_id = ?
            GROUP BY p.id
            ORDER BY p.created_at DESC";
    
    $stmt = $conn->prepare($sql);
    
    if ($currentVideoId) {
        $stmt->bind_param("ii", $currentVideoId, $userId);
    } else {
        $stmt->bind_param("i", $userId);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $playlists = [];
    while ($row = $result->fetch_assoc()) {
        $playlists[] = $row;
    }
    
    $stmt->close();
    mysqli_close($conn);
    
    echo json_encode([
        'success' => true,
        'playlists' => $playlists
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
