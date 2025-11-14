<?php
session_start();
header('Content-Type: application/json');

require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Não autorizado']);
    exit;
}

$user_id = $_SESSION['user_id'];
$video_id = isset($_GET['video_id']) ? intval($_GET['video_id']) : null;
$from_date = isset($_GET['from']) ? $_GET['from'] : date('Y-m-d', strtotime('-30 days'));
$to_date = isset($_GET['to']) ? $_GET['to'] : date('Y-m-d');

try {
    // Verify video ownership if video_id provided
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
    
    // ===== TOTAL REVENUE =====
    if ($video_id) {
        // Video-specific revenue
        $stmt = $conn->prepare("
            SELECT 
                SUM(vr.amount) as total_revenue,
                COUNT(DISTINCT vr.transaction_date) as days_with_revenue,
                AVG(vr.amount) as avg_daily_revenue
            FROM video_revenue vr
            WHERE vr.video_id = ? AND vr.transaction_date BETWEEN ? AND ?
        ");
        $stmt->bind_param("iss", $video_id, $from_date, $to_date);
    } else {
        // Channel-wide revenue (all videos + channel revenue)
        $stmt = $conn->prepare("
            SELECT 
                (
                    COALESCE((SELECT SUM(amount) FROM video_revenue vr
                              JOIN videos v ON vr.video_id = v.id
                              WHERE v.user_id = ? AND vr.transaction_date BETWEEN ? AND ?), 0)
                    +
                    COALESCE((SELECT SUM(amount) FROM channel_revenue cr
                              WHERE cr.user_id = ? AND cr.transaction_date BETWEEN ? AND ?), 0)
                ) as total_revenue,
                COUNT(DISTINCT transaction_date) as days_with_revenue
            FROM (
                SELECT transaction_date FROM video_revenue vr
                JOIN videos v ON vr.video_id = v.id
                WHERE v.user_id = ? AND vr.transaction_date BETWEEN ? AND ?
                UNION
                SELECT transaction_date FROM channel_revenue
                WHERE user_id = ? AND transaction_date BETWEEN ? AND ?
            ) as combined_dates
        ");
        $stmt->bind_param("isisisisis", $user_id, $from_date, $to_date, $user_id, $from_date, $to_date, $user_id, $from_date, $to_date, $user_id, $from_date, $to_date);
    }
    
    $stmt->execute();
    $total_revenue_data = $stmt->get_result()->fetch_assoc();
    
    // ===== REVENUE BY SOURCE =====
    if ($video_id) {
        $stmt = $conn->prepare("
            SELECT 
                rs.source_name,
                rs.source_type,
                SUM(vr.amount) as revenue,
                COUNT(*) as transactions,
                (SUM(vr.amount) * 100.0 / (
                    SELECT SUM(amount) FROM video_revenue 
                    WHERE video_id = ? AND transaction_date BETWEEN ? AND ?
                )) as percentage
            FROM video_revenue vr
            JOIN revenue_sources rs ON vr.revenue_source_id = rs.id
            WHERE vr.video_id = ? AND vr.transaction_date BETWEEN ? AND ?
            GROUP BY rs.id
            ORDER BY revenue DESC
        ");
        $stmt->bind_param("ississ", $video_id, $from_date, $to_date, $video_id, $from_date, $to_date);
    } else {
        $stmt = $conn->prepare("
            SELECT 
                rs.source_name,
                rs.source_type,
                (
                    COALESCE((SELECT SUM(amount) FROM video_revenue vr
                              JOIN videos v ON vr.video_id = v.id
                              WHERE v.user_id = ? AND vr.revenue_source_id = rs.id 
                              AND vr.transaction_date BETWEEN ? AND ?), 0)
                    +
                    COALESCE((SELECT SUM(amount) FROM channel_revenue cr
                              WHERE cr.user_id = ? AND cr.revenue_source_id = rs.id 
                              AND cr.transaction_date BETWEEN ? AND ?), 0)
                ) as revenue
            FROM revenue_sources rs
            HAVING revenue > 0
            ORDER BY revenue DESC
        ");
        $stmt->bind_param("issis", $user_id, $from_date, $to_date, $user_id, $from_date, $to_date);
    }
    
    $stmt->execute();
    $revenue_by_source = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // ===== DAILY REVENUE TREND =====
    if ($video_id) {
        $stmt = $conn->prepare("
            SELECT 
                DATE(vr.transaction_date) as date,
                SUM(vr.amount) as daily_revenue,
                SUM(vr.impressions) as impressions,
                AVG(vr.rpm) as avg_rpm
            FROM video_revenue vr
            WHERE vr.video_id = ? AND vr.transaction_date BETWEEN ? AND ?
            GROUP BY DATE(vr.transaction_date)
            ORDER BY date ASC
        ");
        $stmt->bind_param("iss", $video_id, $from_date, $to_date);
    } else {
        $stmt = $conn->prepare("
            SELECT 
                date,
                SUM(daily_revenue) as daily_revenue
            FROM (
                SELECT 
                    DATE(vr.transaction_date) as date,
                    SUM(vr.amount) as daily_revenue
                FROM video_revenue vr
                JOIN videos v ON vr.video_id = v.id
                WHERE v.user_id = ? AND vr.transaction_date BETWEEN ? AND ?
                GROUP BY DATE(vr.transaction_date)
                UNION ALL
                SELECT 
                    DATE(cr.transaction_date) as date,
                    SUM(cr.amount) as daily_revenue
                FROM channel_revenue cr
                WHERE cr.user_id = ? AND cr.transaction_date BETWEEN ? AND ?
                GROUP BY DATE(cr.transaction_date)
            ) as combined
            GROUP BY date
            ORDER BY date ASC
        ");
        $stmt->bind_param("issis", $user_id, $from_date, $to_date, $user_id, $from_date, $to_date);
    }
    
    $stmt->execute();
    $daily_revenue = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // ===== TOP EARNING VIDEOS =====
    if (!$video_id) {
        $stmt = $conn->prepare("
            SELECT 
                v.id,
                v.title,
                v.thumbnail,
                SUM(vr.amount) as total_revenue,
                SUM(vr.impressions) as total_impressions,
                AVG(vr.rpm) as avg_rpm
            FROM video_revenue vr
            JOIN videos v ON vr.video_id = v.id
            WHERE v.user_id = ? AND vr.transaction_date BETWEEN ? AND ?
            GROUP BY v.id
            ORDER BY total_revenue DESC
            LIMIT 10
        ");
        $stmt->bind_param("iss", $user_id, $from_date, $to_date);
        $stmt->execute();
        $top_videos = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }
    
    // ===== RPM & CPM AVERAGES =====
    if ($video_id) {
        $stmt = $conn->prepare("
            SELECT 
                AVG(rpm) as avg_rpm,
                AVG(cpm) as avg_cpm,
                SUM(impressions) as total_impressions,
                SUM(clicks) as total_clicks
            FROM video_revenue
            WHERE video_id = ? AND transaction_date BETWEEN ? AND ?
        ");
        $stmt->bind_param("iss", $video_id, $from_date, $to_date);
    } else {
        $stmt = $conn->prepare("
            SELECT 
                AVG(rpm) as avg_rpm,
                AVG(cpm) as avg_cpm,
                SUM(impressions) as total_impressions,
                SUM(clicks) as total_clicks
            FROM video_revenue vr
            JOIN videos v ON vr.video_id = v.id
            WHERE v.user_id = ? AND vr.transaction_date BETWEEN ? AND ?
        ");
        $stmt->bind_param("iss", $user_id, $from_date, $to_date);
    }
    
    $stmt->execute();
    $rpm_cpm_data = $stmt->get_result()->fetch_assoc();
    
    $response = [
        'success' => true,
        'summary' => [
            'total_revenue' => number_format($total_revenue_data['total_revenue'] ?? 0, 2),
            'days_with_revenue' => intval($total_revenue_data['days_with_revenue'] ?? 0),
            'avg_daily_revenue' => number_format($total_revenue_data['avg_daily_revenue'] ?? 0, 2),
            'avg_rpm' => number_format($rpm_cpm_data['avg_rpm'] ?? 0, 2),
            'avg_cpm' => number_format($rpm_cpm_data['avg_cpm'] ?? 0, 2),
            'total_impressions' => intval($rpm_cpm_data['total_impressions'] ?? 0),
            'total_clicks' => intval($rpm_cpm_data['total_clicks'] ?? 0)
        ],
        'revenue_by_source' => $revenue_by_source,
        'daily_revenue' => $daily_revenue
    ];
    
    if (!$video_id) {
        $response['top_earning_videos'] = $top_videos ?? [];
    }
    
    echo json_encode($response);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erro ao obter receita: ' . $e->getMessage()
    ]);
}
?>
