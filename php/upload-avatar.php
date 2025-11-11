<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    exit;
}

// Get user from session or header
$userId = null;
if (isset($_SESSION['user_id'])) {
    $userId = $_SESSION['user_id'];
} elseif (isset($_SERVER['HTTP_X_USER_ID'])) {
    $userId = intval($_SERVER['HTTP_X_USER_ID']);
}

if (!$userId) {
    echo json_encode(['success' => false, 'message' => 'Não autenticado']);
    exit;
}

// Validate file upload
if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'message' => 'Erro ao fazer upload da imagem']);
    exit;
}

// Validate file type
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$fileType = $_FILES['avatar']['type'];

if (!in_array($fileType, $allowedTypes)) {
    echo json_encode(['success' => false, 'message' => 'Tipo de arquivo não permitido. Use JPEG, PNG, GIF ou WebP']);
    exit;
}

// Validate file size (max 5MB)
$maxSize = 5 * 1024 * 1024; // 5MB
if ($_FILES['avatar']['size'] > $maxSize) {
    echo json_encode(['success' => false, 'message' => 'Arquivo muito grande. Tamanho máximo: 5MB']);
    exit;
}

// Create uploads directory if it doesn't exist
$uploadsDir = 'uploads/avatars';
if (!file_exists('../' . $uploadsDir)) {
    mkdir('../' . $uploadsDir, 0777, true);
}

// Generate unique filename
$fileExtension = pathinfo($_FILES['avatar']['name'], PATHINFO_EXTENSION);
$fileName = 'avatar_' . $userId . '_' . time() . '.' . $fileExtension;
$uploadPath = '../' . $uploadsDir . '/' . $fileName;

// Move uploaded file
if (!move_uploaded_file($_FILES['avatar']['tmp_name'], $uploadPath)) {
    echo json_encode(['success' => false, 'message' => 'Erro ao salvar imagem']);
    exit;
}

// Update database
$conn = getDBConnection();

// Get old avatar to delete it
$stmt = $conn->prepare("SELECT profile_image FROM users WHERE id = ?");
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
$oldAvatar = $user['profile_image'];

// Update with new avatar
$avatarPath = $uploadsDir . '/' . $fileName;
$stmt = $conn->prepare("UPDATE users SET profile_image = ?, updated_at = NOW() WHERE id = ?");
$stmt->bind_param("si", $avatarPath, $userId);

if ($stmt->execute()) {
    // Delete old avatar if exists
    if ($oldAvatar && file_exists('../' . $oldAvatar)) {
        unlink('../' . $oldAvatar);
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Foto de perfil atualizada com sucesso',
        'avatarUrl' => $avatarPath
    ]);
} else {
    // Delete uploaded file if database update fails
    unlink($uploadPath);
    echo json_encode(['success' => false, 'message' => 'Erro ao atualizar foto de perfil']);
}

$stmt->close();
$conn->close();
?>
