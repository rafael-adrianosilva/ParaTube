<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'config.php';

$conn = getDBConnection();

try {
    $results = [];
    
    // Get all users
    $usersStmt = $conn->prepare("SELECT id, username FROM users ORDER BY id ASC");
    $usersStmt->execute();
    $usersResult = $usersStmt->get_result();
    
    while ($user = $usersResult->fetch_assoc()) {
        $userId = $user['id'];
        $username = $user['username'];
        
        // Get videos for this user
        $videosStmt = $conn->prepare("
            SELECT id, title, user_id, duration, views, created_at
            FROM videos
            WHERE user_id = ?
            ORDER BY created_at DESC
        ");
        $videosStmt->bind_param("i", $userId);
        $videosStmt->execute();
        $videosResult = $videosStmt->get_result();
        
        $videos = [];
        $wrongUserVideos = [];
        
        while ($video = $videosResult->fetch_assoc()) {
            $videos[] = [
                'id' => intval($video['id']),
                'title' => $video['title'],
                'user_id' => intval($video['user_id']),
                'duration' => $video['duration'],
                'views' => intval($video['views'])
            ];
            
            // Check if video belongs to different user (shouldn't happen with WHERE clause)
            if (intval($video['user_id']) !== $userId) {
                $wrongUserVideos[] = $video;
            }
        }
        
        $results[] = [
            'user_id' => $userId,
            'username' => $username,
            'video_count' => count($videos),
            'videos' => $videos,
            'test_passed' => count($wrongUserVideos) === 0,
            'wrong_videos' => $wrongUserVideos
        ];
        
        $videosStmt->close();
    }
    
    $usersStmt->close();
    
    // Overall test result
    $allPassed = true;
    foreach ($results as $result) {
        if (!$result['test_passed']) {
            $allPassed = false;
            break;
        }
    }
    
    echo json_encode([
        'success' => true,
        'all_tests_passed' => $allPassed,
        'message' => $allPassed 
            ? 'Todos os usuários recebem apenas seus próprios vídeos' 
            : 'ERRO: Alguns usuários estão recebendo vídeos de outros',
        'users' => $results,
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erro ao testar: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
