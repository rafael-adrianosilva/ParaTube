<?php
require_once 'config.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, X-User-Id');

$userId = $_SERVER['HTTP_X_USER_ID'] ?? $_SESSION['user_id'] ?? null;

if (!$userId) {
    echo json_encode(['success' => false, 'message' => 'Authentication required']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$name = $data['name'] ?? null;
$description = $data['description'] ?? '';
$visibility = $data['visibility'] ?? 'public';

if (!$name) {
    echo json_encode(['success' => false, 'message' => 'Playlist name required']);
    exit;
}

try {
    $conn = getDBConnection();
    mysqli_set_charset($conn, "utf8mb4");
    
    $stmt = $conn->prepare("
        INSERT INTO playlists (user_id, name, description, visibility, created_at)
        VALUES (?, ?, ?, ?, NOW())
    ");
    
    $stmt->bind_param("isss", $userId, $name, $description, $visibility);
    
    if ($stmt->execute()) {
        $playlistId = $stmt->insert_id;
        
        echo json_encode([
            'success' => true,
            'playlist_id' => $playlistId,
            'message' => 'Playlist criada com sucesso'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Erro ao criar playlist: ' . $stmt->error
        ]);
    }
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
