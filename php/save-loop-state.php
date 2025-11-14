<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, X-User-Id');

session_start();
require_once 'config.php';

$conn = getDBConnection();

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

$data = json_decode(file_get_contents('php://input'), true);
$videoId = intval($data['video_id'] ?? 0);
$loopEnabled = $data['loop_enabled'] ?? false;
$loopStart = $data['loop_start'] ?? null;
$loopEnd = $data['loop_end'] ?? null;

if (!$videoId) {
    echo json_encode(['success' => false]);
    exit;
}

// Save loop state
$stmt = $conn->prepare("
    INSERT INTO video_loop_state (user_id, video_id, loop_enabled, loop_start, loop_end) 
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
        loop_enabled = ?, 
        loop_start = ?, 
        loop_end = ?,
        updated_at = CURRENT_TIMESTAMP
");
$loopInt = $loopEnabled ? 1 : 0;
$stmt->bind_param("iiiddiddd", $userId, $videoId, $loopInt, $loopStart, $loopEnd, $loopInt, $loopStart, $loopEnd);

$stmt->execute();
echo json_encode(['success' => true]);

$stmt->close();
$conn->close();
?>
