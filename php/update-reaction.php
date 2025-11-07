<?php
require_once 'config.php';

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);

$videoId = $input['videoId'] ?? null;
$reaction = $input['reaction'] ?? null; // 'like', 'dislike', or 'none'
$userId = $_SESSION['user_id'] ?? null;

if (!$videoId) {
    echo json_encode(['success' => false, 'message' => 'Dados inválidos']);
    exit;
}

if (!$userId) {
    echo json_encode(['success' => false, 'message' => 'Usuário não autenticado']);
    exit;
}

$conn = getDBConnection();

// Check if user already has a reaction
$stmt = $conn->prepare("SELECT reaction FROM video_reactions WHERE video_id = ? AND user_id = ?");
$stmt->bind_param("ii", $videoId, $userId);
$stmt->execute();
$result = $stmt->get_result();
$existingReaction = $result->fetch_assoc();

if ($reaction === 'none') {
    // Remove reaction
    if ($existingReaction) {
        // Decrement the counter
        if ($existingReaction['reaction'] === 'like') {
            $stmt = $conn->prepare("UPDATE videos SET likes = GREATEST(0, likes - 1) WHERE id = ?");
        } else {
            $stmt = $conn->prepare("UPDATE videos SET dislikes = GREATEST(0, dislikes - 1) WHERE id = ?");
        }
        $stmt->bind_param("i", $videoId);
        $stmt->execute();
        
        // Delete the reaction
        $stmt = $conn->prepare("DELETE FROM video_reactions WHERE video_id = ? AND user_id = ?");
        $stmt->bind_param("ii", $videoId, $userId);
        $stmt->execute();
    }
} else {
    // Add or update reaction
    if ($existingReaction) {
        if ($existingReaction['reaction'] !== $reaction) {
            // Update counters: decrement old, increment new
            if ($existingReaction['reaction'] === 'like') {
                $stmt = $conn->prepare("UPDATE videos SET likes = GREATEST(0, likes - 1), dislikes = dislikes + 1 WHERE id = ?");
            } else {
                $stmt = $conn->prepare("UPDATE videos SET dislikes = GREATEST(0, dislikes - 1), likes = likes + 1 WHERE id = ?");
            }
            $stmt->bind_param("i", $videoId);
            $stmt->execute();
            
            // Update reaction
            $stmt = $conn->prepare("UPDATE video_reactions SET reaction = ?, updated_at = NOW() WHERE video_id = ? AND user_id = ?");
            $stmt->bind_param("sii", $reaction, $videoId, $userId);
            $stmt->execute();
        }
    } else {
        // Insert new reaction
        $stmt = $conn->prepare("INSERT INTO video_reactions (video_id, user_id, reaction) VALUES (?, ?, ?)");
        $stmt->bind_param("iis", $videoId, $userId, $reaction);
        $stmt->execute();
        
        // Increment counter
        if ($reaction === 'like') {
            $stmt = $conn->prepare("UPDATE videos SET likes = likes + 1 WHERE id = ?");
        } else {
            $stmt = $conn->prepare("UPDATE videos SET dislikes = dislikes + 1 WHERE id = ?");
        }
        $stmt->bind_param("i", $videoId);
        $stmt->execute();
    }
}

// Get updated counts
$stmt = $conn->prepare("SELECT likes, dislikes FROM videos WHERE id = ?");
$stmt->bind_param("i", $videoId);
$stmt->execute();
$result = $stmt->get_result();
$video = $result->fetch_assoc();

echo json_encode([
    'success' => true,
    'likes' => $video['likes'],
    'dislikes' => $video['dislikes']
]);

$stmt->close();
$conn->close();
?>
