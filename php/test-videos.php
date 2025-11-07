<?php
/**
 * Script de teste para verificar dados de vídeos e usuários
 */

require_once 'config.php';

header('Content-Type: text/html; charset=utf-8');

$conn = getDBConnection();

echo "<h2>Vídeos e seus autores:</h2>";

$query = "
    SELECT 
        v.id,
        v.title,
        v.duration,
        v.thumbnail,
        u.username,
        u.profile_image
    FROM videos v
    JOIN users u ON v.user_id = u.id
    ORDER BY v.created_at DESC
    LIMIT 10
";

$result = $conn->query($query);

echo "<table border='1' cellpadding='10'>";
echo "<tr>
    <th>ID</th>
    <th>Título</th>
    <th>Duração (s)</th>
    <th>Canal</th>
    <th>Profile Image</th>
    <th>Thumbnail</th>
</tr>";

while ($row = $result->fetch_assoc()) {
    echo "<tr>";
    echo "<td>{$row['id']}</td>";
    echo "<td>{$row['title']}</td>";
    echo "<td>{$row['duration']}</td>";
    echo "<td>{$row['username']}</td>";
    echo "<td>" . ($row['profile_image'] ? $row['profile_image'] : 'NULL') . "</td>";
    echo "<td>" . ($row['thumbnail'] ? $row['thumbnail'] : 'NULL') . "</td>";
    echo "</tr>";
}

echo "</table>";

$conn->close();
?>
