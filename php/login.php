<?php
require_once 'config.php';

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);

$email = $input['email'] ?? '';
$password = $input['password'] ?? '';
$remember = $input['remember'] ?? false;

if (empty($email) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Preencha todos os campos.']);
    exit;
}

$conn = getDBConnection();

$stmt = $conn->prepare("SELECT id, username, email, password, profile_image FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'E-mail ou senha incorretos.']);
    exit;
}

$user = $result->fetch_assoc();

if (!password_verify($password, $user['password'])) {
    echo json_encode(['success' => false, 'message' => 'E-mail ou senha incorretos.']);
    exit;
}

// Create session
$_SESSION['user_id'] = $user['id'];
$_SESSION['username'] = $user['username'];
$_SESSION['email'] = $user['email'];

if ($remember) {
    // Set cookie for 30 days
    setcookie('user_token', bin2hex(random_bytes(32)), time() + (30 * 24 * 60 * 60), '/');
}

echo json_encode([
    'success' => true,
    'user' => [
        'id' => $user['id'],
        'name' => $user['username'],
        'username' => $user['username'],
        'email' => $user['email'],
        'profile_image' => $user['profile_image']
    ]
]);

$stmt->close();
$conn->close();
?>
