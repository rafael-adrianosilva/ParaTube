<?php
session_start();
header('Content-Type: application/json');

require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Não autorizado']);
    exit;
}

$user_id = $_SESSION['user_id'];
$funnel_id = isset($_GET['funnel_id']) ? intval($_GET['funnel_id']) : null;
$from_date = isset($_GET['from']) ? $_GET['from'] : date('Y-m-d', strtotime('-30 days'));
$to_date = isset($_GET['to']) ? $_GET['to'] : date('Y-m-d');

try {
    if (!$funnel_id) {
        // Get all user funnels
        $stmt = $conn->prepare("
            SELECT 
                fd.*,
                COUNT(DISTINCT fs.id) as step_count
            FROM funnel_definitions fd
            LEFT JOIN funnel_steps fs ON fd.id = fs.funnel_id
            WHERE fd.user_id = ? AND fd.is_active = 1
            GROUP BY fd.id
            ORDER BY fd.created_at DESC
        ");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $funnels = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        
        echo json_encode(['success' => true, 'funnels' => $funnels]);
        exit;
    }
    
    // Verify funnel ownership
    $stmt = $conn->prepare("SELECT user_id, funnel_name FROM funnel_definitions WHERE id = ?");
    $stmt->bind_param("i", $funnel_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $funnel = $result->fetch_assoc();
    
    if (!$funnel || $funnel['user_id'] != $user_id) {
        echo json_encode(['success' => false, 'message' => 'Funil não encontrado']);
        exit;
    }
    
    // ===== GET FUNNEL STEPS =====
    $stmt = $conn->prepare("
        SELECT * FROM funnel_steps
        WHERE funnel_id = ?
        ORDER BY step_order ASC
    ");
    $stmt->bind_param("i", $funnel_id);
    $stmt->execute();
    $steps = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // ===== GET STEP STATISTICS =====
    $step_stats = [];
    
    foreach ($steps as $step) {
        $stmt = $conn->prepare("
            SELECT 
                COUNT(DISTINCT session_id) as unique_users,
                COUNT(*) as total_events
            FROM funnel_events
            WHERE funnel_id = ? AND step_id = ?
            AND DATE(created_at) BETWEEN ? AND ?
        ");
        $stmt->bind_param("iiss", $funnel_id, $step['id'], $from_date, $to_date);
        $stmt->execute();
        $stat = $stmt->get_result()->fetch_assoc();
        
        $step_stats[] = [
            'step_id' => $step['id'],
            'step_order' => $step['step_order'],
            'step_name' => $step['step_name'],
            'step_event' => $step['step_event'],
            'unique_users' => intval($stat['unique_users']),
            'total_events' => intval($stat['total_events'])
        ];
    }
    
    // ===== CALCULATE CONVERSION RATES =====
    $conversion_data = [];
    $first_step_users = $step_stats[0]['unique_users'] ?? 1;
    $previous_step_users = $first_step_users;
    
    foreach ($step_stats as $index => $stat) {
        $current_users = $stat['unique_users'];
        
        // Conversion from first step
        $conversion_from_start = $first_step_users > 0 
            ? ($current_users / $first_step_users) * 100 
            : 0;
        
        // Conversion from previous step (drop-off rate)
        $conversion_from_previous = $previous_step_users > 0 
            ? ($current_users / $previous_step_users) * 100 
            : 0;
        
        $drop_off_rate = 100 - $conversion_from_previous;
        $drop_off_count = $previous_step_users - $current_users;
        
        $conversion_data[] = [
            'step_order' => $stat['step_order'],
            'step_name' => $stat['step_name'],
            'users' => $current_users,
            'conversion_from_start' => round($conversion_from_start, 2),
            'conversion_from_previous' => round($conversion_from_previous, 2),
            'drop_off_rate' => round($drop_off_rate, 2),
            'drop_off_count' => $drop_off_count
        ];
        
        $previous_step_users = $current_users;
    }
    
    // ===== COMPLETION STATISTICS =====
    // Find sessions that completed all steps
    $last_step_id = end($steps)['id'];
    
    $stmt = $conn->prepare("
        SELECT 
            COUNT(DISTINCT fe.session_id) as completed_sessions
        FROM funnel_events fe
        WHERE fe.funnel_id = ? AND fe.step_id = ?
        AND DATE(fe.created_at) BETWEEN ? AND ?
    ");
    $stmt->bind_param("iiss", $funnel_id, $last_step_id, $from_date, $to_date);
    $stmt->execute();
    $completion = $stmt->get_result()->fetch_assoc();
    
    $completed_sessions = intval($completion['completed_sessions']);
    $completion_rate = $first_step_users > 0 
        ? ($completed_sessions / $first_step_users) * 100 
        : 0;
    
    // ===== AVERAGE COMPLETION TIME =====
    // Calculate time between first and last step for completed sessions
    $stmt = $conn->prepare("
        SELECT 
            AVG(TIMESTAMPDIFF(SECOND, first_event, last_event)) as avg_completion_time
        FROM (
            SELECT 
                fe.session_id,
                MIN(fe.created_at) as first_event,
                MAX(fe.created_at) as last_event
            FROM funnel_events fe
            WHERE fe.funnel_id = ?
            AND fe.session_id IN (
                SELECT DISTINCT session_id 
                FROM funnel_events 
                WHERE funnel_id = ? AND step_id = ?
                AND DATE(created_at) BETWEEN ? AND ?
            )
            AND DATE(fe.created_at) BETWEEN ? AND ?
            GROUP BY fe.session_id
            HAVING COUNT(DISTINCT fe.step_id) = ?
        ) as completed_funnels
    ");
    $step_count = count($steps);
    $stmt->bind_param("iiisssi", $funnel_id, $funnel_id, $last_step_id, $from_date, $to_date, $from_date, $to_date, $step_count);
    $stmt->execute();
    $time_result = $stmt->get_result()->fetch_assoc();
    $avg_completion_time = $time_result['avg_completion_time'] ?? 0;
    
    // ===== DAILY FUNNEL PERFORMANCE =====
    $stmt = $conn->prepare("
        SELECT 
            DATE(created_at) as date,
            COUNT(DISTINCT session_id) as entries
        FROM funnel_events
        WHERE funnel_id = ? AND step_id = ?
        AND DATE(created_at) BETWEEN ? AND ?
        GROUP BY DATE(created_at)
        ORDER BY date ASC
    ");
    $first_step_id = $steps[0]['id'];
    $stmt->bind_param("iiss", $funnel_id, $first_step_id, $from_date, $to_date);
    $stmt->execute();
    $daily_entries = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // ===== RESPONSE =====
    $response = [
        'success' => true,
        'funnel' => [
            'id' => $funnel_id,
            'name' => $funnel['funnel_name'],
            'step_count' => count($steps)
        ],
        'summary' => [
            'total_entries' => $first_step_users,
            'completed_sessions' => $completed_sessions,
            'completion_rate' => round($completion_rate, 2),
            'avg_completion_time' => intval($avg_completion_time),
            'avg_completion_time_formatted' => gmdate("H:i:s", intval($avg_completion_time))
        ],
        'steps' => $conversion_data,
        'daily_entries' => $daily_entries
    ];
    
    echo json_encode($response);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erro ao obter análise de funil: ' . $e->getMessage()
    ]);
}
?>
