<?php
/**
 * Script para corrigir a duração de vídeos específicos manualmente
 * Edite o array $corrections abaixo com o ID do vídeo e a duração correta em segundos
 */

require_once 'config.php';

header('Content-Type: text/html; charset=utf-8');

$conn = getDBConnection();

// EDITE AQUI: Array com ID do vídeo => duração em segundos
// Exemplo: Se o vídeo tem ID 5 e duração de 40 segundos:
$corrections = [
    // 5 => 40,  // Descomente e edite esta linha
    // 6 => 120, // Adicione mais linhas conforme necessário
];

echo "<h2>Correção Manual de Durações</h2>";
echo "<p>Se você não editou o array \$corrections, nada será alterado.</p>";
echo "<hr>";

if (empty($corrections)) {
    echo "<p><strong>⚠️ Nenhuma correção definida!</strong></p>";
    echo "<p>Edite o arquivo <code>php/fix-durations.php</code> e adicione as correções no array \$corrections.</p>";
    echo "<p>Exemplo:</p>";
    echo "<pre>\$corrections = [
    5 => 40,   // Video ID 5 tem 40 segundos
    6 => 120,  // Video ID 6 tem 2 minutos (120 segundos)
];</pre>";
    
    // Mostrar vídeos disponíveis
    echo "<hr>";
    echo "<h3>Vídeos disponíveis para correção:</h3>";
    $query = "SELECT id, title, duration FROM videos ORDER BY created_at DESC";
    $result = $conn->query($query);
    
    echo "<table border='1' cellpadding='10'>";
    echo "<tr><th>ID</th><th>Título</th><th>Duração Atual (segundos)</th><th>Formatado</th></tr>";
    
    while ($row = $result->fetch_assoc()) {
        $formatted = formatDuration($row['duration']);
        echo "<tr>";
        echo "<td><strong>{$row['id']}</strong></td>";
        echo "<td>{$row['title']}</td>";
        echo "<td>{$row['duration']}</td>";
        echo "<td>{$formatted}</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    $updated = 0;
    $errors = 0;
    
    foreach ($corrections as $videoId => $duration) {
        $stmt = $conn->prepare("UPDATE videos SET duration = ? WHERE id = ?");
        $stmt->bind_param("ii", $duration, $videoId);
        
        if ($stmt->execute()) {
            $formatted = formatDuration($duration);
            echo "<p>✅ Vídeo ID <strong>{$videoId}</strong> atualizado para <strong>{$duration} segundos</strong> ({$formatted})</p>";
            $updated++;
        } else {
            echo "<p>❌ Erro ao atualizar vídeo ID {$videoId}</p>";
            $errors++;
        }
        
        $stmt->close();
    }
    
    echo "<hr>";
    echo "<p><strong>Total atualizado:</strong> {$updated} vídeos</p>";
    echo "<p><strong>Erros:</strong> {$errors}</p>";
}

function formatDuration($seconds) {
    $hours = floor($seconds / 3600);
    $minutes = floor(($seconds % 3600) / 60);
    $secs = $seconds % 60;
    
    if ($hours > 0) {
        return sprintf('%d:%02d:%02d', $hours, $minutes, $secs);
    }
    return sprintf('%d:%02d', $minutes, $secs);
}

$conn->close();
?>
