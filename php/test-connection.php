<?php
header('Content-Type: text/plain');

echo "=== TESTE DE CONEXÃO PHP/MySQL ===\n\n";

// 1. Testar require do config
echo "1. Testando require_once config.php...\n";
require_once 'config.php';
echo "   ✅ Config carregado com sucesso\n\n";

// 2. Testar função getDBConnection
echo "2. Testando getDBConnection()...\n";
if (function_exists('getDBConnection')) {
    echo "   ✅ Função existe\n";
    
    try {
        $conn = getDBConnection();
        echo "   ✅ Conexão criada\n";
        echo "   ℹ️ Tipo: " . get_class($conn) . "\n\n";
        
        // 3. Testar query simples
        echo "3. Testando query simples...\n";
        $result = $conn->query("SELECT 1 as test");
        if ($result) {
            echo "   ✅ Query executada\n";
            $row = $result->fetch_assoc();
            echo "   ✅ Resultado: " . $row['test'] . "\n\n";
        }
        
        // 4. Testar tabela users
        echo "4. Testando tabela users...\n";
        $result = $conn->query("SELECT COUNT(*) as count FROM users");
        if ($result) {
            $row = $result->fetch_assoc();
            echo "   ✅ Usuários no banco: " . $row['count'] . "\n\n";
        }
        
        // 5. Testar tabela subscriptions
        echo "5. Testando tabela subscriptions...\n";
        $result = $conn->query("SELECT COUNT(*) as count FROM subscriptions");
        if ($result) {
            $row = $result->fetch_assoc();
            echo "   ✅ Inscrições no banco: " . $row['count'] . "\n\n";
        }
        
        $conn->close();
        echo "✅ TODOS OS TESTES PASSARAM!\n";
        
    } catch (Exception $e) {
        echo "   ❌ ERRO: " . $e->getMessage() . "\n";
    }
} else {
    echo "   ❌ Função não existe\n";
}
?>
