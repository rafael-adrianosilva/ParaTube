<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, X-User-Id');

session_start();
require_once 'config.php';

$conn = getDBConnection();

// Get user ID from session or header
$userId = null;
if (isset($_SESSION['user_id'])) {
    $userId = $_SESSION['user_id'];
} elseif (isset($_SERVER['HTTP_X_USER_ID'])) {
    $userId = intval($_SERVER['HTTP_X_USER_ID']);
}

if (!$userId) {
    echo json_encode([]);
    exit;
}

try {
    // Check if table exists (try both possible table names)
    $tableCheck = $conn->query("SHOW TABLES LIKE 'watch_progress'");
    $useWatchProgress = $tableCheck->num_rows > 0;
    
    if (!$useWatchProgress) {
        $tableCheck = $conn->query("SHOW TABLES LIKE 'video_progress'");
        if ($tableCheck->num_rows === 0) {
            // Neither table exists - return empty array
            echo json_encode([]);
            exit;
        }
    }
    
    // Build query based on available table
    if ($useWatchProgress) {
        $stmt = $conn->prepare("
            SELECT 
                wp.video_id,
                wp.current_time as progress_time,
                wp.duration,
                ROUND((wp.current_time / wp.duration) * 100, 1) as percentage
            FROM watch_progress wp
            WHERE wp.user_id = ? 
            AND wp.current_time > 0 
            AND wp.current_time < wp.duration
            AND wp.duration > 0
            ORDER BY wp.updated_at DESC
        ");
    } else {
        $stmt = $conn->prepare("
            SELECT 
                video_id, 
                progress_time, 
                duration,
                CASE WHEN duration > 0 THEN ROUND((progress_time / duration) * 100, 1) ELSE 0 END as percentage
            FROM video_progress
            WHERE user_id = ? AND completed = 0
        ");
    }
    
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $progress = [];
    while ($row = $result->fetch_assoc()) {
        $progress[$row['video_id']] = [
            'progress_time' => floatval($row['progress_time']),
            'duration' => floatval($row['duration']),
            'percentage' => floatval($row['percentage'])
        ];
    }
    
    echo json_encode($progress);
    $stmt->close();
    
} catch (Exception $e) {
    // Return empty array on error (graceful degradation)
    echo json_encode([]);
}

$conn->close();
?>
