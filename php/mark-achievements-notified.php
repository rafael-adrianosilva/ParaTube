<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, X-User-Id');

session_start();
require_once 'config.php';

$conn = getDBConnection();
mysqli_set_charset($conn, "utf8mb4");

// Get user ID
$userId = null;
if (isset($_SESSION['user_id'])) {
    $userId = $_SESSION['user_id'];
} elseif (isset($_SERVER['HTTP_X_USER_ID'])) {
    $userId = intval($_SERVER['HTTP_X_USER_ID']);
}

if (!$userId) {
    echo json_encode(['success' => false]);
    exit;
}

// Mark all achievements as notified
$stmt = $conn->prepare("UPDATE user_achievements SET notified = 1 WHERE user_id = ?");
$stmt->bind_param("i", $userId);
$stmt->execute();

echo json_encode(['success' => true]);

$stmt->close();
$conn->close();
?>
