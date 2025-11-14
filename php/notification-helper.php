<?php
session_start();
require_once 'config.php';

// Função helper para criar notificações
function createNotification($user_id, $type, $title, $message, $link = null, $icon = null, $related_user_id = null, $related_video_id = null, $related_comment_id = null) {
    $conn = getDBConnection();
    
    $stmt = $conn->prepare("
        INSERT INTO notifications (user_id, type, title, message, link, icon, related_user_id, related_video_id, related_comment_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->bind_param("isssssiis", $user_id, $type, $title, $message, $link, $icon, $related_user_id, $related_video_id, $related_comment_id);
    $stmt->execute();
    
    $stmt->close();
    $conn->close();
    
    return true;
}

// Exemplos de uso:
// createNotification($user_id, 'video_upload', 'Novo vídeo!', 'TechBrasil postou: Como fazer X', 'watch.html?v=123', 'fa-video');
// createNotification($user_id, 'comment_reply', 'Nova resposta', 'João Silva respondeu seu comentário', 'watch.html?v=123#comment-456', 'fa-comment', $replier_id);
// createNotification($user_id, 'milestone', 'Marco atingido!', '🎉 Seu vídeo atingiu 1.000 views!', 'watch.html?v=123', 'fa-trophy', null, $video_id);
