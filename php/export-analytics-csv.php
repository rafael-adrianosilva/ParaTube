<?php
session_start();
header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="analytics-report-' . date('Y-m-d') . '.csv"');

require_once 'config.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    die('Não autorizado');
}

$user_id = $_SESSION['user_id'];
$video_id = isset($_GET['video_id']) ? intval($_GET['video_id']) : null;
$from_date = isset($_GET['from']) ? $_GET['from'] : date('Y-m-d', strtotime('-30 days'));
$to_date = isset($_GET['to']) ? $_GET['to'] : date('Y-m-d');

try {
    // Verify video ownership if video_id is provided
    if ($video_id) {
        $stmt = $conn->prepare("SELECT user_id FROM videos WHERE id = ?");
        $stmt->bind_param("i", $video_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $video = $result->fetch_assoc();
        
        if (!$video || $video['user_id'] != $user_id) {
            die('Vídeo não encontrado');
        }
    }
    
    // Open output stream
    $output = fopen('php://output', 'w');
    
    // UTF-8 BOM for Excel compatibility
    fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
    
    // ===== SECTION 1: GENERAL STATS =====
    fputcsv($output, ['RELATÓRIO DE ANALYTICS - PARATUBE']);
    fputcsv($output, ['Gerado em:', date('d/m/Y H:i:s')]);
    fputcsv($output, ['Período:', $from_date . ' até ' . $to_date]);
    fputcsv($output, []);
    
    // ===== SECTION 2: VIDEO PERFORMANCE =====
    fputcsv($output, ['DESEMPENHO DOS VÍDEOS']);
    fputcsv($output, ['Título', 'Visualizações', 'Likes', 'Dislikes', 'Comentários', 'CTR (%)', 'Data Publicação']);
    
    $where_video = $video_id ? "AND v.id = $video_id" : "AND v.user_id = $user_id";
    
    $query = "
        SELECT 
            v.id,
            v.title,
            v.views,
            v.likes,
            v.dislikes,
            v.created_at,
            COUNT(DISTINCT c.id) as comment_count,
            COALESCE(
                (SELECT SUM(clicks) / NULLIF(SUM(impressions), 0) * 100 
                 FROM video_ctr_stats 
                 WHERE video_id = v.id AND date BETWEEN ? AND ?), 
                0
            ) as ctr
        FROM videos v
        LEFT JOIN comments c ON c.video_id = v.id
        WHERE v.created_at BETWEEN ? AND ? $where_video
        GROUP BY v.id
        ORDER BY v.views DESC
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ssss", $from_date, $to_date, $from_date, $to_date);
    $stmt->execute();
    $result = $stmt->get_result();
    
    while ($row = $result->fetch_assoc()) {
        fputcsv($output, [
            $row['title'],
            $row['views'],
            $row['likes'],
            $row['dislikes'],
            $row['comment_count'],
            number_format($row['ctr'], 2),
            date('d/m/Y', strtotime($row['created_at']))
        ]);
    }
    
    fputcsv($output, []);
    
    // ===== SECTION 3: TRAFFIC SOURCES =====
    fputcsv($output, ['FONTES DE TRÁFEGO']);
    fputcsv($output, ['Fonte', 'Sessões', 'Porcentagem']);
    
    $query = "
        SELECT 
            ts.source_type,
            COUNT(*) as sessions,
            (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM traffic_sources ts2 
                                  JOIN video_impressions vi2 ON ts2.impression_id = vi2.id
                                  JOIN videos v2 ON vi2.video_id = v2.id
                                  WHERE vi2.created_at BETWEEN ? AND ? $where_video)) as percentage
        FROM traffic_sources ts
        JOIN video_impressions vi ON ts.impression_id = vi.id
        JOIN videos v ON vi.video_id = v.id
        WHERE vi.created_at BETWEEN ? AND ? $where_video
        GROUP BY ts.source_type
        ORDER BY sessions DESC
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ssss", $from_date, $to_date, $from_date, $to_date);
    $stmt->execute();
    $result = $stmt->get_result();
    
    while ($row = $result->fetch_assoc()) {
        fputcsv($output, [
            ucfirst($row['source_type']),
            $row['sessions'],
            number_format($row['percentage'], 2) . '%'
        ]);
    }
    
    fputcsv($output, []);
    
    // ===== SECTION 4: DEVICE BREAKDOWN =====
    fputcsv($output, ['DISPOSITIVOS']);
    fputcsv($output, ['Dispositivo', 'Visualizações', 'Porcentagem']);
    
    $query = "
        SELECT 
            vi.device_type,
            COUNT(*) as views,
            (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM video_impressions vi2
                                  JOIN videos v2 ON vi2.video_id = v2.id
                                  WHERE vi2.created_at BETWEEN ? AND ? $where_video)) as percentage
        FROM video_impressions vi
        JOIN videos v ON vi.video_id = v.id
        WHERE vi.created_at BETWEEN ? AND ? $where_video
        GROUP BY vi.device_type
        ORDER BY views DESC
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ssss", $from_date, $to_date, $from_date, $to_date);
    $stmt->execute();
    $result = $stmt->get_result();
    
    while ($row = $result->fetch_assoc()) {
        fputcsv($output, [
            ucfirst($row['device_type']),
            $row['views'],
            number_format($row['percentage'], 2) . '%'
        ]);
    }
    
    fputcsv($output, []);
    
    // ===== SECTION 5: DAILY STATS =====
    fputcsv($output, ['ESTATÍSTICAS DIÁRIAS']);
    fputcsv($output, ['Data', 'Visualizações', 'Impressões', 'Clicks', 'CTR (%)']);
    
    $query = "
        SELECT 
            DATE(vcs.date) as stat_date,
            SUM(v.views) as daily_views,
            SUM(vcs.impressions) as daily_impressions,
            SUM(vcs.clicks) as daily_clicks,
            (SUM(vcs.clicks) / NULLIF(SUM(vcs.impressions), 0) * 100) as daily_ctr
        FROM video_ctr_stats vcs
        JOIN videos v ON vcs.video_id = v.id
        WHERE vcs.date BETWEEN ? AND ? $where_video
        GROUP BY DATE(vcs.date)
        ORDER BY stat_date ASC
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ss", $from_date, $to_date);
    $stmt->execute();
    $result = $stmt->get_result();
    
    while ($row = $result->fetch_assoc()) {
        fputcsv($output, [
            date('d/m/Y', strtotime($row['stat_date'])),
            $row['daily_views'],
            $row['daily_impressions'],
            $row['daily_clicks'],
            number_format($row['daily_ctr'] ?? 0, 2)
        ]);
    }
    
    fclose($output);
    
} catch (Exception $e) {
    die('Erro ao gerar relatório: ' . $e->getMessage());
}
?>
