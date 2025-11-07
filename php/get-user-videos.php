<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, X-User-Id');

session_start();
require_once 'config.php';

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
        'message' => 'Usuário não autenticado'
    ]);
    exit;
}

try {
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
            'video_url' => $row['video_url'],
            'views' => $row['views'],
            'likes' => $row['likes'],
            'dislikes' => $row['dislikes'],
            'duration' => $formattedDuration,
            'visibility' => $row['visibility'],
            'created_at' => $row['created_at'],
            'username' => $row['username'],
            'profile_image' => $row['profile_image'],
            'comment_count' => $row['comment_count']
        ];
    }
    
    // Return videos array directly
    echo json_encode($videos);
    
    $stmt->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([]);
}

$conn->close();
?>
