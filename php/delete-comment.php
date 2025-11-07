<?php
header('Content-Type: application/json');
session_start();

// Get user ID from session or header
$user_id = $_SESSION['user_id'] ?? $_SERVER['HTTP_X_USER_ID'] ?? null;

if (!$user_id) {
    http_response_code(401);
    echo json_encode(['error' => 'Não autenticado']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$comment_id = $data['comment_id'] ?? null;

if (!$comment_id) {
    http_response_code(400);
    echo json_encode(['error' => 'ID do comentário não fornecido']);
    exit;
}

require_once 'config.php';

try {
    $conn = getDBConnection();
    
    // Verify the comment belongs to the user
    $stmt = $conn->prepare("SELECT user_id FROM comments WHERE id = ?");
    $stmt->bind_param("i", $comment_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Comentário não encontrado']);
        exit;
    }
    
    $comment = $result->fetch_assoc();
    
    if ($comment['user_id'] != $user_id) {
        http_response_code(403);
        echo json_encode(['error' => 'Você não tem permissão para apagar este comentário']);
        exit;
    }
    
    // Delete the comment
    $deleteStmt = $conn->prepare("DELETE FROM comments WHERE id = ?");
    $deleteStmt->bind_param("i", $comment_id);
    
    if ($deleteStmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Comentário apagado com sucesso']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao apagar comentário']);
    }
    
    $deleteStmt->close();
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro no servidor: ' . $e->getMessage()]);
}
?>
