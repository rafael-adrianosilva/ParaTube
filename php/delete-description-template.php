<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$template_id = $data['id'] ?? null;

if (!$template_id) {
    http_response_code(400);
    echo json_encode(['success' => false]);
    exit;
}

try {
    $conn = getDBConnection();
    $user_id = $_SESSION['user_id'];
    
    $stmt = $conn->prepare("DELETE FROM description_templates WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $template_id, $user_id);
    $stmt->execute();
    
    echo json_encode(['success' => true]);
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
