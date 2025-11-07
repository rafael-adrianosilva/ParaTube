<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, X-User-Id');

session_start();

// Get user ID
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

$videoId = $_POST['video_id'] ?? null;
$title = $_POST['title'] ?? null;
$description = $_POST['description'] ?? '';
$visibility = $_POST['visibility'] ?? 'public';

if (!$videoId || !$title) {
    echo json_encode(['success' => false, 'message' => 'Dados inválidos']);
    exit;
}

$conn = getDBConnection();

// Verify video ownership
$stmt = $conn->prepare("SELECT id FROM videos WHERE id = ? AND user_id = ?");
$stmt->bind_param("ii", $videoId, $userId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Vídeo não encontrado ou você não tem permissão']);
    $stmt->close();
    $conn->close();
    exit;
}
$stmt->close();

// Handle thumbnail upload
$thumbnailPath = null;
if (isset($_FILES['thumbnail']) && $_FILES['thumbnail']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = '../uploads/thumbnails/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    
    $fileExtension = pathinfo($_FILES['thumbnail']['name'], PATHINFO_EXTENSION);
    $fileName = uniqid() . '_' . time() . '.' . $fileExtension;
    $uploadPath = $uploadDir . $fileName;
    
    if (move_uploaded_file($_FILES['thumbnail']['tmp_name'], $uploadPath)) {
        $thumbnailPath = 'uploads/thumbnails/' . $fileName;
    }
}

// Update video
if ($thumbnailPath) {
    $stmt = $conn->prepare("UPDATE videos SET title = ?, description = ?, visibility = ?, thumbnail = ? WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ssssii", $title, $description, $visibility, $thumbnailPath, $videoId, $userId);
} else {
    $stmt = $conn->prepare("UPDATE videos SET title = ?, description = ?, visibility = ? WHERE id = ? AND user_id = ?");
    $stmt->bind_param("sssii", $title, $description, $visibility, $videoId, $userId);
}

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Vídeo atualizado com sucesso']);
} else {
    echo json_encode(['success' => false, 'message' => 'Erro ao atualizar vídeo: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
