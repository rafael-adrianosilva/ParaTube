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
    // ===== GET: List user's dashboards or get specific dashboard =====
    if ($method === 'GET') {
        $dashboard_id = isset($_GET['id']) ? intval($_GET['id']) : null;
        
        if ($dashboard_id) {
            // Get specific dashboard with widgets
            $stmt = $conn->prepare("
                SELECT * FROM dashboard_configs
                WHERE id = ? AND user_id = ?
            ");
            $stmt->bind_param("ii", $dashboard_id, $user_id);
            $stmt->execute();
            $dashboard = $stmt->get_result()->fetch_assoc();
            
            if (!$dashboard) {
                echo json_encode(['success' => false, 'message' => 'Dashboard não encontrado']);
                exit;
            }
            
            // Get widgets
            $stmt = $conn->prepare("
                SELECT * FROM dashboard_widgets
                WHERE dashboard_id = ? AND is_visible = 1
                ORDER BY position_y ASC, position_x ASC
            ");
            $stmt->bind_param("i", $dashboard_id);
            $stmt->execute();
            $widgets = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            
            // Parse JSON configs
            $dashboard['layout_config'] = json_decode($dashboard['layout_config'], true);
            foreach ($widgets as &$widget) {
                $widget['widget_config'] = json_decode($widget['widget_config'], true);
            }
            
            $dashboard['widgets'] = $widgets;
            
            echo json_encode(['success' => true, 'dashboard' => $dashboard]);
        } else {
            // Get all user dashboards
            $stmt = $conn->prepare("
                SELECT 
                    dc.*,
                    COUNT(dw.id) as widget_count
                FROM dashboard_configs dc
                LEFT JOIN dashboard_widgets dw ON dc.id = dw.dashboard_id
                WHERE dc.user_id = ?
                GROUP BY dc.id
                ORDER BY dc.is_default DESC, dc.created_at DESC
            ");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            $dashboards = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            
            foreach ($dashboards as &$dashboard) {
                $dashboard['layout_config'] = json_decode($dashboard['layout_config'], true);
            }
            
            echo json_encode(['success' => true, 'dashboards' => $dashboards]);
        }
        exit;
    }
    
    // ===== POST: Create new dashboard =====
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $dashboard_name = $data['dashboard_name'] ?? 'Novo Dashboard';
        $is_default = isset($data['is_default']) ? intval($data['is_default']) : 0;
        $layout_config = isset($data['layout_config']) ? json_encode($data['layout_config']) : '{"grid_columns": 12, "grid_gap": 20, "theme": "light"}';
        $widgets = $data['widgets'] ?? [];
        
        // If setting as default, unset other defaults
        if ($is_default) {
            $stmt = $conn->prepare("UPDATE dashboard_configs SET is_default = 0 WHERE user_id = ?");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
        }
        
        // Start transaction
        $conn->begin_transaction();
        
        try {
            // Insert dashboard
            $stmt = $conn->prepare("
                INSERT INTO dashboard_configs (user_id, dashboard_name, is_default, layout_config)
                VALUES (?, ?, ?, ?)
            ");
            $stmt->bind_param("isis", $user_id, $dashboard_name, $is_default, $layout_config);
            $stmt->execute();
            $dashboard_id = $conn->insert_id;
            
            // Insert widgets
            if (!empty($widgets)) {
                $stmt = $conn->prepare("
                    INSERT INTO dashboard_widgets 
                    (dashboard_id, widget_type, widget_title, widget_config, position_x, position_y, width, height)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ");
                
                foreach ($widgets as $widget) {
                    $widget_type = $widget['widget_type'];
                    $widget_title = $widget['widget_title'];
                    $widget_config = json_encode($widget['widget_config'] ?? []);
                    $position_x = intval($widget['position_x'] ?? 0);
                    $position_y = intval($widget['position_y'] ?? 0);
                    $width = intval($widget['width'] ?? 4);
                    $height = intval($widget['height'] ?? 3);
                    
                    $stmt->bind_param("issssiiii", 
                        $dashboard_id, $widget_type, $widget_title, $widget_config,
                        $position_x, $position_y, $width, $height
                    );
                    $stmt->execute();
                }
            }
            
            $conn->commit();
            
            echo json_encode([
                'success' => true,
                'message' => 'Dashboard criado com sucesso',
                'dashboard_id' => $dashboard_id
            ]);
            
        } catch (Exception $e) {
            $conn->rollback();
            throw $e;
        }
        exit;
    }
    
    // ===== PUT: Update dashboard =====
    if ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $dashboard_id = intval($data['id']);
        $dashboard_name = $data['dashboard_name'] ?? null;
        $is_default = isset($data['is_default']) ? intval($data['is_default']) : null;
        $layout_config = isset($data['layout_config']) ? json_encode($data['layout_config']) : null;
        $widgets = $data['widgets'] ?? null;
        
        // Verify ownership
        $stmt = $conn->prepare("SELECT user_id FROM dashboard_configs WHERE id = ?");
        $stmt->bind_param("i", $dashboard_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $dashboard = $result->fetch_assoc();
        
        if (!$dashboard || $dashboard['user_id'] != $user_id) {
            echo json_encode(['success' => false, 'message' => 'Dashboard não encontrado']);
            exit;
        }
        
        // If setting as default, unset other defaults
        if ($is_default) {
            $stmt = $conn->prepare("UPDATE dashboard_configs SET is_default = 0 WHERE user_id = ?");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
        }
        
        // Update dashboard
        $updates = [];
        $params = [];
        $types = '';
        
        if ($dashboard_name !== null) {
            $updates[] = "dashboard_name = ?";
            $params[] = $dashboard_name;
            $types .= 's';
        }
        if ($is_default !== null) {
            $updates[] = "is_default = ?";
            $params[] = $is_default;
            $types .= 'i';
        }
        if ($layout_config !== null) {
            $updates[] = "layout_config = ?";
            $params[] = $layout_config;
            $types .= 's';
        }
        
        if (!empty($updates)) {
            $sql = "UPDATE dashboard_configs SET " . implode(", ", $updates) . " WHERE id = ?";
            $params[] = $dashboard_id;
            $types .= 'i';
            
            $stmt = $conn->prepare($sql);
            $stmt->bind_param($types, ...$params);
            $stmt->execute();
        }
        
        // Update widgets if provided
        if ($widgets !== null) {
            $conn->begin_transaction();
            
            try {
                // Delete existing widgets
                $stmt = $conn->prepare("DELETE FROM dashboard_widgets WHERE dashboard_id = ?");
                $stmt->bind_param("i", $dashboard_id);
                $stmt->execute();
                
                // Insert new widgets
                if (!empty($widgets)) {
                    $stmt = $conn->prepare("
                        INSERT INTO dashboard_widgets 
                        (dashboard_id, widget_type, widget_title, widget_config, position_x, position_y, width, height)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ");
                    
                    foreach ($widgets as $widget) {
                        $widget_type = $widget['widget_type'];
                        $widget_title = $widget['widget_title'];
                        $widget_config = json_encode($widget['widget_config'] ?? []);
                        $position_x = intval($widget['position_x'] ?? 0);
                        $position_y = intval($widget['position_y'] ?? 0);
                        $width = intval($widget['width'] ?? 4);
                        $height = intval($widget['height'] ?? 3);
                        
                        $stmt->bind_param("issssiiii", 
                            $dashboard_id, $widget_type, $widget_title, $widget_config,
                            $position_x, $position_y, $width, $height
                        );
                        $stmt->execute();
                    }
                }
                
                $conn->commit();
            } catch (Exception $e) {
                $conn->rollback();
                throw $e;
            }
        }
        
        echo json_encode(['success' => true, 'message' => 'Dashboard atualizado com sucesso']);
        exit;
    }
    
    // ===== DELETE: Remove dashboard =====
    if ($method === 'DELETE') {
        $dashboard_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        
        // Verify ownership
        $stmt = $conn->prepare("SELECT user_id, is_default FROM dashboard_configs WHERE id = ?");
        $stmt->bind_param("i", $dashboard_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $dashboard = $result->fetch_assoc();
        
        if (!$dashboard || $dashboard['user_id'] != $user_id) {
            echo json_encode(['success' => false, 'message' => 'Dashboard não encontrado']);
            exit;
        }
        
        // Don't allow deleting default dashboard without another default
        if ($dashboard['is_default']) {
            $stmt = $conn->prepare("SELECT COUNT(*) as count FROM dashboard_configs WHERE user_id = ? AND id != ?");
            $stmt->bind_param("ii", $user_id, $dashboard_id);
            $stmt->execute();
            $count = $stmt->get_result()->fetch_assoc()['count'];
            
            if ($count == 0) {
                echo json_encode(['success' => false, 'message' => 'Não é possível excluir o único dashboard']);
                exit;
            }
        }
        
        // Delete dashboard (cascades to widgets)
        $stmt = $conn->prepare("DELETE FROM dashboard_configs WHERE id = ?");
        $stmt->bind_param("i", $dashboard_id);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Dashboard removido com sucesso']);
        } else {
            throw new Exception('Erro ao remover dashboard');
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
