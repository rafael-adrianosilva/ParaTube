-- Tabela para armazenar eventos de seek/jump no player (heatmap)
CREATE TABLE IF NOT EXISTS video_heatmap (
    id INT PRIMARY KEY AUTO_INCREMENT,
    video_id INT NOT NULL,
    timestamp_position INT NOT NULL COMMENT 'Posição no vídeo em segundos',
    event_type ENUM('seek_to', 'skip_from', 'rewind_to', 'replay') DEFAULT 'seek_to',
    user_id INT NULL COMMENT 'NULL para usuários não logados',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_video (video_id),
    INDEX idx_timestamp (timestamp_position),
    INDEX idx_created (created_at),
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela agregada para performance (calculada periodicamente)
CREATE TABLE IF NOT EXISTS video_heatmap_aggregated (
    id INT PRIMARY KEY AUTO_INCREMENT,
    video_id INT NOT NULL,
    timestamp_bucket INT NOT NULL COMMENT 'Bucket de 5 segundos (0, 5, 10, 15...)',
    seek_count INT DEFAULT 0,
    skip_count INT DEFAULT 0 COMMENT 'Quantas vezes pularam DESTE ponto',
    rewind_count INT DEFAULT 0,
    replay_count INT DEFAULT 0,
    total_interactions INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_bucket (video_id, timestamp_bucket),
    INDEX idx_video (video_id),
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
