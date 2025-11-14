<?php
require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

$logged_in = isset($_SESSION['user_id']);

// Se estiver logado, buscar avatar do banco
$avatar = null;
if ($logged_in) {
    try {
        $conn = getDBConnection();
        mysqli_set_charset($conn, "utf8mb4");
        
        $user_id = $_SESSION['user_id'];
        $query = "SELECT avatar FROM users WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($row = $result->fetch_assoc()) {
            $avatar = $row['avatar'];
        }
        
        $stmt->close();
        mysqli_close($conn);
    } catch (Exception $e) {
        // Se der erro, continua sem avatar
    }
}

// Retorna informações da sessão atual
echo json_encode([
    'logged_in' => $logged_in,
    'session_active' => $logged_in,
    'user' => $logged_in ? [
        'user_id' => $_SESSION['user_id'],
        'id' => $_SESSION['user_id'],
        'username' => $_SESSION['username'] ?? null,
        'email' => $_SESSION['email'] ?? null,
        'avatar' => $avatar
    ] : null
]);
?>
