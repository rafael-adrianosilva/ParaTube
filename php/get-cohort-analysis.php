<?php
session_start();
header('Content-Type: application/json');

require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Não autorizado']);
    exit;
}

$user_id = $_SESSION['user_id'];
$cohort_type = isset($_GET['type']) ? $_GET['type'] : 'weekly'; // 'daily', 'weekly', 'monthly'
$metric = isset($_GET['metric']) ? $_GET['metric'] : 'retention'; // 'retention', 'engagement', 'revenue'
$periods = isset($_GET['periods']) ? intval($_GET['periods']) : 12; // number of periods to track

try {
    // ===== DEFINE COHORT QUERY BASED ON TYPE =====
    $cohort_format = '';
    $period_format = '';
    
    switch ($cohort_type) {
        case 'daily':
            $cohort_format = "DATE(s.created_at)";
            $period_format = "DATEDIFF(vh.viewed_at, s.created_at)";
            break;
        case 'weekly':
            $cohort_format = "DATE_FORMAT(s.created_at, '%Y-%u')"; // Year-Week
            $period_format = "FLOOR(DATEDIFF(vh.viewed_at, s.created_at) / 7)";
            break;
        case 'monthly':
        default:
            $cohort_format = "DATE_FORMAT(s.created_at, '%Y-%m')"; // Year-Month
            $period_format = "PERIOD_DIFF(DATE_FORMAT(vh.viewed_at, '%Y%m'), DATE_FORMAT(s.created_at, '%Y%m'))";
            break;
    }
    
    // ===== GET COHORT DATA =====
    // First, get all users who subscribed to this channel
    $stmt = $conn->prepare("
        SELECT 
            subscriber_id,
            created_at as subscription_date,
            $cohort_format as cohort
        FROM subscriptions
        WHERE channel_id = ?
        AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        ORDER BY created_at ASC
    ");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $subscribers = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    if (empty($subscribers)) {
        echo json_encode([
            'success' => true,
            'cohorts' => [],
            'message' => 'Nenhum inscrito encontrado nos últimos 12 meses'
        ]);
        exit;
    }
    
    // Group subscribers by cohort
    $cohorts = [];
    foreach ($subscribers as $sub) {
        $cohort_key = $sub['cohort'];
        if (!isset($cohorts[$cohort_key])) {
            $cohorts[$cohort_key] = [
                'cohort' => $cohort_key,
                'size' => 0,
                'subscribers' => []
            ];
        }
        $cohorts[$cohort_key]['size']++;
        $cohorts[$cohort_key]['subscribers'][] = $sub['subscriber_id'];
    }
    
    // ===== CALCULATE RETENTION FOR EACH COHORT =====
    $cohort_matrix = [];
    
    foreach ($cohorts as $cohort_key => $cohort_data) {
        $subscriber_ids = implode(',', $cohort_data['subscribers']);
        $cohort_size = $cohort_data['size'];
        
        $retention_data = [
            'cohort' => $cohort_key,
            'size' => $cohort_size,
            'periods' => []
        ];
        
        // For each period, calculate retention
        for ($period = 0; $period <= $periods; $period++) {
            if ($metric === 'retention') {
                // Count unique subscribers who viewed videos in this period
                $stmt = $conn->prepare("
                    SELECT COUNT(DISTINCT vh.user_id) as active_users
                    FROM video_history vh
                    JOIN videos v ON vh.video_id = v.id
                    JOIN subscriptions s ON vh.user_id = s.subscriber_id AND s.channel_id = v.user_id
                    WHERE v.user_id = ?
                    AND vh.user_id IN ($subscriber_ids)
                    AND $cohort_format = ?
                    AND $period_format = ?
                ");
                $stmt->bind_param("isi", $user_id, $cohort_key, $period);
                $stmt->execute();
                $result = $stmt->get_result()->fetch_assoc();
                
                $active_users = intval($result['active_users']);
                $retention_rate = $cohort_size > 0 ? ($active_users / $cohort_size) * 100 : 0;
                
                $retention_data['periods'][] = [
                    'period' => $period,
                    'active_users' => $active_users,
                    'retention_rate' => round($retention_rate, 2)
                ];
                
            } elseif ($metric === 'engagement') {
                // Calculate average engagement (likes + comments) per user
                $stmt = $conn->prepare("
                    SELECT 
                        COUNT(DISTINCT vh.user_id) as active_users,
                        COALESCE(SUM(
                            CASE WHEN r.reaction_type IN ('like', 'love') THEN 1 ELSE 0 END
                        ), 0) as total_likes,
                        COALESCE(COUNT(DISTINCT c.id), 0) as total_comments
                    FROM video_history vh
                    JOIN videos v ON vh.video_id = v.id
                    JOIN subscriptions s ON vh.user_id = s.subscriber_id AND s.channel_id = v.user_id
                    LEFT JOIN reactions r ON r.video_id = v.id AND r.user_id = vh.user_id
                    LEFT JOIN comments c ON c.video_id = v.id AND c.user_id = vh.user_id
                    WHERE v.user_id = ?
                    AND vh.user_id IN ($subscriber_ids)
                    AND $cohort_format = ?
                    AND $period_format = ?
                ");
                $stmt->bind_param("isi", $user_id, $cohort_key, $period);
                $stmt->execute();
                $result = $stmt->get_result()->fetch_assoc();
                
                $active_users = intval($result['active_users']);
                $total_engagements = intval($result['total_likes']) + intval($result['total_comments']);
                $avg_engagement = $active_users > 0 ? $total_engagements / $active_users : 0;
                
                $retention_data['periods'][] = [
                    'period' => $period,
                    'active_users' => $active_users,
                    'avg_engagement' => round($avg_engagement, 2)
                ];
            }
        }
        
        $cohort_matrix[] = $retention_data;
    }
    
    // ===== CALCULATE AVERAGE RETENTION CURVE =====
    $avg_retention = [];
    for ($period = 0; $period <= $periods; $period++) {
        $total_rate = 0;
        $count = 0;
        
        foreach ($cohort_matrix as $cohort) {
            if (isset($cohort['periods'][$period])) {
                $total_rate += $cohort['periods'][$period]['retention_rate'] ?? $cohort['periods'][$period]['avg_engagement'] ?? 0;
                $count++;
            }
        }
        
        $avg_retention[] = [
            'period' => $period,
            'avg_value' => $count > 0 ? round($total_rate / $count, 2) : 0
        ];
    }
    
    // ===== RESPONSE =====
    echo json_encode([
        'success' => true,
        'cohort_type' => $cohort_type,
        'metric' => $metric,
        'cohorts' => $cohort_matrix,
        'average' => $avg_retention,
        'summary' => [
            'total_cohorts' => count($cohort_matrix),
            'total_users' => array_sum(array_column($cohort_matrix, 'size')),
            'avg_cohort_size' => count($cohort_matrix) > 0 ? round(array_sum(array_column($cohort_matrix, 'size')) / count($cohort_matrix), 0) : 0
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erro ao obter análise de coorte: ' . $e->getMessage()
    ]);
}
?>
