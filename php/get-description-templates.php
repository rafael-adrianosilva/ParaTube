<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false]);
    exit;
}

$user_id = $_SESSION['user_id'];
$template_id = $_GET['id'] ?? null;

try {
    $conn = getDBConnection();
    
    if ($template_id) {
        // Get specific template
        $stmt = $conn->prepare("SELECT * FROM description_templates WHERE id = ? AND user_id = ?");
        $stmt->bind_param("ii", $template_id, $user_id);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'template' => $result
            ]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Template não encontrado']);
        }
    } else {
        // Get all templates
        $stmt = $conn->prepare("SELECT * FROM description_templates WHERE user_id = ? ORDER BY is_default DESC, created_at DESC");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $templates = [];
        while ($row = $result->fetch_assoc()) {
            $templates[] = $row;
        }
        
        echo json_encode([
            'success' => true,
            'templates' => $templates
        ]);
    }
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
