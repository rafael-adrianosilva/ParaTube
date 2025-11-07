<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

session_start();

$input = json_decode(file_get_contents('php://input'), true);

$channelId = $input['channelId'] ?? null;

if (!$channelId) {
    echo json_encode(['success' => false, 'message' => 'Dados inválidos - Canal não especificado']);
    exit;
}

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Você precisa estar logado.']);
    exit;
}

$userId = $_SESSION['user_id'];

// Não pode se inscrever no próprio canal
if ($userId == $channelId) {
    echo json_encode(['success' => false, 'message' => 'Você não pode se inscrever no seu próprio canal.']);
    exit;
}

$conn = getDBConnection();

// Check if already subscribed (TOGGLE behavior)
$checkStmt = $conn->prepare("SELECT id FROM subscriptions WHERE user_id = ? AND channel_id = ?");
$checkStmt->bind_param("ii", $userId, $channelId);
$checkStmt->execute();
$result = $checkStmt->get_result();
$isSubscribed = $result->num_rows > 0;
$checkStmt->close();

if ($isSubscribed) {
    // Unsubscribe
    $stmt = $conn->prepare("DELETE FROM subscriptions WHERE user_id = ? AND channel_id = ?");
    $stmt->bind_param("ii", $userId, $channelId);
    $stmt->execute();
    $stmt->close();
    
    echo json_encode([
        'success' => true, 
        'subscribed' => false,
        'message' => 'Inscrição cancelada com sucesso'
    ]);
} else {
    // Subscribe
    $stmt = $conn->prepare("INSERT INTO subscriptions (user_id, channel_id, created_at) VALUES (?, ?, NOW())");
    $stmt->bind_param("ii", $userId, $channelId);
    
    if ($stmt->execute()) {
        $stmt->close();
        echo json_encode([
            'success' => true, 
            'subscribed' => true,
            'message' => 'Inscrito com sucesso!'
        ]);
    } else {
        $stmt->close();
        echo json_encode([
            'success' => false, 
            'message' => 'Erro ao processar inscrição: ' . $conn->error
        ]);
    }
}

$conn->close();
?>
