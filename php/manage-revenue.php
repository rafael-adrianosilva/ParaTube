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
    // ===== GET: List revenue entries =====
    if ($method === 'GET') {
        $video_id = isset($_GET['video_id']) ? intval($_GET['video_id']) : null;
        $revenue_type = isset($_GET['type']) ? $_GET['type'] : 'both'; // 'video', 'channel', 'both'
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
        $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
        
        $results = [];
        
        // Get video revenue
        if (($revenue_type === 'video' || $revenue_type === 'both') && $video_id) {
            $stmt = $conn->prepare("
                SELECT 
                    vr.*,
                    rs.source_name,
                    rs.source_type,
                    v.title as video_title
                FROM video_revenue vr
                JOIN revenue_sources rs ON vr.revenue_source_id = rs.id
                JOIN videos v ON vr.video_id = v.id
                WHERE v.user_id = ? AND vr.video_id = ?
                ORDER BY vr.transaction_date DESC
                LIMIT ? OFFSET ?
            ");
            $stmt->bind_param("iiii", $user_id, $video_id, $limit, $offset);
            $stmt->execute();
            $results['video_revenue'] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        } elseif ($revenue_type === 'video' || $revenue_type === 'both') {
            // All video revenue for user
            $stmt = $conn->prepare("
                SELECT 
                    vr.*,
                    rs.source_name,
                    rs.source_type,
                    v.title as video_title,
                    v.thumbnail
                FROM video_revenue vr
                JOIN revenue_sources rs ON vr.revenue_source_id = rs.id
                JOIN videos v ON vr.video_id = v.id
                WHERE v.user_id = ?
                ORDER BY vr.transaction_date DESC
                LIMIT ? OFFSET ?
            ");
            $stmt->bind_param("iii", $user_id, $limit, $offset);
            $stmt->execute();
            $results['video_revenue'] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        }
        
        // Get channel revenue
        if ($revenue_type === 'channel' || $revenue_type === 'both') {
            $stmt = $conn->prepare("
                SELECT 
                    cr.*,
                    rs.source_name,
                    rs.source_type
                FROM channel_revenue cr
                JOIN revenue_sources rs ON cr.revenue_source_id = rs.id
                WHERE cr.user_id = ?
                ORDER BY cr.transaction_date DESC
                LIMIT ? OFFSET ?
            ");
            $stmt->bind_param("iii", $user_id, $limit, $offset);
            $stmt->execute();
            $results['channel_revenue'] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        }
        
        echo json_encode(['success' => true, 'data' => $results]);
        exit;
    }
    
    // ===== POST: Add new revenue entry =====
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $revenue_type = $data['revenue_type'] ?? 'video'; // 'video' or 'channel'
        $video_id = isset($data['video_id']) ? intval($data['video_id']) : null;
        $revenue_source_id = intval($data['revenue_source_id']);
        $amount = floatval($data['amount']);
        $currency = $data['currency'] ?? 'BRL';
        $transaction_date = $data['transaction_date'] ?? date('Y-m-d');
        $impressions = isset($data['impressions']) ? intval($data['impressions']) : null;
        $clicks = isset($data['clicks']) ? intval($data['clicks']) : null;
        $notes = $data['notes'] ?? null;
        
        // Calculate RPM and CPM if impressions provided
        $rpm = null;
        $cpm = null;
        if ($impressions && $impressions > 0) {
            $rpm = ($amount / $impressions) * 1000;
            if ($clicks && $clicks > 0) {
                $cpm = ($amount / $clicks) * 1000;
            }
        }
        
        if ($revenue_type === 'video') {
            // Verify video ownership
            if (!$video_id) {
                echo json_encode(['success' => false, 'message' => 'ID do vídeo é obrigatório']);
                exit;
            }
            
            $stmt = $conn->prepare("SELECT user_id FROM videos WHERE id = ?");
            $stmt->bind_param("i", $video_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $video = $result->fetch_assoc();
            
            if (!$video || $video['user_id'] != $user_id) {
                echo json_encode(['success' => false, 'message' => 'Vídeo não encontrado']);
                exit;
            }
            
            // Insert video revenue
            $stmt = $conn->prepare("
                INSERT INTO video_revenue 
                (video_id, revenue_source_id, amount, currency, transaction_date, impressions, clicks, rpm, cpm, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->bind_param("iidssiidds", $video_id, $revenue_source_id, $amount, $currency, $transaction_date, $impressions, $clicks, $rpm, $cpm, $notes);
            
        } else {
            // Insert channel revenue
            $stmt = $conn->prepare("
                INSERT INTO channel_revenue 
                (user_id, revenue_source_id, amount, currency, transaction_date, notes)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->bind_param("iidsss", $user_id, $revenue_source_id, $amount, $currency, $transaction_date, $notes);
        }
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Receita adicionada com sucesso',
                'id' => $conn->insert_id
            ]);
        } else {
            throw new Exception('Erro ao inserir receita');
        }
        exit;
    }
    
    // ===== PUT: Update revenue entry =====
    if ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $revenue_id = intval($data['id']);
        $revenue_type = $data['revenue_type'] ?? 'video';
        $amount = floatval($data['amount']);
        $currency = $data['currency'] ?? 'BRL';
        $transaction_date = $data['transaction_date'];
        $notes = $data['notes'] ?? null;
        
        if ($revenue_type === 'video') {
            $impressions = isset($data['impressions']) ? intval($data['impressions']) : null;
            $clicks = isset($data['clicks']) ? intval($data['clicks']) : null;
            
            // Recalculate RPM and CPM
            $rpm = null;
            $cpm = null;
            if ($impressions && $impressions > 0) {
                $rpm = ($amount / $impressions) * 1000;
                if ($clicks && $clicks > 0) {
                    $cpm = ($amount / $clicks) * 1000;
                }
            }
            
            // Verify ownership
            $stmt = $conn->prepare("
                SELECT v.user_id 
                FROM video_revenue vr
                JOIN videos v ON vr.video_id = v.id
                WHERE vr.id = ?
            ");
            $stmt->bind_param("i", $revenue_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $owner = $result->fetch_assoc();
            
            if (!$owner || $owner['user_id'] != $user_id) {
                echo json_encode(['success' => false, 'message' => 'Receita não encontrada']);
                exit;
            }
            
            // Update video revenue
            $stmt = $conn->prepare("
                UPDATE video_revenue 
                SET amount = ?, currency = ?, transaction_date = ?, impressions = ?, clicks = ?, rpm = ?, cpm = ?, notes = ?
                WHERE id = ?
            ");
            $stmt->bind_param("dssiiddsi", $amount, $currency, $transaction_date, $impressions, $clicks, $rpm, $cpm, $notes, $revenue_id);
            
        } else {
            // Verify ownership
            $stmt = $conn->prepare("SELECT user_id FROM channel_revenue WHERE id = ?");
            $stmt->bind_param("i", $revenue_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $owner = $result->fetch_assoc();
            
            if (!$owner || $owner['user_id'] != $user_id) {
                echo json_encode(['success' => false, 'message' => 'Receita não encontrada']);
                exit;
            }
            
            // Update channel revenue
            $stmt = $conn->prepare("
                UPDATE channel_revenue 
                SET amount = ?, currency = ?, transaction_date = ?, notes = ?
                WHERE id = ?
            ");
            $stmt->bind_param("dsssi", $amount, $currency, $transaction_date, $notes, $revenue_id);
        }
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Receita atualizada com sucesso']);
        } else {
            throw new Exception('Erro ao atualizar receita');
        }
        exit;
    }
    
    // ===== DELETE: Remove revenue entry =====
    if ($method === 'DELETE') {
        $revenue_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        $revenue_type = isset($_GET['type']) ? $_GET['type'] : 'video';
        
        if ($revenue_type === 'video') {
            // Verify ownership
            $stmt = $conn->prepare("
                SELECT v.user_id 
                FROM video_revenue vr
                JOIN videos v ON vr.video_id = v.id
                WHERE vr.id = ?
            ");
            $stmt->bind_param("i", $revenue_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $owner = $result->fetch_assoc();
            
            if (!$owner || $owner['user_id'] != $user_id) {
                echo json_encode(['success' => false, 'message' => 'Receita não encontrada']);
                exit;
            }
            
            $stmt = $conn->prepare("DELETE FROM video_revenue WHERE id = ?");
        } else {
            // Verify ownership
            $stmt = $conn->prepare("SELECT user_id FROM channel_revenue WHERE id = ?");
            $stmt->bind_param("i", $revenue_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $owner = $result->fetch_assoc();
            
            if (!$owner || $owner['user_id'] != $user_id) {
                echo json_encode(['success' => false, 'message' => 'Receita não encontrada']);
                exit;
            }
            
            $stmt = $conn->prepare("DELETE FROM channel_revenue WHERE id = ?");
        }
        
        $stmt->bind_param("i", $revenue_id);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Receita removida com sucesso']);
        } else {
            throw new Exception('Erro ao remover receita');
        }
        exit;
    }
    
    echo json_encode(['success' => false, 'message' => 'Método não suportado']);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erro: ' . $e->getMessage()
    ]);
}
?>
