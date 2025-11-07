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

if (!$videoId) {
    echo json_encode(['success' => false, 'message' => 'Dados inválidos']);
    exit;
}

$conn = getDBConnection();

// Get video file path and thumbnail to delete files
$stmt = $conn->prepare("SELECT video_path, thumbnail FROM videos WHERE id = ? AND user_id = ?");
$stmt->bind_param("ii", $videoId, $userId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Vídeo não encontrado ou sem permissão']);
    $stmt->close();
    $conn->close();
    exit;
}

$video = $result->fetch_assoc();
$stmt->close();

// Delete video file and thumbnail
if ($video['video_path'] && file_exists('../' . $video['video_path'])) {
    unlink('../' . $video['video_path']);
}
if ($video['thumbnail'] && file_exists('../' . $video['thumbnail'])) {
    unlink('../' . $video['thumbnail']);
}

// Delete video from database
$stmt = $conn->prepare("DELETE FROM videos WHERE id = ? AND user_id = ?");
$stmt->bind_param("ii", $videoId, $userId);

if ($stmt->execute()) {
    // Also delete related data (comments, reactions, etc.)
    $conn->query("DELETE FROM comments WHERE video_id = $videoId");
    $conn->query("DELETE FROM video_reactions WHERE video_id = $videoId");
    
    echo json_encode(['success' => true, 'message' => 'Vídeo excluído com sucesso']);
} else {
    echo json_encode(['success' => false, 'message' => 'Erro ao excluir vídeo']);
}

$stmt->close();
$conn->close();
?>
