-- Custom Dashboards Tables
-- Allows users to create personalized dashboard layouts

CREATE TABLE IF NOT EXISTS dashboard_configs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    dashboard_name VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT 0,
    layout_config JSON NOT NULL, -- stores widget positions and sizes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_default (user_id, is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dashboard_widgets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    dashboard_id INT NOT NULL,
    widget_type VARCHAR(50) NOT NULL, -- 'metric_card', 'line_chart', 'pie_chart', 'table', 'heatmap', etc.
    widget_title VARCHAR(100) NOT NULL,
    widget_config JSON NOT NULL, -- stores widget-specific settings (data source, filters, etc.)
    position_x INT NOT NULL DEFAULT 0,
    position_y INT NOT NULL DEFAULT 0,
    width INT NOT NULL DEFAULT 4, -- grid columns (1-12)
    height INT NOT NULL DEFAULT 3, -- grid rows
    is_visible BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dashboard_id) REFERENCES dashboard_configs(id) ON DELETE CASCADE,
    INDEX idx_dashboard_position (dashboard_id, position_y, position_x)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default dashboard templates

-- Default Dashboard for new users
INSERT INTO dashboard_configs (user_id, dashboard_name, is_default, layout_config) VALUES
(1, 'Visão Geral', 1, '{"grid_columns": 12, "grid_gap": 20, "theme": "light"}');

SET @dashboard_id = LAST_INSERT_ID();

-- Add default widgets
INSERT INTO dashboard_widgets (dashboard_id, widget_type, widget_title, widget_config, position_x, position_y, width, height) VALUES
-- Row 1: Main metrics
(@dashboard_id, 'metric_card', 'Total de Visualizações', '{"metric": "total_views", "icon": "eye", "color": "#065fd4"}', 0, 0, 3, 2),
(@dashboard_id, 'metric_card', 'Inscritos', '{"metric": "subscribers", "icon": "users", "color": "#e91e63"}', 3, 0, 3, 2),
(@dashboard_id, 'metric_card', 'Tempo de Exibição', '{"metric": "watch_time", "icon": "clock", "color": "#ff9800"}', 6, 0, 3, 2),
(@dashboard_id, 'metric_card', 'Receita Total', '{"metric": "total_revenue", "icon": "dollar-sign", "color": "#4caf50"}', 9, 0, 3, 2),

-- Row 2: Charts
(@dashboard_id, 'line_chart', 'Visualizações nos Últimos 30 Dias', '{"metric": "daily_views", "period": 30, "show_comparison": true}', 0, 2, 8, 4),
(@dashboard_id, 'pie_chart', 'Fontes de Tráfego', '{"metric": "traffic_sources", "top_n": 5}', 8, 2, 4, 4),

-- Row 3: Tables and lists
(@dashboard_id, 'table', 'Top 10 Vídeos', '{"metric": "top_videos", "sort_by": "views", "limit": 10}', 0, 6, 6, 4),
(@dashboard_id, 'list', 'Últimos Comentários', '{"metric": "recent_comments", "limit": 5}', 6, 6, 6, 4);

-- Performance Dashboard Template
INSERT INTO dashboard_configs (user_id, dashboard_name, is_default, layout_config) VALUES
(1, 'Performance', 0, '{"grid_columns": 12, "grid_gap": 20, "theme": "light"}');

SET @dashboard_id = LAST_INSERT_ID();

INSERT INTO dashboard_widgets (dashboard_id, widget_type, widget_title, widget_config, position_x, position_y, width, height) VALUES
(@dashboard_id, 'line_chart', 'CTR ao Longo do Tempo', '{"metric": "ctr_trend", "period": 30}', 0, 0, 6, 4),
(@dashboard_id, 'line_chart', 'Taxa de Retenção', '{"metric": "retention_rate", "period": 30}', 6, 0, 6, 4),
(@dashboard_id, 'bar_chart', 'Visualizações por Dispositivo', '{"metric": "device_breakdown"}', 0, 4, 6, 4),
(@dashboard_id, 'heatmap', 'Mapa de Calor de Engajamento', '{"metric": "engagement_heatmap"}', 6, 4, 6, 4);

-- Revenue Dashboard Template
INSERT INTO dashboard_configs (user_id, dashboard_name, is_default, layout_config) VALUES
(1, 'Monetização', 0, '{"grid_columns": 12, "grid_gap": 20, "theme": "light"}');

SET @dashboard_id = LAST_INSERT_ID();

INSERT INTO dashboard_widgets (dashboard_id, widget_type, widget_title, widget_config, position_x, position_y, width, height) VALUES
(@dashboard_id, 'metric_card', 'Receita do Mês', '{"metric": "monthly_revenue", "icon": "dollar-sign", "color": "#4caf50"}', 0, 0, 3, 2),
(@dashboard_id, 'metric_card', 'RPM Médio', '{"metric": "avg_rpm", "icon": "trending-up", "color": "#2196f3"}', 3, 0, 3, 2),
(@dashboard_id, 'metric_card', 'CPM Médio', '{"metric": "avg_cpm", "icon": "chart-line", "color": "#ff9800"}', 6, 0, 3, 2),
(@dashboard_id, 'metric_card', 'Taxa de Crescimento', '{"metric": "revenue_growth", "icon": "arrow-up", "color": "#e91e63"}', 9, 0, 3, 2),
(@dashboard_id, 'line_chart', 'Receita Diária', '{"metric": "daily_revenue", "period": 30}', 0, 2, 8, 4),
(@dashboard_id, 'pie_chart', 'Receita por Fonte', '{"metric": "revenue_by_source"}', 8, 2, 4, 4),
(@dashboard_id, 'table', 'Vídeos Mais Rentáveis', '{"metric": "top_earning_videos", "limit": 10}', 0, 6, 12, 4);

-- Note: Replace user_id = 1 with actual user IDs when users create accounts
