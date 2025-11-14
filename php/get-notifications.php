<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode([]);
    exit;
}

$user_id = $_SESSION['user_id'];
$limit = $_GET['limit'] ?? 20;
$offset = $_GET['offset'] ?? 0;

try {
    $conn = getDBConnection();
    
    // Get unread count
    $stmt = $conn->prepare("SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND is_read = 0");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $unreadCount = $stmt->get_result()->fetch_assoc()['unread'];
    
    // Get notifications
    $stmt = $conn->prepare("
        SELECT n.*, 
               u.username as related_username,
               u.profile_image as related_avatar,
               v.title as video_title
        FROM notifications n
        LEFT JOIN users u ON n.related_user_id = u.id
        LEFT JOIN videos v ON n.related_video_id = v.id
        WHERE n.user_id = ?
        ORDER BY n.created_at DESC
        LIMIT ? OFFSET ?
    ");
    $stmt->bind_param("iii", $user_id, $limit, $offset);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $notifications = [];
    while ($row = $result->fetch_assoc()) {
        $notifications[] = [
            'id' => $row['id'],
            'type' => $row['type'],
            'title' => $row['title'],
            'message' => $row['message'],
            'link' => $row['link'],
            'icon' => $row['icon'],
            'is_read' => (bool)$row['is_read'],
            'created_at' => $row['created_at'],
            'related_username' => $row['related_username'],
            'related_avatar' => $row['related_avatar'],
            'video_title' => $row['video_title']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'notifications' => $notifications,
        'unread_count' => $unreadCount
    ]);
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
