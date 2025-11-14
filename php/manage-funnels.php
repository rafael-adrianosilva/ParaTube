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
    // ===== GET: List user's funnels =====
    if ($method === 'GET') {
        $funnel_id = isset($_GET['id']) ? intval($_GET['id']) : null;
        
        if ($funnel_id) {
            // Get specific funnel with steps
            $stmt = $conn->prepare("
                SELECT * FROM funnel_definitions
                WHERE id = ? AND user_id = ?
            ");
            $stmt->bind_param("ii", $funnel_id, $user_id);
            $stmt->execute();
            $funnel = $stmt->get_result()->fetch_assoc();
            
            if (!$funnel) {
                echo json_encode(['success' => false, 'message' => 'Funil não encontrado']);
                exit;
            }
            
            // Get steps
            $stmt = $conn->prepare("
                SELECT * FROM funnel_steps
                WHERE funnel_id = ?
                ORDER BY step_order ASC
            ");
            $stmt->bind_param("i", $funnel_id);
            $stmt->execute();
            $steps = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            
            $funnel['steps'] = $steps;
            
            echo json_encode(['success' => true, 'funnel' => $funnel]);
        } else {
            // Get all user funnels
            $stmt = $conn->prepare("
                SELECT 
                    fd.*,
                    COUNT(DISTINCT fs.id) as step_count,
                    (SELECT COUNT(*) FROM funnel_events WHERE funnel_id = fd.id) as event_count
                FROM funnel_definitions fd
                LEFT JOIN funnel_steps fs ON fd.id = fs.funnel_id
                WHERE fd.user_id = ?
                GROUP BY fd.id
                ORDER BY fd.created_at DESC
            ");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            $funnels = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            
            echo json_encode(['success' => true, 'funnels' => $funnels]);
        }
        exit;
    }
    
    // ===== POST: Create new funnel =====
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $funnel_name = $data['funnel_name'] ?? '';
        $description = $data['description'] ?? '';
        $steps = $data['steps'] ?? [];
        
        if (empty($funnel_name) || empty($steps)) {
            echo json_encode(['success' => false, 'message' => 'Nome do funil e etapas são obrigatórios']);
            exit;
        }
        
        // Start transaction
        $conn->begin_transaction();
        
        try {
            // Insert funnel definition
            $stmt = $conn->prepare("
                INSERT INTO funnel_definitions (user_id, funnel_name, description)
                VALUES (?, ?, ?)
            ");
            $stmt->bind_param("iss", $user_id, $funnel_name, $description);
            $stmt->execute();
            $funnel_id = $conn->insert_id;
            
            // Insert steps
            $stmt = $conn->prepare("
                INSERT INTO funnel_steps (funnel_id, step_order, step_name, step_event, required_duration)
                VALUES (?, ?, ?, ?, ?)
            ");
            
            foreach ($steps as $index => $step) {
                $step_order = $index + 1;
                $step_name = $step['step_name'];
                $step_event = $step['step_event'];
                $required_duration = $step['required_duration'] ?? null;
                
                $stmt->bind_param("iissi", $funnel_id, $step_order, $step_name, $step_event, $required_duration);
                $stmt->execute();
            }
            
            $conn->commit();
            
            echo json_encode([
                'success' => true,
                'message' => 'Funil criado com sucesso',
                'funnel_id' => $funnel_id
            ]);
            
        } catch (Exception $e) {
            $conn->rollback();
            throw $e;
        }
        exit;
    }
    
    // ===== PUT: Update funnel =====
    if ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $funnel_id = intval($data['id']);
        $funnel_name = $data['funnel_name'] ?? '';
        $description = $data['description'] ?? '';
        $is_active = isset($data['is_active']) ? intval($data['is_active']) : 1;
        
        // Verify ownership
        $stmt = $conn->prepare("SELECT user_id FROM funnel_definitions WHERE id = ?");
        $stmt->bind_param("i", $funnel_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $funnel = $result->fetch_assoc();
        
        if (!$funnel || $funnel['user_id'] != $user_id) {
            echo json_encode(['success' => false, 'message' => 'Funil não encontrado']);
            exit;
        }
        
        // Update funnel
        $stmt = $conn->prepare("
            UPDATE funnel_definitions
            SET funnel_name = ?, description = ?, is_active = ?
            WHERE id = ?
        ");
        $stmt->bind_param("ssii", $funnel_name, $description, $is_active, $funnel_id);
        
        if ($stmt->execute()) {
            // If steps are provided, update them
            if (isset($data['steps'])) {
                $conn->begin_transaction();
                
                try {
                    // Delete existing steps
                    $stmt = $conn->prepare("DELETE FROM funnel_steps WHERE funnel_id = ?");
                    $stmt->bind_param("i", $funnel_id);
                    $stmt->execute();
                    
                    // Insert new steps
                    $stmt = $conn->prepare("
                        INSERT INTO funnel_steps (funnel_id, step_order, step_name, step_event, required_duration)
                        VALUES (?, ?, ?, ?, ?)
                    ");
                    
                    foreach ($data['steps'] as $index => $step) {
                        $step_order = $index + 1;
                        $step_name = $step['step_name'];
                        $step_event = $step['step_event'];
                        $required_duration = $step['required_duration'] ?? null;
                        
                        $stmt->bind_param("iissi", $funnel_id, $step_order, $step_name, $step_event, $required_duration);
                        $stmt->execute();
                    }
                    
                    $conn->commit();
                } catch (Exception $e) {
                    $conn->rollback();
                    throw $e;
                }
            }
            
            echo json_encode(['success' => true, 'message' => 'Funil atualizado com sucesso']);
        } else {
            throw new Exception('Erro ao atualizar funil');
        }
        exit;
    }
    
    // ===== DELETE: Remove funnel =====
    if ($method === 'DELETE') {
        $funnel_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        
        // Verify ownership
        $stmt = $conn->prepare("SELECT user_id FROM funnel_definitions WHERE id = ?");
        $stmt->bind_param("i", $funnel_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $funnel = $result->fetch_assoc();
        
        if (!$funnel || $funnel['user_id'] != $user_id) {
            echo json_encode(['success' => false, 'message' => 'Funil não encontrado']);
            exit;
        }
        
        // Delete funnel (cascades to steps and events)
        $stmt = $conn->prepare("DELETE FROM funnel_definitions WHERE id = ?");
        $stmt->bind_param("i", $funnel_id);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Funil removido com sucesso']);
        } else {
            throw new Exception('Erro ao remover funil');
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
