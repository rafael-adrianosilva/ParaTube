<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Não autenticado']);
    exit;
}

$user_id = $_SESSION['user_id'];

try {
    $conn = getDBConnection();
    
    // Total views
    $stmt = $conn->prepare("SELECT SUM(views) as total FROM videos WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $totalViews = $stmt->get_result()->fetch_assoc()['total'] ?? 0;
    
    // Total subscribers
    $stmt = $conn->prepare("SELECT COUNT(*) as total FROM subscriptions WHERE channel_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $totalSubscribers = $stmt->get_result()->fetch_assoc()['total'] ?? 0;
    
    // Total videos
    $stmt = $conn->prepare("SELECT COUNT(*) as total FROM videos WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $totalVideos = $stmt->get_result()->fetch_assoc()['total'] ?? 0;
    
    // Total comments
    $stmt = $conn->prepare("
        SELECT COUNT(*) as total 
        FROM comments c
        JOIN videos v ON c.video_id = v.id
        WHERE v.user_id = ?
    ");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $totalComments = $stmt->get_result()->fetch_assoc()['total'] ?? 0;
    
    // Views over last 30 days
    $viewsData = [];
    for ($i = 29; $i >= 0; $i--) {
        $date = date('Y-m-d', strtotime("-$i days"));
        $displayDate = date('d/m', strtotime("-$i days"));
        
        // Simulated data for now - in production would aggregate actual view logs
        $viewsData[] = [
            'date' => $displayDate,
            'views' => rand(50, 500)
        ];
    }
    
    // Subscribers growth over last 30 days
    $subscribersData = [];
    $currentSubs = 0;
    for ($i = 29; $i >= 0; $i--) {
        $date = date('Y-m-d', strtotime("-$i days"));
        $displayDate = date('d/m', strtotime("-$i days"));
        
        // Get subscribers until this date
        $stmt = $conn->prepare("
            SELECT COUNT(*) as count
            FROM subscriptions
            WHERE channel_id = ? AND created_at <= ?
        ");
        $dateEnd = $date . ' 23:59:59';
        $stmt->bind_param("is", $user_id, $dateEnd);
        $stmt->execute();
        $count = $stmt->get_result()->fetch_assoc()['count'] ?? 0;
        
        $subscribersData[] = [
            'date' => $displayDate,
            'subscribers' => $count
        ];
    }
    
    // Top 10 videos
    $stmt = $conn->prepare("
        SELECT id, title, thumbnail, views
        FROM videos
        WHERE user_id = ?
        ORDER BY views DESC
        LIMIT 10
    ");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $topVideos = [];
    while ($row = $result->fetch_assoc()) {
        $topVideos[] = [
            'id' => $row['id'],
            'title' => $row['title'],
            'thumbnail' => $row['thumbnail'],
            'views' => $row['views']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'totalViews' => (int)$totalViews,
        'totalSubscribers' => (int)$totalSubscribers,
        'totalVideos' => (int)$totalVideos,
        'totalComments' => (int)$totalComments,
        'viewsData' => $viewsData,
        'subscribersData' => $subscribersData,
        'topVideos' => $topVideos
    ]);
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro no servidor: ' . $e->getMessage()]);
}
