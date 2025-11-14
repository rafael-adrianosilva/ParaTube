<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    exit;
}

// Verificar autenticação
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Não autenticado']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$comment_id = $data['comment_id'] ?? null;

if (!$comment_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID do comentário não fornecido']);
    exit;
}

try {
    $conn = getDBConnection();
    
    // Verificar se o usuário é o dono do vídeo
    $stmt = $conn->prepare("
        SELECT v.user_id, v.id as video_id, c.is_pinned
        FROM comments c
        JOIN videos v ON c.video_id = v.id
        WHERE c.id = ?
    ");
    $stmt->bind_param("i", $comment_id);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    
    if (!$result) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Comentário não encontrado']);
        exit;
    }
    
    if ($result['user_id'] != $_SESSION['user_id']) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Apenas o criador do vídeo pode fixar comentários']);
        exit;
    }
    
    $video_id = $result['video_id'];
    $current_pinned = $result['is_pinned'];
    
    // Se está fixando, desfixar todos os outros comentários primeiro (apenas 1 fixado por vídeo)
    if (!$current_pinned) {
        $stmt2 = $conn->prepare("UPDATE comments SET is_pinned = 0 WHERE video_id = ?");
        $stmt2->bind_param("i", $video_id);
        $stmt2->execute();
        $stmt2->close();
    }
    
    // Toggle pin status
    $new_pinned = $current_pinned ? 0 : 1;
    $stmt3 = $conn->prepare("UPDATE comments SET is_pinned = ? WHERE id = ?");
    $stmt3->bind_param("ii", $new_pinned, $comment_id);
    $stmt3->execute();
    $stmt3->close();
    
    // Notify comment owner when pinned
    if ($new_pinned) {
        require_once 'notification-helper.php';
        
        $stmt4 = $conn->prepare("SELECT user_id FROM comments WHERE id = ?");
        $stmt4->bind_param("i", $comment_id);
        $stmt4->execute();
        $comment_owner = $stmt4->get_result()->fetch_assoc()['user_id'];
        $stmt4->close();
        
        if ($comment_owner != $_SESSION['user_id']) {
            createNotification(
                $comment_owner,
                'comment_pinned',
                'Comentário fixado!',
                'O criador fixou seu comentário',
                'watch.html?v=' . $video_id . '#comment-' . $comment_id,
                'fa-thumbtack',
                $_SESSION['user_id'],
                $video_id,
                $comment_id
            );
        }
    }
    
    echo json_encode([
        'success' => true,
        'is_pinned' => $new_pinned,
        'message' => $new_pinned ? 'Comentário fixado' : 'Comentário desfixado'
    ]);
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro no servidor: ' . $e->getMessage()]);
}
