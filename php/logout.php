<?php
require_once 'config.php';

header('Content-Type: application/json');

// Destroy session
session_destroy();

// Clear session variables
$_SESSION = array();

echo json_encode([
    'success' => true,
    'message' => 'Logout realizado com sucesso'
]);
?>
