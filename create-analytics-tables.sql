-- Tabela para tracking de impressões e cliques (CTR)
CREATE TABLE IF NOT EXISTS video_impressions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    video_id INT NOT NULL,
    user_id INT NULL COMMENT 'NULL para não logados',
    impression_type ENUM('view', 'click', 'thumbnail_view') DEFAULT 'view',
    source_page VARCHAR(100) NULL COMMENT 'index, trending, search, channel, watch',
    referrer VARCHAR(500) NULL,
    device_type ENUM('desktop', 'mobile', 'tablet') DEFAULT 'desktop',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_video (video_id),
    INDEX idx_type (impression_type),
    INDEX idx_date (created_at),
    INDEX idx_source (source_page),
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela agregada de CTR (calculada periodicamente)
CREATE TABLE IF NOT EXISTS video_ctr_stats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    video_id INT NOT NULL,
    date DATE NOT NULL,
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    ctr_percentage DECIMAL(5,2) DEFAULT 0.00,
    avg_view_duration INT DEFAULT 0 COMMENT 'Em segundos',
    UNIQUE KEY unique_date (video_id, date),
    INDEX idx_video (video_id),
    INDEX idx_date (date),
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela para traffic sources
CREATE TABLE IF NOT EXISTS traffic_sources (
    id INT PRIMARY KEY AUTO_INCREMENT,
    video_id INT NOT NULL,
    source_type ENUM('direct', 'search', 'external', 'suggested', 'playlist', 'notification', 'social') DEFAULT 'direct',
    referrer_domain VARCHAR(255) NULL,
    utm_source VARCHAR(100) NULL,
    utm_medium VARCHAR(100) NULL,
    utm_campaign VARCHAR(100) NULL,
    views_count INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_video (video_id),
    INDEX idx_source (source_type),
    INDEX idx_date (created_at),
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
