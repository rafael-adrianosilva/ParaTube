<?php
/**
 * EXEMPLO DE CONFIGURAÇÃO
 * 
 * Copie este arquivo para config.php e ajuste as configurações
 * conforme seu ambiente de desenvolvimento.
 */

// ===== CONFIGURAÇÃO DO BANCO DE DADOS =====

// Host do banco de dados (geralmente 'localhost')
define('DB_HOST', 'localhost');

// Nome de usuário do MySQL
// XAMPP padrão: 'root'
// WAMP padrão: 'root'
define('DB_USER', 'root');

// Senha do MySQL
// XAMPP padrão: '' (vazio)
// WAMP padrão: '' (vazio)
define('DB_PASS', '');

// Nome do banco de dados
define('DB_NAME', 'paratube');

// ===== CONFIGURAÇÃO DO SITE =====

// URL base do site (sem barra no final)
define('SITE_URL', 'http://localhost/paratube');

// Nome do site
define('SITE_NAME', 'ParaTube');

// ===== CONFIGURAÇÃO DE UPLOAD =====

// Tamanho máximo de upload em MB
define('MAX_UPLOAD_SIZE', 500);

// Tipos de arquivo permitidos
define('ALLOWED_VIDEO_TYPES', ['video/mp4', 'video/webm', 'video/ogg']);

// Pasta de uploads (relativo à raiz)
define('UPLOAD_DIR', '../uploads/');

// ===== CONFIGURAÇÃO DE SESSÃO =====

// Tempo de expiração da sessão em segundos (2 horas)
define('SESSION_LIFETIME', 7200);

// Nome da sessão
define('SESSION_NAME', 'PARATUBE_SESSION');

// ===== CONFIGURAÇÃO DE E-MAIL =====
// (Para recuperação de senha)

// Ativar envio de e-mail
define('EMAIL_ENABLED', false);

// SMTP Host
define('SMTP_HOST', 'smtp.gmail.com');

// SMTP Port
define('SMTP_PORT', 587);

// SMTP Username
define('SMTP_USER', 'seu-email@gmail.com');

// SMTP Password
define('SMTP_PASS', 'sua-senha');

// E-mail remetente
define('FROM_EMAIL', 'noreply@paratube.com');
define('FROM_NAME', 'ParaTube');

// ===== CONFIGURAÇÃO DE DESENVOLVIMENTO =====

// Modo de debug (true = desenvolvimento, false = produção)
define('DEBUG_MODE', true);

// Exibir erros PHP
if (DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// ===== FUNÇÕES AUXILIARES =====

/**
 * Cria conexão com o banco de dados
 */
function getDBConnection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    if ($conn->connect_error) {
        if (DEBUG_MODE) {
            die("Connection failed: " . $conn->connect_error);
        } else {
            die("Erro ao conectar ao banco de dados. Tente novamente mais tarde.");
        }
    }
    
    $conn->set_charset("utf8mb4");
    return $conn;
}

/**
 * Inicia sessão se não estiver iniciada
 */
if (session_status() === PHP_SESSION_NONE) {
    session_name(SESSION_NAME);
    session_start();
}

// ===== CORS Headers (apenas para desenvolvimento) =====
if (DEBUG_MODE) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
    header('Access-Control-Allow-Headers: Content-Type');
}

// ===== TIMEZONE =====
date_default_timezone_set('America/Sao_Paulo');

?>
