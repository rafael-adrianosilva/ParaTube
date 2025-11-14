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

$name = $data['name'] ?? null;
$content = $data['content'] ?? null;
$tags = $data['tags'] ?? '';
$is_default = $data['is_default'] ?? 0;

if (!$name || !$content) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Nome e conteúdo são obrigatórios']);
    exit;
}

try {
    $conn = getDBConnection();
    $user_id = $_SESSION['user_id'];
    
    // If setting as default, remove default from others
    if ($is_default) {
        $stmt = $conn->prepare("UPDATE description_templates SET is_default = 0 WHERE user_id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $stmt->close();
    }
    
    // Insert new template
    $stmt = $conn->prepare("INSERT INTO description_templates (user_id, name, content, tags, is_default) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("isssi", $user_id, $name, $content, $tags, $is_default);
    $stmt->execute();
    
    echo json_encode([
        'success' => true,
        'template_id' => $conn->insert_id
    ]);
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
