<?php
// Check Analytics Alerts (Run via Cron Job every hour)
require_once 'config.php';

try {
    // Get all active alerts
    $stmt = $conn->query("
        SELECT a.*, v.title as video_title, v.views, v.likes, v.dislikes
        FROM analytics_alerts a
        LEFT JOIN videos v ON a.video_id = v.id
        WHERE a.is_active = 1
    ");
    
    $alerts = $stmt->fetch_all(MYSQLI_ASSOC);
    
    foreach ($alerts as $alert) {
        $should_trigger = false;
        $metric_value = 0;
        $message = '';
        
        // Calculate metric value based on alert type
        switch ($alert['alert_type']) {
            case 'views_spike':
                // Check if views increased by threshold% in last 24h
                $stmt = $conn->prepare("
                    SELECT views FROM videos 
                    WHERE id = ? AND DATE(created_at) = CURDATE() - INTERVAL 1 DAY
                ");
                $stmt->bind_param("i", $alert['video_id']);
                $stmt->execute();
                $yesterday_views = $stmt->get_result()->fetch_assoc()['views'] ?? 0;
                $today_views = $alert['views'] ?? 0;
                
                if ($yesterday_views > 0) {
                    $increase = (($today_views - $yesterday_views) / $yesterday_views) * 100;
                    $metric_value = $increase;
                    $should_trigger = $increase >= $alert['threshold_value'];
                    $message = "Pico de visualizações! {$alert['video_title']} teve aumento de " . number_format($increase, 1) . "% nas últimas 24h";
                }
                break;
                
            case 'views_drop':
                // Similar to spike but opposite
                $stmt = $conn->prepare("
                    SELECT views FROM videos 
                    WHERE id = ? AND DATE(created_at) = CURDATE() - INTERVAL 1 DAY
                ");
                $stmt->bind_param("i", $alert['video_id']);
                $stmt->execute();
                $yesterday_views = $stmt->get_result()->fetch_assoc()['views'] ?? 0;
                $today_views = $alert['views'] ?? 0;
                
                if ($yesterday_views > 0) {
                    $decrease = (($yesterday_views - $today_views) / $yesterday_views) * 100;
                    $metric_value = $decrease;
                    $should_trigger = $decrease >= $alert['threshold_value'];
                    $message = "Queda de visualizações! {$alert['video_title']} teve queda de " . number_format($decrease, 1) . "% nas últimas 24h";
                }
                break;
                
            case 'ctr_low':
                // Check CTR
                $stmt = $conn->prepare("
                    SELECT 
                        SUM(impressions) as impressions,
                        SUM(clicks) as clicks
                    FROM video_ctr_stats
                    WHERE video_id = ? AND date >= CURDATE() - INTERVAL 7 DAY
                ");
                $stmt->bind_param("i", $alert['video_id']);
                $stmt->execute();
                $ctr_data = $stmt->get_result()->fetch_assoc();
                
                if ($ctr_data['impressions'] > 0) {
                    $ctr = ($ctr_data['clicks'] / $ctr_data['impressions']) * 100;
                    $metric_value = $ctr;
                    $should_trigger = $ctr < $alert['threshold_value'];
                    $message = "CTR baixo! {$alert['video_title']} tem CTR de " . number_format($ctr, 2) . "% (abaixo de {$alert['threshold_value']}%)";
                }
                break;
                
            case 'engagement_drop':
                // Check engagement rate
                $total_interactions = ($alert['likes'] ?? 0) + ($alert['dislikes'] ?? 0);
                $views = $alert['views'] ?? 0;
                
                if ($views > 0) {
                    $engagement_rate = ($total_interactions / $views) * 100;
                    $metric_value = $engagement_rate;
                    $should_trigger = $engagement_rate < $alert['threshold_value'];
                    $message = "Engajamento baixo! {$alert['video_title']} tem taxa de engajamento de " . number_format($engagement_rate, 2) . "%";
                }
                break;
                
            case 'milestone_reached':
                // Check if milestone reached
                $views = $alert['views'] ?? 0;
                $should_trigger = $views >= $alert['threshold_value'];
                $metric_value = $views;
                $message = "Marco alcançado! {$alert['video_title']} atingiu " . number_format($views) . " visualizações!";
                break;
                
            case 'negative_feedback':
                // Check dislike ratio
                $likes = $alert['likes'] ?? 0;
                $dislikes = $alert['dislikes'] ?? 0;
                $total = $likes + $dislikes;
                
                if ($total > 0) {
                    $dislike_ratio = ($dislikes / $total) * 100;
                    $metric_value = $dislike_ratio;
                    $should_trigger = $dislike_ratio >= $alert['threshold_value'];
                    $message = "Feedback negativo! {$alert['video_title']} tem " . number_format($dislike_ratio, 1) . "% de dislikes";
                }
                break;
        }
        
        // Trigger alert if conditions met
        if ($should_trigger) {
            // Check if not triggered recently (avoid spam)
            $last_trigger = strtotime($alert['last_triggered'] ?? '1970-01-01');
            $hours_since_trigger = (time() - $last_trigger) / 3600;
            
            if ($hours_since_trigger >= 24) { // Only trigger once per day
                // Save to alert history
                $stmt = $conn->prepare("
                    INSERT INTO alert_history (alert_id, video_id, metric_value, message)
                    VALUES (?, ?, ?, ?)
                ");
                $stmt->bind_param("iids", $alert['id'], $alert['video_id'], $metric_value, $message);
                $stmt->execute();
                
                // Update last triggered
                $stmt = $conn->prepare("
                    UPDATE analytics_alerts 
                    SET last_triggered = NOW(), trigger_count = trigger_count + 1
                    WHERE id = ?
                ");
                $stmt->bind_param("i", $alert['id']);
                $stmt->execute();
                
                // Create notification if enabled
                if ($alert['notification_enabled']) {
                    $stmt = $conn->prepare("
                        INSERT INTO notifications (user_id, type, title, message, link, icon)
                        VALUES (?, 'analytics_alert', 'Alerta de Analytics', ?, ?, 'fa-chart-line')
                    ");
                    $link = $alert['video_id'] ? "watch.html?id={$alert['video_id']}" : "manage-stats.html";
                    $stmt->bind_param("iss", $alert['user_id'], $message, $link);
                    $stmt->execute();
                }
                
                echo "Alert triggered: {$message}\n";
            }
        }
    }
    
    echo "Alert check completed.\n";
    
} catch (Exception $e) {
    echo "Error checking alerts: " . $e->getMessage() . "\n";
}
?>
