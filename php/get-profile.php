<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

// Get user ID from session or header
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

$conn = getDBConnection();

$stmt = $conn->prepare("SELECT id, username, email, profile_image, bio, created_at FROM users WHERE id = ?");
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

if ($user = $result->fetch_assoc()) {
    // Add created_at for join date
    echo json_encode([
        'success' => true,
        'profile' => $user
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Usuário não encontrado']);
}

$stmt->close();
$conn->close();
?>
