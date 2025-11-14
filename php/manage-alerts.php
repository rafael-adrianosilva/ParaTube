<?php
session_start();
header('Content-Type: application/json');

require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Não autorizado']);
    exit;
}

$user_id = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        // Get all alerts for user
        $stmt = $conn->prepare("
            SELECT 
                a.*,
                v.title as video_title,
                (SELECT COUNT(*) FROM alert_history ah WHERE ah.alert_id = a.id) as total_triggers
            FROM analytics_alerts a
            LEFT JOIN videos v ON a.video_id = v.id
            WHERE a.user_id = ?
            ORDER BY a.created_at DESC
        ");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $alerts = [];
        while ($row = $result->fetch_assoc()) {
            $alerts[] = $row;
        }
        
        echo json_encode(['success' => true, 'alerts' => $alerts]);
        
    } elseif ($method === 'POST') {
        // Create new alert
        $data = json_decode(file_get_contents('php://input'), true);
        
        $video_id = isset($data['video_id']) ? intval($data['video_id']) : null;
        $alert_type = $data['alert_type'];
        $metric_name = $data['metric_name'];
        $threshold_value = floatval($data['threshold_value']);
        $comparison_operator = $data['comparison_operator'];
        $notification_enabled = isset($data['notification_enabled']) ? 1 : 0;
        $email_enabled = isset($data['email_enabled']) ? 1 : 0;
        
        $stmt = $conn->prepare("
            INSERT INTO analytics_alerts 
            (user_id, video_id, alert_type, metric_name, threshold_value, comparison_operator, notification_enabled, email_enabled)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->bind_param("iissdsii", $user_id, $video_id, $alert_type, $metric_name, $threshold_value, $comparison_operator, $notification_enabled, $email_enabled);
        $stmt->execute();
        
        echo json_encode([
            'success' => true,
            'message' => 'Alerta criado com sucesso',
            'alert_id' => $conn->insert_id
        ]);
        
    } elseif ($method === 'PUT') {
        // Update alert
        $data = json_decode(file_get_contents('php://input'), true);
        $alert_id = intval($data['alert_id']);
        
        // Verify ownership
        $stmt = $conn->prepare("SELECT user_id FROM analytics_alerts WHERE id = ?");
        $stmt->bind_param("i", $alert_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $alert = $result->fetch_assoc();
        
        if (!$alert || $alert['user_id'] != $user_id) {
            echo json_encode(['success' => false, 'message' => 'Alerta não encontrado']);
            exit;
        }
        
        $is_active = isset($data['is_active']) ? 1 : 0;
        $notification_enabled = isset($data['notification_enabled']) ? 1 : 0;
        $email_enabled = isset($data['email_enabled']) ? 1 : 0;
        
        $stmt = $conn->prepare("
            UPDATE analytics_alerts 
            SET is_active = ?, notification_enabled = ?, email_enabled = ?
            WHERE id = ?
        ");
        $stmt->bind_param("iiii", $is_active, $notification_enabled, $email_enabled, $alert_id);
        $stmt->execute();
        
        echo json_encode(['success' => true, 'message' => 'Alerta atualizado']);
        
    } elseif ($method === 'DELETE') {
        // Delete alert
        $alert_id = intval($_GET['id']);
        
        // Verify ownership
        $stmt = $conn->prepare("SELECT user_id FROM analytics_alerts WHERE id = ?");
        $stmt->bind_param("i", $alert_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $alert = $result->fetch_assoc();
        
        if (!$alert || $alert['user_id'] != $user_id) {
            echo json_encode(['success' => false, 'message' => 'Alerta não encontrado']);
            exit;
        }
        
        $stmt = $conn->prepare("DELETE FROM analytics_alerts WHERE id = ?");
        $stmt->bind_param("i", $alert_id);
        $stmt->execute();
        
        echo json_encode(['success' => true, 'message' => 'Alerta removido']);
    }
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
}
?>
