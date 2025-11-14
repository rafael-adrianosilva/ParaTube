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
$prediction_days = isset($_GET['days']) ? intval($_GET['days']) : 7; // Predict next 7 days

try {
    if ($video_id) {
        // Verify video ownership
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
    
    // ===== GET HISTORICAL DATA (Last 30 days) =====
    $stmt = $conn->prepare("
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as daily_views
        FROM video_history
        WHERE video_id " . ($video_id ? "= ?" : "IN (SELECT id FROM videos WHERE user_id = ?)") . "
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date ASC
    ");
    
    if ($video_id) {
        $stmt->bind_param("i", $video_id);
    } else {
        $stmt->bind_param("i", $user_id);
    }
    
    $stmt->execute();
    $historical_data = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    if (count($historical_data) < 7) {
        echo json_encode([
            'success' => false,
            'message' => 'Dados insuficientes para previsão (mínimo 7 dias)'
        ]);
        exit;
    }
    
    // ===== SIMPLE LINEAR REGRESSION FOR PREDICTION =====
    $views_array = array_column($historical_data, 'daily_views');
    $n = count($views_array);
    
    // Calculate linear regression (y = mx + b)
    $sum_x = 0;
    $sum_y = 0;
    $sum_xy = 0;
    $sum_xx = 0;
    
    for ($i = 0; $i < $n; $i++) {
        $x = $i;
        $y = intval($views_array[$i]);
        $sum_x += $x;
        $sum_y += $y;
        $sum_xy += ($x * $y);
        $sum_xx += ($x * $x);
    }
    
    $slope = ($n * $sum_xy - $sum_x * $sum_y) / ($n * $sum_xx - $sum_x * $sum_x);
    $intercept = ($sum_y - $slope * $sum_x) / $n;
    
    // Generate predictions
    $predictions = [];
    for ($i = 0; $i < $prediction_days; $i++) {
        $x = $n + $i;
        $predicted_views = max(0, round($slope * $x + $intercept));
        
        $date = date('Y-m-d', strtotime("+$i days"));
        $predictions[] = [
            'date' => $date,
            'predicted_views' => $predicted_views
        ];
    }
    
    // ===== CALCULATE GROWTH TREND =====
    $avg_recent_views = array_sum(array_slice($views_array, -7)) / 7;
    $avg_older_views = count($views_array) > 14 ? array_sum(array_slice($views_array, 0, 7)) / 7 : $avg_recent_views;
    
    $growth_rate = $avg_older_views > 0 
        ? (($avg_recent_views - $avg_older_views) / $avg_older_views) * 100 
        : 0;
    
    $trend = $slope > 0 ? 'growing' : ($slope < 0 ? 'declining' : 'stable');
    
    // ===== BEST POSTING TIME ANALYSIS =====
    $stmt = $conn->prepare("
        SELECT 
            HOUR(v.created_at) as hour,
            AVG(view_count) as avg_views,
            COUNT(*) as video_count
        FROM videos v
        WHERE v.user_id = ?
        AND v.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
        GROUP BY HOUR(v.created_at)
        ORDER BY avg_views DESC
        LIMIT 5
    ");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $best_hours = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // ===== BEST POSTING DAY ANALYSIS =====
    $stmt = $conn->prepare("
        SELECT 
            DAYNAME(v.created_at) as day_name,
            DAYOFWEEK(v.created_at) as day_number,
            AVG(view_count) as avg_views,
            COUNT(*) as video_count
        FROM videos v
        WHERE v.user_id = ?
        AND v.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
        GROUP BY day_name, day_number
        ORDER BY avg_views DESC
        LIMIT 3
    ");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $best_days = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // ===== ENGAGEMENT PREDICTION =====
    $stmt = $conn->prepare("
        SELECT 
            AVG(CASE WHEN r.reaction_type IN ('like', 'love') THEN 1 ELSE 0 END) * 100 as avg_like_rate,
            AVG((SELECT COUNT(*) FROM comments WHERE video_id = v.id) / NULLIF(v.view_count, 0)) * 100 as avg_comment_rate
        FROM videos v
        LEFT JOIN reactions r ON r.video_id = v.id
        WHERE v.user_id = ?
        AND v.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    ");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $engagement = $stmt->get_result()->fetch_assoc();
    
    // ===== VIRAL POTENTIAL SCORE =====
    // Based on: growth rate, recent engagement, view velocity
    $view_velocity = $slope; // views per day increase
    $engagement_score = (floatval($engagement['avg_like_rate']) + floatval($engagement['avg_comment_rate'])) / 2;
    
    $viral_score = 0;
    if ($growth_rate > 50) $viral_score += 30;
    elseif ($growth_rate > 20) $viral_score += 20;
    elseif ($growth_rate > 0) $viral_score += 10;
    
    if ($view_velocity > 100) $viral_score += 30;
    elseif ($view_velocity > 50) $viral_score += 20;
    elseif ($view_velocity > 10) $viral_score += 10;
    
    if ($engagement_score > 10) $viral_score += 20;
    elseif ($engagement_score > 5) $viral_score += 15;
    elseif ($engagement_score > 2) $viral_score += 10;
    
    // Add randomness factor
    $viral_score += rand(0, 20);
    $viral_score = min(100, $viral_score);
    
    // ===== RECOMMENDATIONS =====
    $recommendations = [];
    
    if ($trend === 'declining') {
        $recommendations[] = [
            'type' => 'warning',
            'title' => 'Tendência de Queda',
            'message' => 'Suas visualizações estão diminuindo. Considere mudar seu conteúdo ou estratégia de SEO.'
        ];
    }
    
    if ($growth_rate > 30) {
        $recommendations[] = [
            'type' => 'success',
            'title' => 'Crescimento Forte',
            'message' => 'Continue com a estratégia atual! Seu canal está crescendo rapidamente.'
        ];
    }
    
    if (count($best_hours) > 0) {
        $best_hour = $best_hours[0]['hour'];
        $recommendations[] = [
            'type' => 'info',
            'title' => 'Melhor Horário para Postar',
            'message' => "Seus vídeos publicados às {$best_hour}h têm melhor desempenho."
        ];
    }
    
    if (count($best_days) > 0) {
        $best_day = $best_days[0]['day_name'];
        $recommendations[] = [
            'type' => 'info',
            'title' => 'Melhor Dia para Postar',
            'message' => "Vídeos publicados em {$best_day} têm {$best_days[0]['avg_views']} visualizações em média."
        ];
    }
    
    if ($engagement_score < 2) {
        $recommendations[] = [
            'type' => 'warning',
            'title' => 'Baixo Engajamento',
            'message' => 'Incentive mais interações com CTAs, perguntas e conteúdo interativo.'
        ];
    }
    
    // ===== RESPONSE =====
    echo json_encode([
        'success' => true,
        'predictions' => [
            'views' => $predictions,
            'total_predicted_views' => array_sum(array_column($predictions, 'predicted_views'))
        ],
        'trend_analysis' => [
            'trend' => $trend,
            'growth_rate' => round($growth_rate, 2),
            'view_velocity' => round($view_velocity, 2),
            'avg_daily_views_recent' => round($avg_recent_views, 0),
            'viral_potential_score' => $viral_score
        ],
        'best_posting_times' => [
            'hours' => $best_hours,
            'days' => $best_days
        ],
        'engagement_metrics' => [
            'avg_like_rate' => round(floatval($engagement['avg_like_rate']), 2),
            'avg_comment_rate' => round(floatval($engagement['avg_comment_rate']), 2),
            'engagement_score' => round($engagement_score, 2)
        ],
        'recommendations' => $recommendations,
        'historical_data' => $historical_data
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erro ao gerar previsões: ' . $e->getMessage()
    ]);
}
?>
