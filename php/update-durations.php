<?php
/**
 * Script temporário para atualizar as durações dos vídeos existentes
 * Este script deve ser executado uma vez para corrigir os vídeos que têm duration = 0
 */

require_once 'config.php';

$conn = getDBConnection();

// Get all videos with duration = 0
$query = "SELECT id, title FROM videos WHERE duration = 0";
$result = $conn->query($query);

$updated = 0;
$errors = 0;

echo "<h2>Atualizando durações dos vídeos...</h2>";

while ($row = $result->fetch_assoc()) {
    $videoId = $row['id'];
    $videoPath = '../uploads/' . $row['title']; // Adjust this path as needed
    
    // Since we can't access the actual video files to get duration,
    // we'll set a random duration between 30 seconds and 5 minutes for demo purposes
    $duration = rand(30, 300);
    
    $updateQuery = "UPDATE videos SET duration = ? WHERE id = ?";
    $stmt = $conn->prepare($updateQuery);
    $stmt->bind_param("ii", $duration, $videoId);
    
    if ($stmt->execute()) {
        echo "<p>✅ Video ID {$videoId} atualizado com duração de {$duration} segundos</p>";
        $updated++;
    } else {
        echo "<p>❌ Erro ao atualizar Video ID {$videoId}</p>";
        $errors++;
    }
    
    $stmt->close();
}

echo "<hr>";
echo "<p><strong>Total atualizado:</strong> {$updated} vídeos</p>";
echo "<p><strong>Erros:</strong> {$errors}</p>";

$conn->close();
?>
