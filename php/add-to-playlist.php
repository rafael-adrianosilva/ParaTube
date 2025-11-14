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
    
    // Check if video already in playlist
    $stmt = $pdo->prepare("SELECT id FROM playlist_videos WHERE playlist_id = ? AND video_id = ?");
    $stmt->execute([$playlistId, $videoId]);
    
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Video already in playlist']);
        exit;
    }
    
    // Get the highest position
    $stmt = $pdo->prepare("SELECT MAX(position) as max_pos FROM playlist_videos WHERE playlist_id = ?");
    $stmt->execute([$playlistId]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $position = ($result['max_pos'] ?? 0) + 1;
    
    // Add video to playlist
    $stmt = $pdo->prepare("
        INSERT INTO playlist_videos (playlist_id, video_id, position, added_at)
        VALUES (?, ?, ?, NOW())
    ");
    
    $stmt->execute([$playlistId, $videoId, $position]);
    
    echo json_encode(['success' => true]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
