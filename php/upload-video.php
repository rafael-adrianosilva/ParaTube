<?php
require_once 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    exit;
}

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Você precisa estar logado para fazer upload.']);
    exit;
}

$userId = $_SESSION['user_id'];

// Validate file upload
if (!isset($_FILES['video']) || $_FILES['video']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'message' => 'Erro ao fazer upload do arquivo.']);
    exit;
}

$title = $_POST['title'] ?? '';
$description = $_POST['description'] ?? '';
$category = $_POST['category'] ?? 'other';

if (empty($title)) {
    echo json_encode(['success' => false, 'message' => 'Por favor, informe o título do vídeo.']);
    exit;
}

// Validate file type
$allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
$fileType = $_FILES['video']['type'];

if (!in_array($fileType, $allowedTypes)) {
    echo json_encode(['success' => false, 'message' => 'Tipo de arquivo não permitido. Use MP4, WebM ou OGG.']);
    exit;
}

// Generate unique filename
$fileExtension = pathinfo($_FILES['video']['name'], PATHINFO_EXTENSION);
$fileName = uniqid('video_') . '.' . $fileExtension;
$uploadPath = '../uploads/' . $fileName;

// Move uploaded file
if (!move_uploaded_file($_FILES['video']['tmp_name'], $uploadPath)) {
    echo json_encode(['success' => false, 'message' => 'Erro ao salvar arquivo.']);
    exit;
}

// Handle thumbnail upload
$thumbnailPath = null;
if (isset($_FILES['thumbnail']) && $_FILES['thumbnail']['error'] === UPLOAD_ERR_OK) {
    // Validate thumbnail type
    $allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $thumbnailType = $_FILES['thumbnail']['type'];
    
    if (in_array($thumbnailType, $allowedImageTypes)) {
        // Create thumbnails directory if it doesn't exist
        $thumbnailsDir = '../uploads/thumbnails';
        if (!file_exists($thumbnailsDir)) {
            mkdir($thumbnailsDir, 0777, true);
        }
        
        // Generate unique thumbnail filename
        $thumbnailExtension = pathinfo($_FILES['thumbnail']['name'], PATHINFO_EXTENSION);
        $thumbnailFileName = uniqid('thumb_') . '.' . $thumbnailExtension;
        $thumbnailFullPath = $thumbnailsDir . '/' . $thumbnailFileName;
        
        if (move_uploaded_file($_FILES['thumbnail']['tmp_name'], $thumbnailFullPath)) {
            $thumbnailPath = 'uploads/thumbnails/' . $thumbnailFileName;
        }
    }
}

// Get video duration from form data (captured by JavaScript)
$duration = isset($_POST['duration']) ? intval($_POST['duration']) : 0;

// Insert video into database
$conn = getDBConnection();

$stmt = $conn->prepare("INSERT INTO videos (user_id, title, description, category, filename, thumbnail, duration, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
$stmt->bind_param("isssssi", $userId, $title, $description, $category, $fileName, $thumbnailPath, $duration);

if ($stmt->execute()) {
    $videoId = $conn->insert_id;
    
    echo json_encode([
        'success' => true,
        'message' => 'Vídeo enviado com sucesso!',
        'videoId' => $videoId
    ]);
} else {
    // Delete uploaded files if database insert fails
    unlink($uploadPath);
    if ($thumbnailPath && file_exists('../' . $thumbnailPath)) {
        unlink('../' . $thumbnailPath);
    }
    echo json_encode(['success' => false, 'message' => 'Erro ao salvar vídeo no banco de dados.']);
}

$stmt->close();
$conn->close();
?>
