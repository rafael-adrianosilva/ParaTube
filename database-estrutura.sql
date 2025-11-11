-- ====================================
-- ESTRUTURA DO BANCO DE DADOS - PARATUBE
-- ====================================
-- Execute este script no phpMyAdmin para garantir que todas as tabelas existem

-- Criar banco de dados (se não existir)
CREATE DATABASE IF NOT EXISTS paratube DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE paratube;

-- ====================================
-- TABELA: users
-- ====================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    bio TEXT DEFAULT NULL,
    profile_image VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- TABELA: videos
-- ====================================
CREATE TABLE IF NOT EXISTS videos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    videoUrl VARCHAR(255) NOT NULL,
    thumbnail VARCHAR(255) DEFAULT NULL,
    duration VARCHAR(20) DEFAULT '0:00',
    views INT DEFAULT 0,
    likes INT DEFAULT 0,
    dislikes INT DEFAULT 0,
    visibility ENUM('public', 'unlisted', 'private') DEFAULT 'public',
    category VARCHAR(50) DEFAULT 'outros',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_visibility (visibility),
    INDEX idx_created_at (created_at),
    INDEX idx_views (views)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- TABELA: subscriptions
-- ====================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT 'ID do usuário que está se inscrevendo',
    channel_id INT NOT NULL COMMENT 'ID do canal no qual está se inscrevendo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (channel_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_subscription (user_id, channel_id),
    INDEX idx_user_id (user_id),
    INDEX idx_channel_id (channel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- TABELA: channel_customization
-- ====================================
CREATE TABLE IF NOT EXISTS channel_customization (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    banner VARCHAR(255) DEFAULT NULL COMMENT 'Caminho para imagem de banner',
    watermark VARCHAR(255) DEFAULT NULL COMMENT 'Caminho para marca d\'água',
    links TEXT DEFAULT NULL COMMENT 'JSON com links do canal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_customization (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- TABELA: comments
-- ====================================
CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    video_id INT NOT NULL,
    user_id INT NOT NULL,
    text TEXT NOT NULL,
    likes INT DEFAULT 0,
    dislikes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_video_id (video_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- TABELA: reactions
-- ====================================
CREATE TABLE IF NOT EXISTS reactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    video_id INT NOT NULL,
    reaction ENUM('like', 'dislike', 'none') DEFAULT 'none',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_video_reaction (user_id, video_id),
    INDEX idx_video_id (video_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- INSERIR DADOS DE TESTE (OPCIONAL)
-- ====================================

-- Usuário de teste (senha: test123)
INSERT IGNORE INTO users (id, username, email, password, bio) VALUES
(1, 'CodeMaster', 'codemaster@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Desenvolvedor e criador de conteúdo de programação'),
(2, 'WebDevPro', 'webdev@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Expert em desenvolvimento web'),
(3, 'TechGuru', 'techguru@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Especialista em tecnologia e inovação');

-- Vídeos de teste
INSERT IGNORE INTO videos (id, user_id, title, description, videoUrl, thumbnail, duration, views, likes, visibility) VALUES
(1, 1, 'Tutorial Completo de JavaScript', 'Aprenda JavaScript do zero ao avançado', 'uploads/videos/sample1.mp4', 'https://via.placeholder.com/320x180/667eea/ffffff?text=JS+Tutorial', '15:30', 125000, 12500, 'public'),
(2, 1, 'CSS Grid Layout Explicado', 'Domine CSS Grid em 20 minutos', 'uploads/videos/sample2.mp4', 'https://via.placeholder.com/320x180/764ba2/ffffff?text=CSS+Grid', '20:15', 98000, 9800, 'public'),
(3, 2, 'React Hooks na Prática', 'Como usar hooks do React', 'uploads/videos/sample3.mp4', 'https://via.placeholder.com/320x180/f093fb/ffffff?text=React', '25:45', 156000, 15600, 'public'),
(4, 1, 'JavaScript Tips', 'Dicas rápidas de JavaScript', 'uploads/videos/short1.mp4', 'https://via.placeholder.com/200x355/4facfe/ffffff?text=Short', '0:45', 45000, 4500, 'public'),
(5, 2, 'CSS Flexbox', 'Flexbox em 1 minuto', 'uploads/videos/short2.mp4', 'https://via.placeholder.com/200x355/00f2fe/ffffff?text=Flexbox', '0:55', 67000, 6700, 'public');

-- Inscrições de teste
INSERT IGNORE INTO subscriptions (user_id, channel_id) VALUES
(1, 2), -- CodeMaster inscrito no WebDevPro
(2, 1), -- WebDevPro inscrito no CodeMaster
(3, 1), -- TechGuru inscrito no CodeMaster
(3, 2); -- TechGuru inscrito no WebDevPro

-- Comentários de teste
INSERT IGNORE INTO comments (video_id, user_id, text, likes) VALUES
(1, 2, 'Excelente tutorial! Muito bem explicado.', 145),
(1, 3, 'Parabéns pelo conteúdo! Ajudou muito.', 89),
(2, 1, 'CSS Grid é incrível! Obrigado por compartilhar.', 67),
(3, 1, 'React Hooks mudaram minha vida de dev!', 234);

-- ====================================
-- VERIFICAR ESTRUTURA
-- ====================================

-- Mostrar todas as tabelas
SHOW TABLES;

-- Contar registros
SELECT 'users' as tabela, COUNT(*) as registros FROM users
UNION ALL
SELECT 'videos', COUNT(*) FROM videos
UNION ALL
SELECT 'subscriptions', COUNT(*) FROM subscriptions
UNION ALL
SELECT 'channel_customization', COUNT(*) FROM channel_customization
UNION ALL
SELECT 'comments', COUNT(*) FROM comments
UNION ALL
SELECT 'reactions', COUNT(*) FROM reactions;

-- ====================================
-- QUERIES ÚTEIS PARA DEBUG
-- ====================================

-- Ver todas as inscrições
-- SELECT u1.username as inscrito, u2.username as canal, s.created_at
-- FROM subscriptions s
-- JOIN users u1 ON s.user_id = u1.id
-- JOIN users u2 ON s.channel_id = u2.id
-- ORDER BY s.created_at DESC;

-- Ver vídeos com dados do autor
-- SELECT v.id, v.title, u.username, v.views, v.likes, v.created_at
-- FROM videos v
-- JOIN users u ON v.user_id = u.id
-- ORDER BY v.created_at DESC;

-- Ver personalizações de canal
-- SELECT u.username, c.banner, c.watermark, c.links
-- FROM channel_customization c
-- JOIN users u ON c.user_id = u.id;

-- ====================================
-- FIM DO SCRIPT
-- ====================================
