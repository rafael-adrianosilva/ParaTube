<?php
require_once 'config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Não autenticado']);
    exit;
}

$userId = $_SESSION['user_id'];
$conn = getDBConnection();

// Get current avatar
$stmt = $conn->prepare("SELECT profile_image FROM users WHERE id = ?");
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
$avatar = $user['profile_image'];

// Delete avatar file if exists
if ($avatar && file_exists('../' . $avatar)) {
    unlink('../' . $avatar);
}

// Update database to remove avatar
$stmt = $conn->prepare("UPDATE users SET profile_image = NULL, updated_at = NOW() WHERE id = ?");
$stmt->bind_param("i", $userId);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Foto de perfil removida com sucesso'
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Erro ao remover foto de perfil']);
}

$stmt->close();
$conn->close();
?>
