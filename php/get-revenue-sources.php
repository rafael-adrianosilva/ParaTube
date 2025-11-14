<?php
session_start();
header('Content-Type: application/json');

require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Não autorizado']);
    exit;
}

try {
    $stmt = $conn->prepare("
        SELECT 
            id,
            source_name,
            source_type,
            description,
            is_active
        FROM revenue_sources
        WHERE is_active = 1
        ORDER BY 
            CASE source_type
                WHEN 'ads' THEN 1
                WHEN 'membership' THEN 2
                WHEN 'sponsorship' THEN 3
                WHEN 'donation' THEN 4
                WHEN 'merchandise' THEN 5
                WHEN 'affiliate' THEN 6
                ELSE 7
            END,
            source_name ASC
    ");
    
    $stmt->execute();
    $sources = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    echo json_encode([
        'success' => true,
        'sources' => $sources
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erro ao obter fontes de receita: ' . $e->getMessage()
    ]);
}
?>
