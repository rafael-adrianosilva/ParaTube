<?php
require_once 'config.php';
header('Content-Type: application/json');

$userId = $_SERVER['HTTP_X_USER_ID'] ?? null;

if (!$userId) {
    echo json_encode(['success' => false, 'message' => 'Authentication required']);
    exit;
}

try {
    $stmt = $pdo->prepare("DELETE FROM watch_history WHERE user_id = ?");
    $stmt->execute([$userId]);
    
    echo json_encode(['success' => true]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
