<?php
session_start();
header('Content-Type: application/json');

require_once 'config.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Não autorizado']);
    exit;
}

$user_id = $_SESSION['user_id'];
$video_id = isset($_GET['video_id']) ? intval($_GET['video_id']) : null;

// Get date ranges
$current_from = isset($_GET['current_from']) ? $_GET['current_from'] : date('Y-m-d', strtotime('-7 days'));
$current_to = isset($_GET['current_to']) ? $_GET['current_to'] : date('Y-m-d');
$previous_from = isset($_GET['previous_from']) ? $_GET['previous_from'] : date('Y-m-d', strtotime('-14 days'));
$previous_to = isset($_GET['previous_to']) ? $_GET['previous_to'] : date('Y-m-d', strtotime('-7 days'));

try {
    // Verify video ownership if video_id is provided
    if ($video_id) {
        $stmt = $conn->prepare("SELECT user_id FROM videos WHERE id = ?");
        $stmt->bind_param("i", $video_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $video = $result->fetch_assoc();
        
        if (!$video || $video['user_id'] != $user_id) {
            echo json_encode(['success' => false, 'message' => 'Vídeo não encontrado']);
            exit;
        }
    }
    
    // Build WHERE clause
    $where_video = $video_id ? "AND v.id = $video_id" : "AND v.user_id = $user_id";
    
    // ===== CURRENT PERIOD STATS =====
    
    // Views
    $stmt = $conn->prepare("
        SELECT COUNT(DISTINCT DATE(created_at)) as days_with_views,
               SUM(views) as total_views
        FROM videos v
        WHERE created_at BETWEEN ? AND ? $where_video
    ");
    $stmt->bind_param("ss", $current_from, $current_to);
    $stmt->execute();
    $current_views = $stmt->get_result()->fetch_assoc();
    
    // CTR
    $stmt = $conn->prepare("
        SELECT SUM(impressions) as total_impressions,
               SUM(clicks) as total_clicks
        FROM video_ctr_stats vcs
        JOIN videos v ON vcs.video_id = v.id
        WHERE vcs.date BETWEEN ? AND ? $where_video
    ");
    $stmt->bind_param("ss", $current_from, $current_to);
    $stmt->execute();
    $current_ctr_data = $stmt->get_result()->fetch_assoc();
    $current_ctr = $current_ctr_data['total_impressions'] > 0 
        ? ($current_ctr_data['total_clicks'] / $current_ctr_data['total_impressions']) * 100 
        : 0;
    
    // Engagement (likes + comments)
    $stmt = $conn->prepare("
        SELECT 
            SUM(v.likes) as total_likes,
            SUM(v.dislikes) as total_dislikes,
            COUNT(DISTINCT c.id) as total_comments
        FROM videos v
        LEFT JOIN comments c ON c.video_id = v.id AND c.created_at BETWEEN ? AND ?
        WHERE v.created_at BETWEEN ? AND ? $where_video
    ");
    $stmt->bind_param("ssss", $current_from, $current_to, $current_from, $current_to);
    $stmt->execute();
    $current_engagement = $stmt->get_result()->fetch_assoc();
    
    // Watch time (from video_progress)
    $stmt = $conn->prepare("
        SELECT SUM(vp.progress_time) as total_watch_time
        FROM video_progress vp
        JOIN videos v ON vp.video_id = v.id
        WHERE vp.last_watched BETWEEN ? AND ? $where_video
    ");
    $stmt->bind_param("ss", $current_from, $current_to);
    $stmt->execute();
    $current_watch_time = $stmt->get_result()->fetch_assoc()['total_watch_time'] ?? 0;
    
    // ===== PREVIOUS PERIOD STATS =====
    
    // Views
    $stmt = $conn->prepare("
        SELECT COUNT(DISTINCT DATE(created_at)) as days_with_views,
               SUM(views) as total_views
        FROM videos v
        WHERE created_at BETWEEN ? AND ? $where_video
    ");
    $stmt->bind_param("ss", $previous_from, $previous_to);
    $stmt->execute();
    $previous_views = $stmt->get_result()->fetch_assoc();
    
    // CTR
    $stmt = $conn->prepare("
        SELECT SUM(impressions) as total_impressions,
               SUM(clicks) as total_clicks
        FROM video_ctr_stats vcs
        JOIN videos v ON vcs.video_id = v.id
        WHERE vcs.date BETWEEN ? AND ? $where_video
    ");
    $stmt->bind_param("ss", $previous_from, $previous_to);
    $stmt->execute();
    $previous_ctr_data = $stmt->get_result()->fetch_assoc();
    $previous_ctr = $previous_ctr_data['total_impressions'] > 0 
        ? ($previous_ctr_data['total_clicks'] / $previous_ctr_data['total_impressions']) * 100 
        : 0;
    
    // Engagement
    $stmt = $conn->prepare("
        SELECT 
            SUM(v.likes) as total_likes,
            SUM(v.dislikes) as total_dislikes,
            COUNT(DISTINCT c.id) as total_comments
        FROM videos v
        LEFT JOIN comments c ON c.video_id = v.id AND c.created_at BETWEEN ? AND ?
        WHERE v.created_at BETWEEN ? AND ? $where_video
    ");
    $stmt->bind_param("ssss", $previous_from, $previous_to, $previous_from, $previous_to);
    $stmt->execute();
    $previous_engagement = $stmt->get_result()->fetch_assoc();
    
    // Watch time
    $stmt = $conn->prepare("
        SELECT SUM(vp.progress_time) as total_watch_time
        FROM video_progress vp
        JOIN videos v ON vp.video_id = v.id
        WHERE vp.last_watched BETWEEN ? AND ? $where_video
    ");
    $stmt->bind_param("ss", $previous_from, $previous_to);
    $stmt->execute();
    $previous_watch_time = $stmt->get_result()->fetch_assoc()['total_watch_time'] ?? 0;
    
    // ===== CALCULATE CHANGES =====
    
    function calculateChange($current, $previous) {
        if ($previous == 0) return $current > 0 ? 100 : 0;
        return (($current - $previous) / $previous) * 100;
    }
    
    $response = [
        'success' => true,
        'current_period' => [
            'from' => $current_from,
            'to' => $current_to,
            'views' => intval($current_views['total_views']),
            'ctr' => round($current_ctr, 2),
            'likes' => intval($current_engagement['total_likes']),
            'comments' => intval($current_engagement['total_comments']),
            'watch_time' => intval($current_watch_time)
        ],
        'previous_period' => [
            'from' => $previous_from,
            'to' => $previous_to,
            'views' => intval($previous_views['total_views']),
            'ctr' => round($previous_ctr, 2),
            'likes' => intval($previous_engagement['total_likes']),
            'comments' => intval($previous_engagement['total_comments']),
            'watch_time' => intval($previous_watch_time)
        ],
        'changes' => [
            'views' => round(calculateChange($current_views['total_views'], $previous_views['total_views']), 2),
            'ctr' => round(calculateChange($current_ctr, $previous_ctr), 2),
            'likes' => round(calculateChange($current_engagement['total_likes'], $previous_engagement['total_likes']), 2),
            'comments' => round(calculateChange($current_engagement['total_comments'], $previous_engagement['total_comments']), 2),
            'watch_time' => round(calculateChange($current_watch_time, $previous_watch_time), 2)
        ]
    ];
    
    echo json_encode($response);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erro ao comparar períodos: ' . $e->getMessage()
    ]);
}
?>
