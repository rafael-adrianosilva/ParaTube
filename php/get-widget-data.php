<?php
session_start();
header('Content-Type: application/json');

require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Não autorizado']);
    exit;
}

$user_id = $_SESSION['user_id'];
$widget_type = isset($_GET['type']) ? $_GET['type'] : null;
$widget_config = isset($_GET['config']) ? json_decode($_GET['config'], true) : [];

if (!$widget_type) {
    echo json_encode(['success' => false, 'message' => 'Tipo de widget não especificado']);
    exit;
}

try {
    $data = [];
    
    switch ($widget_type) {
        case 'metric_card':
            $metric = $widget_config['metric'] ?? 'total_views';
            
            switch ($metric) {
                case 'total_views':
                    $stmt = $conn->prepare("
                        SELECT SUM(view_count) as value
                        FROM videos
                        WHERE user_id = ?
                    ");
                    $stmt->bind_param("i", $user_id);
                    $stmt->execute();
                    $data = $stmt->get_result()->fetch_assoc();
                    $data['label'] = 'visualizações';
                    break;
                    
                case 'subscribers':
                    $stmt = $conn->prepare("
                        SELECT COUNT(*) as value
                        FROM subscriptions
                        WHERE channel_id = ?
                    ");
                    $stmt->bind_param("i", $user_id);
                    $stmt->execute();
                    $data = $stmt->get_result()->fetch_assoc();
                    $data['label'] = 'inscritos';
                    break;
                    
                case 'watch_time':
                    $stmt = $conn->prepare("
                        SELECT SUM(watch_duration) as value
                        FROM video_history vh
                        JOIN videos v ON vh.video_id = v.id
                        WHERE v.user_id = ?
                    ");
                    $stmt->bind_param("i", $user_id);
                    $stmt->execute();
                    $result = $stmt->get_result()->fetch_assoc();
                    $hours = round(intval($result['value']) / 3600, 1);
                    $data = ['value' => $hours, 'label' => 'horas'];
                    break;
                    
                case 'total_revenue':
                    $stmt = $conn->prepare("
                        SELECT 
                            (COALESCE((SELECT SUM(amount) FROM video_revenue vr
                                      JOIN videos v ON vr.video_id = v.id
                                      WHERE v.user_id = ?), 0)
                            + COALESCE((SELECT SUM(amount) FROM channel_revenue WHERE user_id = ?), 0))
                            as value
                    ");
                    $stmt->bind_param("ii", $user_id, $user_id);
                    $stmt->execute();
                    $data = $stmt->get_result()->fetch_assoc();
                    $data['value'] = 'R$ ' . number_format($data['value'], 2, ',', '.');
                    $data['label'] = 'receita';
                    break;
            }
            break;
            
        case 'line_chart':
            $metric = $widget_config['metric'] ?? 'daily_views';
            $period = intval($widget_config['period'] ?? 30);
            
            switch ($metric) {
                case 'daily_views':
                    $stmt = $conn->prepare("
                        SELECT 
                            DATE(vh.created_at) as date,
                            COUNT(*) as value
                        FROM video_history vh
                        JOIN videos v ON vh.video_id = v.id
                        WHERE v.user_id = ? AND vh.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                        GROUP BY DATE(vh.created_at)
                        ORDER BY date ASC
                    ");
                    $stmt->bind_param("ii", $user_id, $period);
                    $stmt->execute();
                    $data = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
                    break;
                    
                case 'daily_revenue':
                    $stmt = $conn->prepare("
                        SELECT 
                            date,
                            SUM(daily_revenue) as value
                        FROM (
                            SELECT DATE(vr.transaction_date) as date, SUM(vr.amount) as daily_revenue
                            FROM video_revenue vr
                            JOIN videos v ON vr.video_id = v.id
                            WHERE v.user_id = ? AND vr.transaction_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                            GROUP BY DATE(vr.transaction_date)
                            UNION ALL
                            SELECT DATE(cr.transaction_date) as date, SUM(cr.amount) as daily_revenue
                            FROM channel_revenue cr
                            WHERE cr.user_id = ? AND cr.transaction_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                            GROUP BY DATE(cr.transaction_date)
                        ) as combined
                        GROUP BY date
                        ORDER BY date ASC
                    ");
                    $stmt->bind_param("iiii", $user_id, $period, $user_id, $period);
                    $stmt->execute();
                    $data = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
                    break;
            }
            break;
            
        case 'pie_chart':
            $metric = $widget_config['metric'] ?? 'traffic_sources';
            
            switch ($metric) {
                case 'traffic_sources':
                    $stmt = $conn->prepare("
                        SELECT 
                            traffic_source as label,
                            COUNT(*) as value
                        FROM video_history vh
                        JOIN videos v ON vh.video_id = v.id
                        WHERE v.user_id = ?
                        GROUP BY traffic_source
                        ORDER BY value DESC
                        LIMIT 5
                    ");
                    $stmt->bind_param("i", $user_id);
                    $stmt->execute();
                    $data = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
                    break;
                    
                case 'revenue_by_source':
                    $stmt = $conn->prepare("
                        SELECT 
                            rs.source_name as label,
                            SUM(revenue) as value
                        FROM (
                            SELECT revenue_source_id, amount as revenue
                            FROM video_revenue vr
                            JOIN videos v ON vr.video_id = v.id
                            WHERE v.user_id = ?
                            UNION ALL
                            SELECT revenue_source_id, amount as revenue
                            FROM channel_revenue
                            WHERE user_id = ?
                        ) as combined
                        JOIN revenue_sources rs ON combined.revenue_source_id = rs.id
                        GROUP BY rs.source_name
                        ORDER BY value DESC
                    ");
                    $stmt->bind_param("ii", $user_id, $user_id);
                    $stmt->execute();
                    $data = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
                    break;
            }
            break;
            
        case 'table':
            $metric = $widget_config['metric'] ?? 'top_videos';
            $limit = intval($widget_config['limit'] ?? 10);
            
            switch ($metric) {
                case 'top_videos':
                    $stmt = $conn->prepare("
                        SELECT 
                            id,
                            title,
                            view_count,
                            thumbnail,
                            created_at
                        FROM videos
                        WHERE user_id = ?
                        ORDER BY view_count DESC
                        LIMIT ?
                    ");
                    $stmt->bind_param("ii", $user_id, $limit);
                    $stmt->execute();
                    $data = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
                    break;
                    
                case 'top_earning_videos':
                    $stmt = $conn->prepare("
                        SELECT 
                            v.id,
                            v.title,
                            v.thumbnail,
                            SUM(vr.amount) as total_revenue
                        FROM video_revenue vr
                        JOIN videos v ON vr.video_id = v.id
                        WHERE v.user_id = ?
                        GROUP BY v.id
                        ORDER BY total_revenue DESC
                        LIMIT ?
                    ");
                    $stmt->bind_param("ii", $user_id, $limit);
                    $stmt->execute();
                    $data = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
                    break;
            }
            break;
            
        case 'list':
            $metric = $widget_config['metric'] ?? 'recent_comments';
            $limit = intval($widget_config['limit'] ?? 5);
            
            if ($metric === 'recent_comments') {
                $stmt = $conn->prepare("
                    SELECT 
                        c.*,
                        u.username,
                        v.title as video_title
                    FROM comments c
                    JOIN users u ON c.user_id = u.id
                    JOIN videos v ON c.video_id = v.id
                    WHERE v.user_id = ?
                    ORDER BY c.created_at DESC
                    LIMIT ?
                ");
                $stmt->bind_param("ii", $user_id, $limit);
                $stmt->execute();
                $data = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            }
            break;
            
        case 'bar_chart':
            $metric = $widget_config['metric'] ?? 'device_breakdown';
            
            if ($metric === 'device_breakdown') {
                $stmt = $conn->prepare("
                    SELECT 
                        device_type as label,
                        COUNT(*) as value
                    FROM video_history vh
                    JOIN videos v ON vh.video_id = v.id
                    WHERE v.user_id = ?
                    GROUP BY device_type
                    ORDER BY value DESC
                ");
                $stmt->bind_param("i", $user_id);
                $stmt->execute();
                $data = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            }
            break;
            
        default:
            throw new Exception('Tipo de widget não suportado');
    }
    
    echo json_encode([
        'success' => true,
        'widget_type' => $widget_type,
        'data' => $data
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erro ao carregar dados do widget: ' . $e->getMessage()
    ]);
}
?>
