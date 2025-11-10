<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, X-User-Id');

session_start();
require_once 'config.php';

$conn = getDBConnection();

// Get user ID from session or header
$userId = null;
if (isset($_SESSION['user_id'])) {
    $userId = $_SESSION['user_id'];
} elseif (isset($_SERVER['HTTP_X_USER_ID'])) {
    $userId = intval($_SERVER['HTTP_X_USER_ID']);
} elseif (isset($_GET['userId'])) {
    $userId = intval($_GET['userId']);
}

if (!$userId) {
    echo json_encode([
        'success' => false,
        'message' => 'Usuário não autenticado',
        'debug' => [
            'session' => isset($_SESSION['user_id']),
            'header' => isset($_SERVER['HTTP_X_USER_ID']),
            'get' => isset($_GET['userId'])
        ]
    ]);
    exit;
}

try {
    // First check if user exists
    $checkStmt = $conn->prepare("SELECT id, username FROM users WHERE id = ?");
    $checkStmt->bind_param("i", $userId);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows === 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Usuário não encontrado',
            'userId' => $userId
        ]);
        exit;
    }
    $checkStmt->close();
    
    // Get user videos
    $stmt = $conn->prepare("
        SELECT 
            v.*,
            u.username,
            u.profile_image,
            (SELECT COUNT(*) FROM comments WHERE video_id = v.id) as comment_count
        FROM videos v
        JOIN users u ON v.user_id = u.id
        WHERE v.user_id = ?
        ORDER BY v.created_at DESC
    ");
    
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $videos = [];
    while ($row = $result->fetch_assoc()) {
        // Format duration
        $duration = $row['duration'];
        $hours = floor($duration / 3600);
        $minutes = floor(($duration % 3600) / 60);
        $seconds = $duration % 60;
        
        if ($hours > 0) {
            $formattedDuration = sprintf('%d:%02d:%02d', $hours, $minutes, $seconds);
        } else {
            $formattedDuration = sprintf('%d:%02d', $minutes, $seconds);
        }
        
        $videos[] = [
            'id' => $row['id'],
            'title' => $row['title'],
            'description' => $row['description'],
            'thumbnail' => $row['thumbnail'],
            'videoUrl' => $row['video_url'] ?? '',
            'views' => intval($row['views']),
            'likes' => intval($row['likes']),
            'dislikes' => intval($row['dislikes']),
            'duration' => $formattedDuration,
            'visibility' => $row['visibility'] ?? 'public',
            'created_at' => $row['created_at'],
            'username' => $row['username'],
            'profile_image' => $row['profile_image'],
            'comment_count' => intval($row['comment_count'])
        ];
    }
    
    // If no videos found, return empty array with debug info in development
    if (count($videos) === 0) {
        // Check if there are ANY videos in the database for debugging
        $debugStmt = $conn->prepare("SELECT COUNT(*) as total FROM videos WHERE user_id = ?");
        $debugStmt->bind_param("i", $userId);
        $debugStmt->execute();
        $debugResult = $debugStmt->get_result();
        $debugData = $debugResult->fetch_assoc();
        $debugStmt->close();
        
        // Return empty array (expected format)
        echo json_encode($videos);
    } else {
        // Return videos array
        echo json_encode($videos);
    }
    
    $stmt->close();
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erro ao buscar vídeos: ' . $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}

$conn->close();
?>
