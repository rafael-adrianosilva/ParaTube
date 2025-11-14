<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$user_id = $_SERVER['HTTP_X_USER_ID'] ?? $_SESSION['user_id'] ?? null;

if (!$user_id) {
    echo json_encode(['success' => false, 'new_achievements' => []]);
    exit;
}

try {
    $conn = getDBConnection();
    mysqli_set_charset($conn, "utf8mb4");
    
    // Get user stats
    $stmt = $conn->prepare("SELECT SUM(views) as total_views, COUNT(*) as total_videos FROM videos WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $videoStats = $stmt->get_result()->fetch_assoc();
    
    $stmt = $conn->prepare("SELECT COUNT(*) as total_subscribers FROM subscriptions WHERE channel_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $subStats = $stmt->get_result()->fetch_assoc();
    
    $stmt = $conn->prepare("SELECT DATEDIFF(NOW(), created_at) as days_member FROM users WHERE id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $memberStats = $stmt->get_result()->fetch_assoc();
    
    // Get total comments on user's videos
    $stmt = $conn->prepare("
        SELECT COUNT(*) as total_comments 
        FROM comments c 
        INNER JOIN videos v ON c.video_id = v.id 
        WHERE v.user_id = ?
    ");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $commentStats = $stmt->get_result()->fetch_assoc();
    
    // Get total likes on user's videos
    $stmt = $conn->prepare("
        SELECT COUNT(*) as total_likes 
        FROM video_likes vl
        INNER JOIN videos v ON vl.video_id = v.id 
        WHERE v.user_id = ? AND vl.like_type = 'like'
    ");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $likeStats = $stmt->get_result()->fetch_assoc();
    
    // Get watch history count (videos watched by user)
    $stmt = $conn->prepare("SELECT COUNT(DISTINCT video_id) as videos_watched FROM watch_history WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $watchStats = $stmt->get_result()->fetch_assoc();
    
    $totalViews = $videoStats['total_views'] ?? 0;
    $totalVideos = $videoStats['total_videos'] ?? 0;
    $totalSubscribers = $subStats['total_subscribers'] ?? 0;
    $daysMember = $memberStats['days_member'] ?? 0;
    $totalComments = $commentStats['total_comments'] ?? 0;
    $totalLikes = $likeStats['total_likes'] ?? 0;
    $videosWatched = $watchStats['videos_watched'] ?? 0;
    
    // Get all achievements
    $stmt = $conn->prepare("SELECT * FROM achievements");
    $stmt->execute();
    $achievements = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // Check which achievements should be unlocked
    $newUnlocks = [];
    foreach ($achievements as $achievement) {
        $shouldUnlock = false;
        
        switch ($achievement['requirement_type']) {
            case 'views':
                $shouldUnlock = $totalViews >= $achievement['requirement_value'];
                break;
            case 'uploads':
                $shouldUnlock = $totalVideos >= $achievement['requirement_value'];
                break;
            case 'subscribers':
                $shouldUnlock = $totalSubscribers >= $achievement['requirement_value'];
                break;
            case 'membership_days':
                $shouldUnlock = $daysMember >= $achievement['requirement_value'];
                break;
            case 'comments':
                $shouldUnlock = $totalComments >= $achievement['requirement_value'];
                break;
            case 'likes':
                $shouldUnlock = $totalLikes >= $achievement['requirement_value'];
                break;
            case 'watch_history':
                $shouldUnlock = $videosWatched >= $achievement['requirement_value'];
                break;
        }
        
        if ($shouldUnlock) {
            // Check if already unlocked
            $stmt = $conn->prepare("SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?");
            $stmt->bind_param("ii", $user_id, $achievement['id']);
            $stmt->execute();
            $exists = $stmt->get_result()->fetch_assoc();
            
            if (!$exists) {
                // Unlock achievement
                $stmt = $conn->prepare("INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)");
                $stmt->bind_param("ii", $user_id, $achievement['id']);
                $stmt->execute();
                
                $newUnlocks[] = [
                    'id' => $achievement['id'],
                    'name' => $achievement['name'],
                    'description' => $achievement['description'],
                    'icon' => $achievement['icon'],
                    'badge_color' => $achievement['badge_color']
                ];
            }
        }
    }
    
    echo json_encode([
        'success' => true,
        'new_achievements' => $newUnlocks
    ]);
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro no servidor: ' . $e->getMessage()]);
}
