<?php
require_once 'config.php';

header('Content-Type: text/html; charset=utf-8');

$conn = getDBConnection();

echo "<h2>Durações dos vídeos no banco:</h2>";

$query = "SELECT id, title, duration, filename FROM videos ORDER BY created_at DESC";
$result = $conn->query($query);

echo "<table border='1' cellpadding='10'>";
echo "<tr><th>ID</th><th>Título</th><th>Duração (segundos)</th><th>Formatado</th><th>Arquivo</th></tr>";

while ($row = $result->fetch_assoc()) {
    $formatted = formatDuration($row['duration']);
    echo "<tr>";
    echo "<td>{$row['id']}</td>";
    echo "<td>{$row['title']}</td>";
    echo "<td>{$row['duration']}</td>";
    echo "<td><strong>{$formatted}</strong></td>";
    echo "<td>{$row['filename']}</td>";
    echo "</tr>";
}

echo "</table>";

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
