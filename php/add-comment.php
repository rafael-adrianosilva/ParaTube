<?php
require_once 'config.php';

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);

$videoId = $input['videoId'] ?? null;
$comment = $input['comment'] ?? '';

if (!$videoId || empty($comment)) {
    echo json_encode(['success' => false, 'message' => 'Dados inválidos']);
    exit;
}

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Você precisa estar logado para comentar.']);
    exit;
}

$userId = $_SESSION['user_id'];

$conn = getDBConnection();

$stmt = $conn->prepare("INSERT INTO comments (video_id, user_id, comment, created_at) VALUES (?, ?, ?, NOW())");
$stmt->bind_param("iis", $videoId, $userId, $comment);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'commentId' => $conn->insert_id
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Erro ao adicionar comentário.']);
}

$stmt->close();
$conn->close();
?>
