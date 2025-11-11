<?php
session_start();
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-User-ID');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    exit;
}

// Get user from session or header
$userId = null;
if (isset($_SESSION['user_id'])) {
    $userId = $_SESSION['user_id'];
} elseif (isset($_SERVER['HTTP_X_USER_ID'])) {
    $userId = intval($_SERVER['HTTP_X_USER_ID']);
}

// Check if user is logged in
if (!$userId) {
    echo json_encode(['success' => false, 'message' => 'Você precisa estar logado para fazer upload.']);
    exit;
}

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

// Create uploads directory if it doesn't exist
$uploadsDir = 'uploads';
if (!file_exists('../' . $uploadsDir)) {
    mkdir('../' . $uploadsDir, 0777, true);
}

// Generate unique filename
$fileExtension = pathinfo($_FILES['video']['name'], PATHINFO_EXTENSION);
$fileName = uniqid('video_') . '.' . $fileExtension;
$uploadPath = '../' . $uploadsDir . '/' . $fileName;

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
        $thumbnailsDir = 'uploads/thumbnails';
        if (!file_exists('../' . $thumbnailsDir)) {
            mkdir('../' . $thumbnailsDir, 0777, true);
        }
        
        // Generate unique thumbnail filename
        $thumbnailExtension = pathinfo($_FILES['thumbnail']['name'], PATHINFO_EXTENSION);
        $thumbnailFileName = uniqid('thumb_') . '.' . $thumbnailExtension;
        $thumbnailFullPath = '../' . $thumbnailsDir . '/' . $thumbnailFileName;
        
        if (move_uploaded_file($_FILES['thumbnail']['tmp_name'], $thumbnailFullPath)) {
            $thumbnailPath = $thumbnailsDir . '/' . $thumbnailFileName;
        }
    }
}

// Get video duration from form data (captured by JavaScript)
$duration = isset($_POST['duration']) ? intval($_POST['duration']) : 0;

// Insert video into database
$conn = getDBConnection();

// Save full path to database (for web access)
$videoPath = $uploadsDir . '/' . $fileName;

$stmt = $conn->prepare("INSERT INTO videos (user_id, title, description, category, filename, thumbnail, duration, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
$stmt->bind_param("isssssi", $userId, $title, $description, $category, $videoPath, $thumbnailPath, $duration);

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
