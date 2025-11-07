<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, X-User-Id');

session_start();
require_once 'config.php';

// Get user ID from session or header
$userId = null;
if (isset($_SESSION['user_id'])) {
    $userId = $_SESSION['user_id'];
} elseif (isset($_SERVER['HTTP_X_USER_ID'])) {
    $userId = intval($_SERVER['HTTP_X_USER_ID']);
} elseif (isset($_GET['userId'])) {
    $userId = intval($_GET['userId']);
}

if (!$userId) {
    echo json_encode([
        'success' => false,
        'message' => 'Usuário não autenticado'
    ]);
    exit;
}

try {
    // Get subscriber count
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM subscriptions WHERE channel_id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $subscriberData = $result->fetch_assoc();
    $subscribers = $subscriberData['count'];
    $stmt->close();
    
    // Get video count
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM videos WHERE user_id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $videoData = $result->fetch_assoc();
    $videoCount = $videoData['count'];
    $stmt->close();
    
    // Get total views
    $stmt = $conn->prepare("SELECT SUM(views) as total FROM videos WHERE user_id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $viewData = $result->fetch_assoc();
    $totalViews = $viewData['total'] ?? 0;
    $stmt->close();
    
    echo json_encode([
        'success' => true,
        'subscribers' => $subscribers,
        'videoCount' => $videoCount,
        'totalViews' => $totalViews
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erro ao buscar estatísticas: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
