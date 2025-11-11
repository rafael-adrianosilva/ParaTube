<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, X-User-Id');

$userId = null;
if (isset($_SESSION['user_id'])) {
    $userId = $_SESSION['user_id'];
} elseif (isset($_SERVER['HTTP_X_USER_ID'])) {
    $userId = intval($_SERVER['HTTP_X_USER_ID']);
}

if (!$userId) {
    echo json_encode(['success' => false, 'message' => 'Não autorizado']);
    exit;
}

$username = $_POST['username'] ?? null;
$bio = $_POST['bio'] ?? '';
$links = $_POST['links'] ?? '[]';

if (!$username) {
    echo json_encode(['success' => false, 'message' => 'Nome do canal é obrigatório']);
    exit;
}

$conn = getDBConnection();

// Update user profile
$profileImagePath = null;
if (isset($_FILES['profile_image']) && $_FILES['profile_image']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = 'uploads/avatars';
    if (!file_exists('../' . $uploadDir)) {
        mkdir('../' . $uploadDir, 0777, true);
    }
    
    $fileExtension = pathinfo($_FILES['profile_image']['name'], PATHINFO_EXTENSION);
    $fileName = uniqid() . '_' . time() . '.' . $fileExtension;
    $uploadPath = '../' . $uploadDir . '/' . $fileName;
    
    if (move_uploaded_file($_FILES['profile_image']['tmp_name'], $uploadPath)) {
        $profileImagePath = $uploadDir . '/' . $fileName;
    }
}

// Update user table
if ($profileImagePath) {
    $stmt = $conn->prepare("UPDATE users SET username = ?, bio = ?, profile_image = ? WHERE id = ?");
    $stmt->bind_param("sssi", $username, $bio, $profileImagePath, $userId);
} else {
    $stmt = $conn->prepare("UPDATE users SET username = ?, bio = ? WHERE id = ?");
    $stmt->bind_param("ssi", $username, $bio, $userId);
}

if (!$stmt->execute()) {
    echo json_encode(['success' => false, 'message' => 'Erro ao atualizar perfil: ' . $stmt->error]);
    $stmt->close();
    $conn->close();
    exit;
}
$stmt->close();

// Handle banner upload
$bannerPath = null;
if (isset($_FILES['banner']) && $_FILES['banner']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = 'uploads/banners';
    if (!file_exists('../' . $uploadDir)) {
        mkdir('../' . $uploadDir, 0777, true);
    }
    
    $fileExtension = pathinfo($_FILES['banner']['name'], PATHINFO_EXTENSION);
    $fileName = uniqid() . '_' . time() . '.' . $fileExtension;
    $uploadPath = '../' . $uploadDir . '/' . $fileName;
    
    if (move_uploaded_file($_FILES['banner']['tmp_name'], $uploadPath)) {
        $bannerPath = $uploadDir . '/' . $fileName;
    }
}

// Handle watermark upload
$watermarkPath = null;
if (isset($_FILES['watermark']) && $_FILES['watermark']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = 'uploads/watermarks';
    if (!file_exists('../' . $uploadDir)) {
        mkdir('../' . $uploadDir, 0777, true);
    }
    
    $fileExtension = pathinfo($_FILES['watermark']['name'], PATHINFO_EXTENSION);
    $fileName = uniqid() . '_' . time() . '.' . $fileExtension;
    $uploadPath = '../' . $uploadDir . '/' . $fileName;
    
    if (move_uploaded_file($_FILES['watermark']['tmp_name'], $uploadPath)) {
        $watermarkPath = $uploadDir . '/' . $fileName;
    }
}

// Create or update channel customization
$stmt = $conn->prepare("SELECT id FROM channel_customization WHERE user_id = ?");
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();
$exists = $result->num_rows > 0;
$stmt->close();

if ($exists) {
    // Update existing customization
    if ($bannerPath && $watermarkPath) {
        $stmt = $conn->prepare("UPDATE channel_customization SET banner = ?, watermark = ?, links = ? WHERE user_id = ?");
        $stmt->bind_param("sssi", $bannerPath, $watermarkPath, $links, $userId);
    } elseif ($bannerPath) {
        $stmt = $conn->prepare("UPDATE channel_customization SET banner = ?, links = ? WHERE user_id = ?");
        $stmt->bind_param("ssi", $bannerPath, $links, $userId);
    } elseif ($watermarkPath) {
        $stmt = $conn->prepare("UPDATE channel_customization SET watermark = ?, links = ? WHERE user_id = ?");
        $stmt->bind_param("ssi", $watermarkPath, $links, $userId);
    } else {
        $stmt = $conn->prepare("UPDATE channel_customization SET links = ? WHERE user_id = ?");
        $stmt->bind_param("si", $links, $userId);
    }
} else {
    // Insert new customization
    $banner = $bannerPath ?? '';
    $watermark = $watermarkPath ?? '';
    $stmt = $conn->prepare("INSERT INTO channel_customization (user_id, banner, watermark, links) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("isss", $userId, $banner, $watermark, $links);
}

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Canal atualizado com sucesso']);
} else {
    echo json_encode(['success' => false, 'message' => 'Erro ao atualizar personalização: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
