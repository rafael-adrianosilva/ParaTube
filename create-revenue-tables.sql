-- Revenue Tracking Tables
CREATE TABLE IF NOT EXISTS revenue_sources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    source_name VARCHAR(100) NOT NULL UNIQUE,
    source_type ENUM('ads', 'membership', 'super_chat', 'merchandise', 'sponsorship', 'affiliate', 'other') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS video_revenue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    video_id INT NOT NULL,
    revenue_source_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'BRL',
    transaction_date DATE NOT NULL,
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    cpm DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Cost per mille (1000 impressions)',
    rpm DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Revenue per mille',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    FOREIGN KEY (revenue_source_id) REFERENCES revenue_sources(id) ON DELETE CASCADE,
    INDEX idx_video_date (video_id, transaction_date),
    INDEX idx_source_date (revenue_source_id, transaction_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS channel_revenue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    revenue_source_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'BRL',
    transaction_date DATE NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (revenue_source_id) REFERENCES revenue_sources(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, transaction_date),
    INDEX idx_source_date (revenue_source_id, transaction_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default revenue sources
INSERT INTO revenue_sources (source_name, source_type) VALUES
('Google AdSense', 'ads'),
('Membros do Canal', 'membership'),
('Super Chat', 'super_chat'),
('Super Stickers', 'super_chat'),
('Loja de Merchandise', 'merchandise'),
('Patrocínios', 'sponsorship'),
('Links de Afiliados', 'affiliate'),
('Outros', 'other');
