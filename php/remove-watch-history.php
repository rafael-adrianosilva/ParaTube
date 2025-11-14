<?php
require_once 'config.php';
header('Content-Type: application/json');

$userId = $_SERVER['HTTP_X_USER_ID'] ?? null;

if (!$userId) {
    echo json_encode(['success' => false, 'message' => 'Authentication required']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$historyId = $data['history_id'] ?? null;

if (!$historyId) {
    echo json_encode(['success' => false, 'message' => 'History ID required']);
    exit;
}

try {
    $stmt = $pdo->prepare("DELETE FROM watch_history WHERE id = ? AND user_id = ?");
    $stmt->execute([$historyId, $userId]);
    
    echo json_encode(['success' => true]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
