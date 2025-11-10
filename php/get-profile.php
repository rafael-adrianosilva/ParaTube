<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: X-User-Id, Content-Type');

// Get user ID from header or session
// X-User-Id is used to specify WHICH profile to view (not for authentication)
$userId = null;

if (isset($_SERVER['HTTP_X_USER_ID'])) {
    $userId = intval($_SERVER['HTTP_X_USER_ID']);
} elseif (isset($_SESSION['user_id'])) {
    $userId = $_SESSION['user_id'];
}

if (!$userId || $userId <= 0) {
    echo json_encode(['success' => false, 'message' => 'ID de usuário não fornecido']);
    exit;
}

$conn = getDBConnection();

// Get public profile information
$stmt = $conn->prepare("SELECT id, username, email, profile_image, bio, created_at FROM users WHERE id = ?");
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

if ($user = $result->fetch_assoc()) {
    // Return profile data in the expected format
    echo json_encode([
        'success' => true,
        'id' => $user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'profile_image' => $user['profile_image'],
        'bio' => $user['bio'],
        'created_at' => $user['created_at'],
        'profile' => $user // For backward compatibility
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Usuário não encontrado']);
}

$stmt->close();
$conn->close();
?>
