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
    
    $where_video = $video_id ? "AND vd.video_id = $video_id" : "AND v.user_id = $user_id";
    
    // ===== COUNTRY BREAKDOWN =====
    $stmt = $conn->prepare("
        SELECT 
            vd.country,
            COUNT(*) as views,
            (COUNT(*) * 100.0 / (
                SELECT COUNT(*) FROM viewer_demographics vd2
                JOIN videos v2 ON vd2.video_id = v2.id
                WHERE vd2.viewed_at BETWEEN ? AND ? $where_video
            )) as percentage
        FROM viewer_demographics vd
        JOIN videos v ON vd.video_id = v.id
        WHERE vd.viewed_at BETWEEN ? AND ? $where_video
        AND vd.country IS NOT NULL
        GROUP BY vd.country
        ORDER BY views DESC
        LIMIT 10
    ");
    $stmt->bind_param("ssss", $from_date, $to_date, $from_date, $to_date);
    $stmt->execute();
    $countries = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // ===== AGE RANGE BREAKDOWN =====
    $stmt = $conn->prepare("
        SELECT 
            vd.age_range,
            COUNT(*) as views,
            (COUNT(*) * 100.0 / (
                SELECT COUNT(*) FROM viewer_demographics vd2
                JOIN videos v2 ON vd2.video_id = v2.id
                WHERE vd2.viewed_at BETWEEN ? AND ? $where_video
            )) as percentage
        FROM viewer_demographics vd
        JOIN videos v ON vd.video_id = v.id
        WHERE vd.viewed_at BETWEEN ? AND ? $where_video
        GROUP BY vd.age_range
        ORDER BY views DESC
    ");
    $stmt->bind_param("ssss", $from_date, $to_date, $from_date, $to_date);
    $stmt->execute();
    $age_ranges = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // ===== GENDER BREAKDOWN =====
    $stmt = $conn->prepare("
        SELECT 
            vd.gender,
            COUNT(*) as views,
            (COUNT(*) * 100.0 / (
                SELECT COUNT(*) FROM viewer_demographics vd2
                JOIN videos v2 ON vd2.video_id = v2.id
                WHERE vd2.viewed_at BETWEEN ? AND ? $where_video
            )) as percentage
        FROM viewer_demographics vd
        JOIN videos v ON vd.video_id = v.id
        WHERE vd.viewed_at BETWEEN ? AND ? $where_video
        GROUP BY vd.gender
        ORDER BY views DESC
    ");
    $stmt->bind_param("ssss", $from_date, $to_date, $from_date, $to_date);
    $stmt->execute();
    $genders = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // ===== LANGUAGE BREAKDOWN =====
    $stmt = $conn->prepare("
        SELECT 
            vd.language,
            COUNT(*) as views,
            (COUNT(*) * 100.0 / (
                SELECT COUNT(*) FROM viewer_demographics vd2
                JOIN videos v2 ON vd2.video_id = v2.id
                WHERE vd2.viewed_at BETWEEN ? AND ? $where_video
                AND vd2.language IS NOT NULL
            )) as percentage
        FROM viewer_demographics vd
        JOIN videos v ON vd.video_id = v.id
        WHERE vd.viewed_at BETWEEN ? AND ? $where_video
        AND vd.language IS NOT NULL
        GROUP BY vd.language
        ORDER BY views DESC
        LIMIT 10
    ");
    $stmt->bind_param("ssss", $from_date, $to_date, $from_date, $to_date);
    $stmt->execute();
    $languages = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // ===== CITY BREAKDOWN (Top 10) =====
    $stmt = $conn->prepare("
        SELECT 
            vd.city,
            vd.country,
            COUNT(*) as views
        FROM viewer_demographics vd
        JOIN videos v ON vd.video_id = v.id
        WHERE vd.viewed_at BETWEEN ? AND ? $where_video
        AND vd.city IS NOT NULL
        GROUP BY vd.city, vd.country
        ORDER BY views DESC
        LIMIT 10
    ");
    $stmt->bind_param("ss", $from_date, $to_date);
    $stmt->execute();
    $cities = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    echo json_encode([
        'success' => true,
        'demographics' => [
            'countries' => $countries,
            'age_ranges' => $age_ranges,
            'genders' => $genders,
            'languages' => $languages,
            'top_cities' => $cities
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erro ao obter demografia: ' . $e->getMessage()
    ]);
}
?>
