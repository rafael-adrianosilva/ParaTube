-- Analytics Alerts System
CREATE TABLE IF NOT EXISTS analytics_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    video_id INT NULL,
    alert_type ENUM('views_spike', 'views_drop', 'ctr_low', 'engagement_drop', 'traffic_spike', 'negative_feedback', 'milestone_reached') NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    threshold_value DECIMAL(10,2) NOT NULL,
    comparison_operator ENUM('>', '<', '>=', '<=', '=') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    notification_enabled BOOLEAN DEFAULT TRUE,
    email_enabled BOOLEAN DEFAULT FALSE,
    last_triggered TIMESTAMP NULL,
    trigger_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    INDEX idx_user_active (user_id, is_active),
    INDEX idx_alert_type (alert_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS alert_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alert_id INT NOT NULL,
    video_id INT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    message TEXT NOT NULL,
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (alert_id) REFERENCES analytics_alerts(id) ON DELETE CASCADE,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    INDEX idx_alert_triggered (alert_id, triggered_at),
    INDEX idx_read_status (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
