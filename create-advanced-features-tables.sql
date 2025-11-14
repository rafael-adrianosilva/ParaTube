-- ========================================
-- ADVANCED FEATURES DATABASE SCHEMA
-- ParaTube - YouTube Clone
-- ========================================

-- 1. PLAYLISTS SYSTEM
CREATE TABLE IF NOT EXISTS playlists (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    visibility ENUM('public', 'private', 'unlisted') DEFAULT 'public',
    thumbnail VARCHAR(500),
    video_count INT DEFAULT 0,
    total_duration INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_visibility (visibility)
);

CREATE TABLE IF NOT EXISTS playlist_videos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    playlist_id INT NOT NULL,
    video_id INT NOT NULL,
    position INT NOT NULL DEFAULT 0,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    UNIQUE KEY unique_playlist_video (playlist_id, video_id),
    INDEX idx_playlist_id (playlist_id),
    INDEX idx_video_id (video_id),
    INDEX idx_position (position)
);

-- 2. WATCH LATER
CREATE TABLE IF NOT EXISTS watch_later (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    video_id INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    watched TINYINT(1) DEFAULT 0,
    watched_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_video (user_id, video_id),
    INDEX idx_user_id (user_id),
    INDEX idx_watched (watched),
    INDEX idx_added_at (added_at)
);

-- 3. WATCH HISTORY (Enhanced)
CREATE TABLE IF NOT EXISTS watch_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    video_id INT NOT NULL,
    watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration_watched INT DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_video_id (video_id),
    INDEX idx_watched_at (watched_at)
);

-- 4. COMMENT FEATURES (Heart, Pin)
-- Add columns one by one (MySQL doesn't support IF NOT EXISTS in ALTER TABLE)
SET @sql = CONCAT('ALTER TABLE comments ADD COLUMN hearted TINYINT(1) DEFAULT 0');
SET @check_hearted = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'paratube' AND TABLE_NAME = 'comments' AND COLUMN_NAME = 'hearted');
SET @sql = IF(@check_hearted > 0, 'SELECT "Column hearted already exists"', @sql);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = CONCAT('ALTER TABLE comments ADD COLUMN pinned TINYINT(1) DEFAULT 0');
SET @check_pinned = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'paratube' AND TABLE_NAME = 'comments' AND COLUMN_NAME = 'pinned');
SET @sql = IF(@check_pinned > 0, 'SELECT "Column pinned already exists"', @sql);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = CONCAT('ALTER TABLE comments ADD COLUMN hearted_at TIMESTAMP NULL');
SET @check_hearted_at = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'paratube' AND TABLE_NAME = 'comments' AND COLUMN_NAME = 'hearted_at');
SET @sql = IF(@check_hearted_at > 0, 'SELECT "Column hearted_at already exists"', @sql);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = CONCAT('ALTER TABLE comments ADD COLUMN pinned_at TIMESTAMP NULL');
SET @check_pinned_at = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'paratube' AND TABLE_NAME = 'comments' AND COLUMN_NAME = 'pinned_at');
SET @sql = IF(@check_pinned_at > 0, 'SELECT "Column pinned_at already exists"', @sql);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. VIDEO QUALITY PREFERENCES
CREATE TABLE IF NOT EXISTS user_preferences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    preference_key VARCHAR(100) NOT NULL,
    preference_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_preference (user_id, preference_key),
    INDEX idx_user_id (user_id),
    INDEX idx_preference_key (preference_key)
);

-- 6. VIDEO TIMELINE HEATMAP (Most watched sections)
CREATE TABLE IF NOT EXISTS video_timeline_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    video_id INT NOT NULL,
    timestamp_seconds INT NOT NULL,
    view_count INT DEFAULT 0,
    skip_count INT DEFAULT 0,
    replay_count INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    UNIQUE KEY unique_video_timestamp (video_id, timestamp_seconds),
    INDEX idx_video_id (video_id),
    INDEX idx_timestamp (timestamp_seconds)
);

-- 7. USER ACHIEVEMENTS TABLE (achievements table already exists)
CREATE TABLE IF NOT EXISTS user_achievements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    achievement_id INT NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notified TINYINT(1) DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_achievement (user_id, achievement_id),
    INDEX idx_user_id (user_id),
    INDEX idx_unlocked_at (unlocked_at)
);

-- Insert additional achievements using existing table structure
INSERT IGNORE INTO achievements (name, description, icon, requirement_type, requirement_value, badge_color) VALUES
('Primeiro Vídeo', 'Publique seu primeiro vdeo', 'fa-video', 'uploads', 1, '#4CAF50'),
('Criador Ativo', 'Publique 10 videos', 'fa-film', 'uploads', 10, '#2196F3'),
('Produtor Pro', 'Publique 50 vdeos', 'fa-camera', 'uploads', 50, '#9C27B0'),
('100 Views', 'Alcance 100 visualizacoes', 'fa-eye', 'views', 100, '#FF9800'),
('1K Views', 'Alcance 1.000 visualizacoes', 'fa-fire', 'views', 1000, '#FF5722'),
('10K Views', 'Alcance 10.000 visualizacoes', 'fa-star', 'views', 10000, '#FFD700'),
('10 Inscritos', 'Alcance 10 inscritos', 'fa-users', 'subscribers', 10, '#00BCD4'),
('100 Inscritos', 'Alcance 100 inscritos', 'fa-trophy', 'subscribers', 100, '#8BC34A'),
('1K Inscritos', 'Alcance 1.000 inscritos', 'fa-award', 'subscribers', 1000, '#FFC107'),
('Comentarista', 'Receba 50 comentarios', 'fa-comments', 'comments', 50, '#3F51B5');

-- 8. VIDEO LOOP PREFERENCES (per user per video)
CREATE TABLE IF NOT EXISTS video_loop_state (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    video_id INT NOT NULL,
    loop_enabled TINYINT(1) DEFAULT 0,
    loop_start DECIMAL(10,2) NULL,
    loop_end DECIMAL(10,2) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_video_loop (user_id, video_id)
);

-- ========================================
-- END OF SCHEMA
-- ========================================

SELECT 'Advanced Features Tables Created Successfully!' AS Status;
