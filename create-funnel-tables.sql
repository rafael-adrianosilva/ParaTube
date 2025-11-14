-- Funnel Analysis Tables
-- Track user journey through conversion funnels

-- Table for defining funnel steps
CREATE TABLE IF NOT EXISTS funnel_definitions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    funnel_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_funnel (user_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for funnel steps
CREATE TABLE IF NOT EXISTS funnel_steps (
    id INT PRIMARY KEY AUTO_INCREMENT,
    funnel_id INT NOT NULL,
    step_order INT NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    step_event VARCHAR(50) NOT NULL, -- 'impression', 'click', 'view', 'engagement', 'subscribe', 'conversion'
    required_duration INT DEFAULT NULL, -- minimum duration in seconds (for video viewing)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (funnel_id) REFERENCES funnel_definitions(id) ON DELETE CASCADE,
    INDEX idx_funnel_order (funnel_id, step_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for tracking user progress through funnels
CREATE TABLE IF NOT EXISTS funnel_events (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    funnel_id INT NOT NULL,
    step_id INT NOT NULL,
    user_id INT DEFAULT NULL, -- NULL for anonymous users
    session_id VARCHAR(64) NOT NULL, -- track anonymous sessions
    video_id INT DEFAULT NULL,
    event_data JSON DEFAULT NULL, -- store additional event data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (funnel_id) REFERENCES funnel_definitions(id) ON DELETE CASCADE,
    FOREIGN KEY (step_id) REFERENCES funnel_steps(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE SET NULL,
    INDEX idx_funnel_session (funnel_id, session_id, created_at),
    INDEX idx_funnel_user (funnel_id, user_id),
    INDEX idx_step_time (step_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for aggregated funnel statistics (for faster queries)
CREATE TABLE IF NOT EXISTS funnel_stats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    funnel_id INT NOT NULL,
    date DATE NOT NULL,
    step_1_count INT DEFAULT 0,
    step_2_count INT DEFAULT 0,
    step_3_count INT DEFAULT 0,
    step_4_count INT DEFAULT 0,
    step_5_count INT DEFAULT 0,
    step_6_count INT DEFAULT 0,
    step_7_count INT DEFAULT 0,
    step_8_count INT DEFAULT 0,
    completion_count INT DEFAULT 0,
    avg_completion_time INT DEFAULT NULL, -- average time to complete funnel in seconds
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (funnel_id) REFERENCES funnel_definitions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_funnel_date (funnel_id, date),
    INDEX idx_funnel_date (funnel_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default funnel templates

-- 1. Video Engagement Funnel
INSERT INTO funnel_definitions (user_id, funnel_name, description) VALUES
(1, 'Funil de Engajamento de Vídeo', 'Acompanha a jornada desde a impressão até a inscrição');

SET @funnel_id = LAST_INSERT_ID();

INSERT INTO funnel_steps (funnel_id, step_order, step_name, step_event) VALUES
(@funnel_id, 1, 'Impressão', 'impression'),
(@funnel_id, 2, 'Clique', 'click'),
(@funnel_id, 3, 'Início da Visualização', 'view_start'),
(@funnel_id, 4, 'Assistiu 25%', 'view_25'),
(@funnel_id, 5, 'Assistiu 50%', 'view_50'),
(@funnel_id, 6, 'Assistiu 75%', 'view_75'),
(@funnel_id, 7, 'Visualização Completa', 'view_complete'),
(@funnel_id, 8, 'Inscrição', 'subscribe');

-- 2. Content Discovery Funnel
INSERT INTO funnel_definitions (user_id, funnel_name, description) VALUES
(1, 'Funil de Descoberta de Conteúdo', 'Da homepage até a visualização completa');

SET @funnel_id = LAST_INSERT_ID();

INSERT INTO funnel_steps (funnel_id, step_order, step_name, step_event) VALUES
(@funnel_id, 1, 'Visita Homepage', 'homepage_visit'),
(@funnel_id, 2, 'Pesquisa/Browse', 'search_browse'),
(@funnel_id, 3, 'Clique no Vídeo', 'video_click'),
(@funnel_id, 4, 'Início da Visualização', 'view_start'),
(@funnel_id, 5, 'Visualização Completa', 'view_complete');

-- 3. Subscription Funnel
INSERT INTO funnel_definitions (user_id, funnel_name, description) VALUES
(1, 'Funil de Inscrição', 'Caminho do visitante até se tornar inscrito');

SET @funnel_id = LAST_INSERT_ID();

INSERT INTO funnel_steps (funnel_id, step_order, step_name, step_event) VALUES
(@funnel_id, 1, 'Primeira Visualização', 'first_view'),
(@funnel_id, 2, 'Segunda Visualização', 'second_view'),
(@funnel_id, 3, 'Visita ao Canal', 'channel_visit'),
(@funnel_id, 4, 'Inscrição', 'subscribe');

-- 4. Monetization Funnel
INSERT INTO funnel_definitions (user_id, funnel_name, description) VALUES
(1, 'Funil de Monetização', 'Da impressão de anúncio até a conversão');

SET @funnel_id = LAST_INSERT_ID();

INSERT INTO funnel_steps (funnel_id, step_order, step_name, step_event) VALUES
(@funnel_id, 1, 'Impressão de Anúncio', 'ad_impression'),
(@funnel_id, 2, 'Visualização de Anúncio', 'ad_view'),
(@funnel_id, 3, 'Clique no Anúncio', 'ad_click'),
(@funnel_id, 4, 'Conversão', 'ad_conversion');

-- Note: Replace user_id = 1 with actual user IDs or remove default funnels
-- These are just templates that users can customize
