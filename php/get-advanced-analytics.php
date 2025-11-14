<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false]);
    exit;
}

$video_id = $_GET['video_id'] ?? null;
$date_from = $_GET['from'] ?? date('Y-m-d', strtotime('-30 days'));
$date_to = $_GET['to'] ?? date('Y-m-d');

try {
    $conn = getDBConnection();
    $user_id = $_SESSION['user_id'];
    
    // Verify video ownership
    if ($video_id) {
        $stmt = $conn->prepare("SELECT id FROM videos WHERE id = ? AND user_id = ?");
        $stmt->bind_param("ii", $video_id, $user_id);
        $stmt->execute();
        if (!$stmt->get_result()->fetch_assoc()) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Acesso negado']);
            exit;
        }
        $stmt->close();
    }
    
    $analytics = [];
    
    // 1. CTR Stats
    if ($video_id) {
        $stmt = $conn->prepare("
            SELECT date, impressions, clicks, ctr_percentage
            FROM video_ctr_stats
            WHERE video_id = ? AND date BETWEEN ? AND ?
            ORDER BY date ASC
        ");
        $stmt->bind_param("iss", $video_id, $date_from, $date_to);
    } else {
        $stmt = $conn->prepare("
            SELECT c.date, SUM(c.impressions) as impressions, SUM(c.clicks) as clicks,
                   AVG(c.ctr_percentage) as ctr_percentage
            FROM video_ctr_stats c
            JOIN videos v ON c.video_id = v.id
            WHERE v.user_id = ? AND c.date BETWEEN ? AND ?
            GROUP BY c.date
            ORDER BY c.date ASC
        ");
        $stmt->bind_param("iss", $user_id, $date_from, $date_to);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    
    $ctr_data = [];
    while ($row = $result->fetch_assoc()) {
        $ctr_data[] = [
            'date' => $row['date'],
            'impressions' => (int)$row['impressions'],
            'clicks' => (int)$row['clicks'],
            'ctr' => round((float)$row['ctr_percentage'], 2)
        ];
    }
    $analytics['ctr'] = $ctr_data;
    $stmt->close();
    
    // 2. Traffic Sources
    if ($video_id) {
        $stmt = $conn->prepare("
            SELECT source_type, COUNT(*) as count
            FROM traffic_sources
            WHERE video_id = ?
            GROUP BY source_type
            ORDER BY count DESC
        ");
        $stmt->bind_param("i", $video_id);
    } else {
        $stmt = $conn->prepare("
            SELECT t.source_type, COUNT(*) as count
            FROM traffic_sources t
            JOIN videos v ON t.video_id = v.id
            WHERE v.user_id = ?
            GROUP BY t.source_type
            ORDER BY count DESC
        ");
        $stmt->bind_param("i", $user_id);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    
    $sources = [];
    while ($row = $result->fetch_assoc()) {
        $sources[] = [
            'source' => $row['source_type'],
            'count' => (int)$row['count']
        ];
    }
    $analytics['traffic_sources'] = $sources;
    $stmt->close();
    
    // 3. Device Breakdown
    if ($video_id) {
        $stmt = $conn->prepare("
            SELECT device_type, COUNT(*) as count
            FROM video_impressions
            WHERE video_id = ? AND impression_type = 'view'
            GROUP BY device_type
        ");
        $stmt->bind_param("i", $video_id);
    } else {
        $stmt = $conn->prepare("
            SELECT i.device_type, COUNT(*) as count
            FROM video_impressions i
            JOIN videos v ON i.video_id = v.id
            WHERE v.user_id = ? AND i.impression_type = 'view'
            GROUP BY i.device_type
        ");
        $stmt->bind_param("i", $user_id);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    
    $devices = [];
    while ($row = $result->fetch_assoc()) {
        $devices[] = [
            'device' => $row['device_type'],
            'count' => (int)$row['count']
        ];
    }
    $analytics['devices'] = $devices;
    $stmt->close();
    
    // 4. Engagement Rate
    if ($video_id) {
        $stmt = $conn->prepare("
            SELECT v.views, v.likes,
                   (SELECT COUNT(*) FROM comments WHERE video_id = ?) as comments
            FROM videos v
            WHERE v.id = ?
        ");
        $stmt->bind_param("ii", $video_id, $video_id);
        $stmt->execute();
        $video_data = $stmt->get_result()->fetch_assoc();
        
        $views = (int)$video_data['views'];
        $engagement = ((int)$video_data['likes'] + (int)$video_data['comments']);
        $engagement_rate = $views > 0 ? round(($engagement / $views) * 100, 2) : 0;
        
        $analytics['engagement'] = [
            'views' => $views,
            'likes' => (int)$video_data['likes'],
            'comments' => (int)$video_data['comments'],
            'engagement_rate' => $engagement_rate
        ];
        $stmt->close();
    }
    
    echo json_encode([
        'success' => true,
        'analytics' => $analytics
    ]);
    
    $conn->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
