<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

session_start();

$userId = null;
if (isset($_SESSION['user_id'])) {
    $userId = $_SESSION['user_id'];
} elseif (isset($_SERVER['HTTP_X_USER_ID'])) {
    $userId = intval($_SERVER['HTTP_X_USER_ID']);
}

$videoId = $_GET['video_id'] ?? null;

if (!$userId || !$videoId) {
    echo json_encode(['success' => false, 'message' => 'Dados inválidos']);
    exit;
}

$conn = getDBConnection();

// Verify ownership
$stmt = $conn->prepare("SELECT id FROM videos WHERE id = ? AND user_id = ?");
$stmt->bind_param("ii", $videoId, $userId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Sem permissão']);
    $stmt->close();
    $conn->close();
    exit;
}
$stmt->close();

// Get video stats
$stmt = $conn->prepare("
    SELECT 
        v.views,
        COUNT(DISTINCT c.id) as comments,
        SUM(CASE WHEN vr.reaction = 'like' THEN 1 ELSE 0 END) as likes,
        SUM(CASE WHEN vr.reaction = 'dislike' THEN 1 ELSE 0 END) as dislikes
    FROM videos v
    LEFT JOIN comments c ON v.id = c.video_id
    LEFT JOIN video_reactions vr ON v.id = vr.video_id
    WHERE v.id = ?
    GROUP BY v.id
");

$stmt->bind_param("i", $videoId);
$stmt->execute();
$result = $stmt->get_result();
$stats = $result->fetch_assoc();

echo json_encode([
    'success' => true,
    'views' => (int)($stats['views'] ?? 0),
    'comments' => (int)($stats['comments'] ?? 0),
    'likes' => (int)($stats['likes'] ?? 0),
    'dislikes' => (int)($stats['dislikes'] ?? 0)
]);

$stmt->close();
$conn->close();
?>
