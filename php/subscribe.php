<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, X-User-Id');

session_start();

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

$channelId = isset($input['channelId']) ? intval($input['channelId']) : null;

error_log("🔔 Subscribe request - channelId: " . ($channelId ?? 'NULL'));
error_log("📝 Raw input: " . $rawInput);
error_log("📝 Decoded input: " . json_encode($input));

if (!$channelId || $channelId <= 0) {
    error_log("❌ Channel ID missing or invalid: " . var_export($channelId, true));
    echo json_encode(['success' => false, 'message' => 'Dados inválidos - Canal não especificado']);
    exit;
}

// Get user ID from session or header
$userId = $_SESSION['user_id'] ?? $_SERVER['HTTP_X_USER_ID'] ?? null;

error_log("👤 User ID: " . ($userId ?? 'NULL') . " (from " . (isset($_SESSION['user_id']) ? 'session' : 'header') . ")");

if (!$userId) {
    error_log("❌ User not authenticated");
    echo json_encode(['success' => false, 'message' => 'Você precisa estar logado.']);
    exit;
}

// Não pode se inscrever no próprio canal
if ($userId == $channelId) {
    error_log("⚠️ User trying to subscribe to own channel");
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
    error_log("📤 Unsubscribing user $userId from channel $channelId");
    $stmt = $conn->prepare("DELETE FROM subscriptions WHERE user_id = ? AND channel_id = ?");
    $stmt->bind_param("ii", $userId, $channelId);
    $stmt->execute();
    $stmt->close();
    
    error_log("✅ Unsubscribed successfully");
    echo json_encode([
        'success' => true, 
        'subscribed' => false,
        'message' => 'Inscrição cancelada com sucesso'
    ]);
} else {
    // Subscribe
    error_log("📥 Subscribing user $userId to channel $channelId");
    $stmt = $conn->prepare("INSERT INTO subscriptions (user_id, channel_id, created_at) VALUES (?, ?, NOW())");
    $stmt->bind_param("ii", $userId, $channelId);
    
    if ($stmt->execute()) {
        $stmt->close();
        error_log("✅ Subscribed successfully");
        echo json_encode([
            'success' => true, 
            'subscribed' => true,
            'message' => 'Inscrito com sucesso!'
        ]);
    } else {
        $stmt->close();
        error_log("❌ Database error: " . $conn->error);
        echo json_encode([
            'success' => false, 
            'message' => 'Erro ao processar inscrição: ' . $conn->error
        ]);
    }
}

$conn->close();
?>
