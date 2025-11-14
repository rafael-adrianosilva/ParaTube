<?php
require_once 'config.php';
header('Content-Type: application/json');

$userId = $_SERVER['HTTP_X_USER_ID'] ?? null;

if (!$userId) {
    echo json_encode(['success' => false, 'message' => 'Authentication required']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$playlistId = $data['playlist_id'] ?? null;
$videoId = $data['video_id'] ?? null;

if (!$playlistId || !$videoId) {
    echo json_encode(['success' => false, 'message' => 'Playlist ID and Video ID required']);
    exit;
}

try {
    // Verify playlist belongs to user
    $stmt = $pdo->prepare("SELECT id FROM playlists WHERE id = ? AND user_id = ?");
    $stmt->execute([$playlistId, $userId]);
    
    if (!$stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Playlist not found']);
        exit;
    }
    
    // Remove video from playlist
    $stmt = $pdo->prepare("DELETE FROM playlist_videos WHERE playlist_id = ? AND video_id = ?");
    $stmt->execute([$playlistId, $videoId]);
    
    echo json_encode(['success' => true]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
