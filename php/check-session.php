<?php
require_once 'config.php';

header('Content-Type: application/json');

// Retorna informações da sessão atual
echo json_encode([
    'session_active' => isset($_SESSION['user_id']),
    'user_id' => $_SESSION['user_id'] ?? null,
    'username' => $_SESSION['username'] ?? null,
    'email' => $_SESSION['email'] ?? null
]);
?>
