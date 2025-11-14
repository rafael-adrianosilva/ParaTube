-- A/B Testing Tables
CREATE TABLE IF NOT EXISTS ab_tests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    video_id INT NOT NULL,
    test_name VARCHAR(200) NOT NULL,
    test_type ENUM('thumbnail', 'title', 'description', 'tags') NOT NULL,
    variant_a TEXT NOT NULL,
    variant_b TEXT NOT NULL,
    variant_c TEXT NULL,
    status ENUM('draft', 'running', 'completed', 'cancelled') DEFAULT 'draft',
    traffic_split INT DEFAULT 50 COMMENT 'Percentage for variant B (A gets remainder)',
    start_date TIMESTAMP NULL,
    end_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    INDEX idx_user_video (user_id, video_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ab_test_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_id INT NOT NULL,
    variant ENUM('A', 'B', 'C') NOT NULL,
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    views INT DEFAULT 0,
    watch_time INT DEFAULT 0 COMMENT 'in seconds',
    likes INT DEFAULT 0,
    dislikes INT DEFAULT 0,
    comments INT DEFAULT 0,
    shares INT DEFAULT 0,
    ctr DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Click-through rate',
    engagement_rate DECIMAL(5,2) DEFAULT 0.00,
    avg_watch_time INT DEFAULT 0 COMMENT 'in seconds',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (test_id) REFERENCES ab_tests(id) ON DELETE CASCADE,
    UNIQUE KEY unique_test_variant (test_id, variant),
    INDEX idx_test_variant (test_id, variant)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ab_test_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_id INT NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    user_id INT NULL,
    assigned_variant ENUM('A', 'B', 'C') NOT NULL,
    interacted BOOLEAN DEFAULT FALSE,
    clicked BOOLEAN DEFAULT FALSE,
    viewed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_id) REFERENCES ab_tests(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_test_session (test_id, session_id),
    INDEX idx_test_variant (test_id, assigned_variant)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
