<?php
require_once 'config.php';
require_once 'notification-helper.php';

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);

$videoId = $input['videoId'] ?? null;
$comment = $input['comment'] ?? '';
$parentId = $input['parentId'] ?? null; // For replies

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

// Get video and comment owner info
$stmt_info = $conn->prepare("SELECT v.user_id as video_owner, v.title, u.username as commenter FROM videos v, users u WHERE v.id = ? AND u.id = ?");
$stmt_info->bind_param("ii", $videoId, $userId);
$stmt_info->execute();
$info = $stmt_info->get_result()->fetch_assoc();
$stmt_info->close();

if ($parentId) {
    // Get parent comment owner for reply notification
    $stmt_parent = $conn->prepare("SELECT user_id FROM comments WHERE id = ?");
    $stmt_parent->bind_param("i", $parentId);
    $stmt_parent->execute();
    $parent_owner = $stmt_parent->get_result()->fetch_assoc()['user_id'];
    $stmt_parent->close();
    
    $stmt = $conn->prepare("INSERT INTO comments (video_id, user_id, comment, parent_id, created_at) VALUES (?, ?, ?, ?, NOW())");
    $stmt->bind_param("iisi", $videoId, $userId, $comment, $parentId);
} else {
    $stmt = $conn->prepare("INSERT INTO comments (video_id, user_id, comment, created_at) VALUES (?, ?, ?, NOW())");
    $stmt->bind_param("iis", $videoId, $userId, $comment);
}

if ($stmt->execute()) {
    $commentId = $conn->insert_id;
    
    // Create notifications
    if ($parentId && isset($parent_owner) && $parent_owner != $userId) {
        // Notify parent comment owner about reply
        createNotification(
            $parent_owner,
            'comment_reply',
            'Nova resposta',
            $info['commenter'] . ' respondeu seu comentário',
            'watch.html?v=' . $videoId . '#comment-' . $commentId,
            'fa-comment',
            $userId,
            $videoId,
            $commentId
        );
    } elseif (!$parentId && $info['video_owner'] != $userId) {
        // Notify video owner about new comment
        createNotification(
            $info['video_owner'],
            'comment_reply',
            'Novo comentário',
            $info['commenter'] . ' comentou: ' . substr($comment, 0, 50) . (strlen($comment) > 50 ? '...' : ''),
            'watch.html?v=' . $videoId . '#comment-' . $commentId,
            'fa-comment',
            $userId,
            $videoId,
            $commentId
        );
    }
    
    echo json_encode([
        'success' => true,
        'commentId' => $commentId
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Erro ao adicionar comentário.']);
}

$stmt->close();
$conn->close();
?>
