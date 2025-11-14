<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['progress_time' => 0, 'completed' => false]);
    exit;
}

$video_id = $_GET['video_id'] ?? null;

if (!$video_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID do vídeo não fornecido']);
    exit;
}

$user_id = $_SESSION['user_id'];

try {
    $conn = getDBConnection();
    
    $stmt = $conn->prepare("
        SELECT progress_time, duration, completed
        FROM video_progress
        WHERE user_id = ? AND video_id = ?
    ");
    
    $stmt->bind_param("ii", $user_id, $video_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    
    if ($row) {
        echo json_encode([
            'progress_time' => (float)$row['progress_time'],
            'duration' => (float)$row['duration'],
            'completed' => (bool)$row['completed']
        ]);
    } else {
        echo json_encode([
            'progress_time' => 0,
            'duration' => null,
            'completed' => false
        ]);
    }
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro no servidor: ' . $e->getMessage()]);
}
