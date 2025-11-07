<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, X-User-Id');

session_start();

$userId = null;
if (isset($_SESSION['user_id'])) {
    $userId = $_SESSION['user_id'];
} elseif (isset($_SERVER['HTTP_X_USER_ID'])) {
    $userId = intval($_SERVER['HTTP_X_USER_ID']);
}

if (!$userId) {
    echo json_encode(['success' => false, 'message' => 'Não autorizado']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$videoId = $input['video_id'] ?? null;
$visibility = $input['visibility'] ?? 'public';

if (!$videoId) {
    echo json_encode(['success' => false, 'message' => 'Dados inválidos']);
    exit;
}

$conn = getDBConnection();

// Verify ownership and update
$stmt = $conn->prepare("UPDATE videos SET visibility = ? WHERE id = ? AND user_id = ?");
$stmt->bind_param("sii", $visibility, $videoId, $userId);

if ($stmt->execute() && $stmt->affected_rows > 0) {
    echo json_encode(['success' => true, 'message' => 'Visibilidade atualizada']);
} else {
    echo json_encode(['success' => false, 'message' => 'Vídeo não encontrado ou sem permissão']);
}

$stmt->close();
$conn->close();
?>
