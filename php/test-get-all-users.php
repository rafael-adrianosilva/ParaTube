<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'config.php';

$conn = getDBConnection();

try {
    $stmt = $conn->prepare("SELECT id, username, email, profile_image, created_at FROM users ORDER BY id ASC");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = [
            'id' => intval($row['id']),
            'username' => $row['username'],
            'email' => $row['email'],
            'profile_image' => $row['profile_image'],
            'created_at' => $row['created_at']
        ];
    }
    
    echo json_encode($users);
    $stmt->close();
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

$conn->close();
?>
