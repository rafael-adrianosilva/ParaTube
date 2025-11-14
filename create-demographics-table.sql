-- Demographics Tables
CREATE TABLE IF NOT EXISTS viewer_demographics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    video_id INT NOT NULL,
    user_id INT NULL,
    session_id VARCHAR(100) NULL,
    country VARCHAR(100) NULL,
    city VARCHAR(100) NULL,
    language VARCHAR(10) NULL,
    timezone VARCHAR(50) NULL,
    age_range ENUM('13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+', 'unknown') DEFAULT 'unknown',
    gender ENUM('male', 'female', 'other', 'unknown') DEFAULT 'unknown',
    device_type VARCHAR(50),
    browser VARCHAR(50),
    os VARCHAR(50),
    screen_resolution VARCHAR(20),
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_video_demographics (video_id, country, age_range, gender),
    INDEX idx_viewed_at (viewed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
