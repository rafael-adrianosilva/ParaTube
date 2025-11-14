<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$user_id = $_GET['user_id'] ?? $_SESSION['user_id'] ?? $_SERVER['HTTP_X_USER_ID'] ?? null;

if (!$user_id) {
    echo json_encode(['success' => false, 'message' => 'User ID required']);
    exit;
}

try {
    $conn = getDBConnection();
    mysqli_set_charset($conn, "utf8mb4");
    
    // First, get all achievements
    $allAchievements = [];
    $stmt = $conn->prepare("SELECT * FROM achievements ORDER BY id");
    $stmt->execute();
    $result = $stmt->get_result();
    
    while ($row = $result->fetch_assoc()) {
        $allAchievements[] = [
            'id' => (int)$row['id'],
            'name' => $row['name'],
            'description' => $row['description'],
            'icon' => $row['icon'],
            'badge_color' => $row['badge_color'],
            'requirement_type' => $row['requirement_type'],
            'target_value' => (int)$row['requirement_value']
        ];
    }
    $stmt->close();
    
    // Then, get user's progress on these achievements
    $userAchievements = [];
    $stmt = $conn->prepare("
        SELECT achievement_id, progress, unlocked_at, notified
        FROM user_achievements
        WHERE user_id = ?
    ");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    while ($row = $result->fetch_assoc()) {
        $userAchievements[] = [
            'achievement_id' => (int)$row['achievement_id'],
            'progress' => (int)$row['progress'],
            'unlocked_at' => $row['unlocked_at'],
            'notified' => (int)$row['notified']
        ];
    }
    $stmt->close();
    
    echo json_encode([
        'success' => true,
        'achievements' => $allAchievements,
        'userAchievements' => $userAchievements
    ]);
    
    $conn->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro no servidor: ' . $e->getMessage()]);
}
