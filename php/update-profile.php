<?php
require_once 'config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Não autenticado']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$userId = $_SESSION['user_id'];

$username = $input['username'] ?? '';
$email = $input['email'] ?? '';
$bio = $input['bio'] ?? '';
$currentPassword = $input['currentPassword'] ?? '';
$newPassword = $input['newPassword'] ?? '';

if (empty($username) || empty($email)) {
    echo json_encode(['success' => false, 'message' => 'Nome de usuário e e-mail são obrigatórios']);
    exit;
}

$conn = getDBConnection();

// Check if changing password
if (!empty($currentPassword) && !empty($newPassword)) {
    // Verify current password
    $stmt = $conn->prepare("SELECT password FROM users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    
    if (!password_verify($currentPassword, $user['password'])) {
        echo json_encode(['success' => false, 'message' => 'Senha atual incorreta']);
        $stmt->close();
        $conn->close();
        exit;
    }
    
    // Update with new password
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("UPDATE users SET username = ?, email = ?, bio = ?, password = ?, updated_at = NOW() WHERE id = ?");
    $stmt->bind_param("ssssi", $username, $email, $bio, $hashedPassword, $userId);
} else {
    // Update without password change
    $stmt = $conn->prepare("UPDATE users SET username = ?, email = ?, bio = ?, updated_at = NOW() WHERE id = ?");
    $stmt->bind_param("sssi", $username, $email, $bio, $userId);
}

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Perfil atualizado com sucesso',
        'user' => [
            'id' => $userId,
            'username' => $username,
            'email' => $email,
            'bio' => $bio
        ]
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Erro ao atualizar perfil']);
}

$stmt->close();
$conn->close();
?>
