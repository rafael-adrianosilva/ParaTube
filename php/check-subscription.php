<?php
header('Content-Type: application/json');
session_start();

// Get user ID from session or header
$user_id = $_SESSION['user_id'] ?? $_SERVER['HTTP_X_USER_ID'] ?? null;

if (!$user_id) {
    http_response_code(401);
    echo json_encode(['error' => 'Não autenticado']);
    exit;
}

// Get channel ID from query parameter
$channel_id = $_GET['channel_id'] ?? null;

if (!$channel_id) {
    http_response_code(400);
    echo json_encode(['error' => 'ID do canal não fornecido']);
    exit;
}

require_once 'config.php';

$conn = getDBConnection();

try {
    // Check if user is subscribed to this channel
    $stmt = $conn->prepare("SELECT id FROM subscriptions WHERE user_id = ? AND channel_id = ?");
    $stmt->bind_param("ii", $user_id, $channel_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $subscribed = $result->num_rows > 0;
    
    echo json_encode([
        'subscribed' => $subscribed
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao verificar inscrição: ' . $e->getMessage()]);
}

$conn->close();
?>
