<?php
require_once 'config.php';

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);

$videoId = $input['videoId'] ?? null;

if (!$videoId) {
    echo json_encode(['success' => false]);
    exit;
}

$conn = getDBConnection();

$stmt = $conn->prepare("UPDATE videos SET views = views + 1 WHERE id = ?");
$stmt->bind_param("i", $videoId);
$stmt->execute();

echo json_encode(['success' => true]);

$stmt->close();
$conn->close();
?>
