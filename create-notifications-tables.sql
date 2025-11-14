-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type ENUM(
        'video_upload',
        'live_start',
        'comment_reply',
        'comment_like',
        'mention',
        'new_subscriber',
        'milestone',
        'comment_pinned',
        'comment_hearted',
        'achievement',
        'video_processed',
        'video_moderated',
        'copyright_claim',
        'community_warning',
        'backup_complete'
    ) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(500),
    icon VARCHAR(50),
    is_read TINYINT(1) DEFAULT 0,
    related_user_id INT,
    related_video_id INT,
    related_comment_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_read (is_read),
    INDEX idx_type (type),
    INDEX idx_created (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (related_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (related_video_id) REFERENCES videos(id) ON DELETE CASCADE,
    FOREIGN KEY (related_comment_id) REFERENCES comments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de preferências de notificação
CREATE TABLE IF NOT EXISTS notification_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    video_upload TINYINT(1) DEFAULT 1,
    live_start TINYINT(1) DEFAULT 1,
    comment_reply TINYINT(1) DEFAULT 1,
    comment_like TINYINT(1) DEFAULT 1,
    mention TINYINT(1) DEFAULT 1,
    new_subscriber TINYINT(1) DEFAULT 1,
    milestone TINYINT(1) DEFAULT 1,
    comment_pinned TINYINT(1) DEFAULT 1,
    comment_hearted TINYINT(1) DEFAULT 1,
    achievement TINYINT(1) DEFAULT 1,
    email_notifications TINYINT(1) DEFAULT 0,
    push_notifications TINYINT(1) DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
