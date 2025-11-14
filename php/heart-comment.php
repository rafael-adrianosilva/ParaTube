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
        SELECT v.user_id, c.is_hearted
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
        echo json_encode(['success' => false, 'message' => 'Apenas o criador do vídeo pode dar coração']);
        exit;
    }
    
    // Toggle heart status
    $current_hearted = $result['is_hearted'];
    $new_hearted = $current_hearted ? 0 : 1;
    
    $stmt2 = $conn->prepare("UPDATE comments SET is_hearted = ? WHERE id = ?");
    $stmt2->bind_param("ii", $new_hearted, $comment_id);
    $stmt2->execute();
    $stmt2->close();
    
    // Notify comment owner when hearted
    if ($new_hearted) {
        require_once 'notification-helper.php';
        
        $stmt3 = $conn->prepare("SELECT user_id, video_id FROM comments WHERE id = ?");
        $stmt3->bind_param("i", $comment_id);
        $stmt3->execute();
        $comment_info = $stmt3->get_result()->fetch_assoc();
        $stmt3->close();
        
        if ($comment_info['user_id'] != $_SESSION['user_id']) {
            createNotification(
                $comment_info['user_id'],
                'comment_hearted',
                'Comentário curtido ❤️',
                'O criador curtiu seu comentário',
                'watch.html?v=' . $comment_info['video_id'] . '#comment-' . $comment_id,
                'fa-heart',
                $_SESSION['user_id'],
                $comment_info['video_id'],
                $comment_id
            );
        }
    }
    
    echo json_encode([
        'success' => true,
        'is_hearted' => $new_hearted,
        'message' => $new_hearted ? 'Coração adicionado' : 'Coração removido'
    ]);
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro no servidor: ' . $e->getMessage()]);
}
