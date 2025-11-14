<?php
require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

// Verificar se está logado
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Não autorizado']);
    exit;
}

$user_id = $_SESSION['user_id'];

try {
    $conn = getDBConnection();
    mysqli_set_charset($conn, "utf8mb4");
    
    // Configurações de receita (RPM - Revenue Per Mille = receita por 1000 visualizações)
    $rpm_base = 2.50; // $2.50 por 1000 views (valor médio YouTube)
    
    // Buscar vídeos do usuário com views
    $query = "SELECT 
                v.id,
                v.title,
                v.thumbnail,
                v.views,
                v.created_at,
                v.duration
              FROM videos v
              WHERE v.user_id = ? AND v.visibility = 'public'
              ORDER BY v.views DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $videos = [];
    $total_views = 0;
    $total_revenue = 0;
    $total_videos = 0;
    
    while ($video = $result->fetch_assoc()) {
        $views = (int)$video['views'];
        
        // Calcular receita do vídeo
        $video_revenue = ($views / 1000) * $rpm_base;
        
        // Adicionar bônus para vídeos virais (>10k views)
        if ($views > 10000) {
            $video_revenue *= 1.2; // +20% de bônus
        }
        
        $videos[] = [
            'id' => $video['id'],
            'title' => $video['title'],
            'thumbnail' => $video['thumbnail'],
            'views' => $views,
            'revenue' => round($video_revenue, 2),
            'rpm' => round($rpm_base * ($views > 10000 ? 1.2 : 1), 2),
            'created_at' => $video['created_at'],
            'duration' => $video['duration']
        ];
        
        $total_views += $views;
        $total_revenue += $video_revenue;
        $total_videos++;
    }
    
    $stmt->close();
    
    // Calcular estatísticas
    $avg_rpm = $total_views > 0 ? ($total_revenue / ($total_views / 1000)) : 0;
    $avg_revenue_per_video = $total_videos > 0 ? ($total_revenue / $total_videos) : 0;
    
    // Estimativa de receita mensal (baseado nos últimos 30 dias)
    $query_monthly = "SELECT SUM(views) as monthly_views FROM videos 
                      WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
    $stmt_monthly = $conn->prepare($query_monthly);
    $stmt_monthly->bind_param("i", $user_id);
    $stmt_monthly->execute();
    $monthly_result = $stmt_monthly->get_result();
    $monthly_data = $monthly_result->fetch_assoc();
    $monthly_views = (int)($monthly_data['monthly_views'] ?? 0);
    $estimated_monthly = ($monthly_views / 1000) * $rpm_base;
    $stmt_monthly->close();
    
    mysqli_close($conn);
    
    echo json_encode([
        'success' => true,
        'stats' => [
            'total_revenue' => round($total_revenue, 2),
            'total_views' => $total_views,
            'total_videos' => $total_videos,
            'avg_rpm' => round($avg_rpm, 2),
            'avg_revenue_per_video' => round($avg_revenue_per_video, 2),
            'estimated_monthly' => round($estimated_monthly, 2),
            'monthly_views' => $monthly_views
        ],
        'videos' => $videos,
        'rpm_info' => [
            'base_rpm' => $rpm_base,
            'bonus_threshold' => 10000,
            'bonus_multiplier' => 1.2
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
