<?php
require_once 'config.php';

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$email = $input['email'] ?? '';

if (empty($email)) {
    echo json_encode(['success' => false, 'message' => 'Por favor, informe seu e-mail.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'E-mail inválido.']);
    exit;
}

$conn = getDBConnection();

$stmt = $conn->prepare("SELECT id, username FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'E-mail não encontrado.']);
    exit;
}

$user = $result->fetch_assoc();

// Generate reset token
$resetToken = bin2hex(random_bytes(32));
$expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));

// Store reset token in database
$stmt = $conn->prepare("INSERT INTO password_resets (user_id, token, expires_at, created_at) VALUES (?, ?, ?, NOW())");
$stmt->bind_param("iss", $user['id'], $resetToken, $expiresAt);
$stmt->execute();

// In a real application, send email here
// For demo purposes, we'll just return success
echo json_encode([
    'success' => true,
    'message' => 'Instruções de recuperação enviadas para seu e-mail.',
    'token' => $resetToken // In production, don't return the token
]);

$stmt->close();
$conn->close();
?>
