<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

session_start();

$userId = null;
if (isset($_SESSION['user_id'])) {
    $userId = $_SESSION['user_id'];
} elseif (isset($_SERVER['HTTP_X_USER_ID'])) {
    $userId = intval($_SERVER['HTTP_X_USER_ID']);
}

if (!$userId) {
    echo json_encode(['success' => false, 'message' => 'Não autorizado']);
    exit;
}

$conn = getDBConnection();

// Get channel customization
$stmt = $conn->prepare("SELECT banner, watermark, links FROM channel_customization WHERE user_id = ?");
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $customization = $result->fetch_assoc();
    echo json_encode([
        'success' => true,
        'banner' => $customization['banner'] ?: null,
        'watermark' => $customization['watermark'] ?: null,
        'links' => $customization['links'] ?: null
    ]);
} else {
    // Return success with null values if no customization exists yet
    echo json_encode([
        'success' => true,
        'banner' => null,
        'watermark' => null,
        'links' => null,
        'message' => 'Nenhuma personalização encontrada'
    ]);
}

$stmt->close();
$conn->close();
?>
