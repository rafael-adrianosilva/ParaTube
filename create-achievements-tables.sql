-- Tabela de conquistas disponíveis
CREATE TABLE IF NOT EXISTS achievements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    requirement_type ENUM('views', 'uploads', 'subscribers', 'comments', 'membership_days') NOT NULL,
    requirement_value INT NOT NULL,
    badge_color VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de conquistas desbloqueadas pelos usuários
CREATE TABLE IF NOT EXISTS user_achievements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    achievement_id INT NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_achievement (user_id, achievement_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_achievement (achievement_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Inserir conquistas padrão
INSERT INTO achievements (name, description, icon, requirement_type, requirement_value, badge_color) VALUES
('Primeira Visualização', 'Recebeu a primeira visualizacao', 'fa-eye', 'views', 1, '#4CAF50'),
('100 Views', 'Atingiu 100 visualizacoes totais', 'fa-eye', 'views', 100, '#2196F3'),
('1K Views', 'Atingiu 1.000 visualizacoes totais', 'fa-fire', 'views', 1000, '#FF9800'),
('10K Views', 'Atingiu 10.000 visualizacoes totais', 'fa-star', 'views', 10000, '#F44336'),
('100K Views', 'Atingiu 100.000 visualizacoes totais', 'fa-trophy', 'views', 100000, '#9C27B0'),
('1M Views', 'Atingiu 1 milhão de visualizacoes!', 'fa-crown', 'views', 1000000, '#FFD700'),

('Primeiro Vídeo', 'Publicou o primeiro video', 'fa-video', 'uploads', 1, '#4CAF50'),
('10 Vídeos', 'Publicou 10 vídeos', 'fa-film', 'uploads', 10, '#2196F3'),
('50 Vídeos', 'Publicou 50 vídeos', 'fa-video', 'uploads', 50, '#FF9800'),
('100 Vídeos', 'Publicou 100 vídeos', 'fa-medal', 'uploads', 100, '#F44336'),

('Primeiro Inscrito', 'Ganhou o primeiro inscrito', 'fa-user-plus', 'subscribers', 1, '#4CAF50'),
('100 Inscritos', 'Atingiu 100 inscritos', 'fa-users', 'subscribers', 100, '#2196F3'),
('1K Inscritos', 'Atingiu 1.000 inscritos', 'fa-users', 'subscribers', 1000, '#FF9800'),
('10K Inscritos', 'Atingiu 10.000 inscritos', 'fa-star', 'subscribers', 10000, '#F44336'),
('100K Inscritos', 'Atingiu 100.000 inscritos', 'fa-trophy', 'subscribers', 100000, '#9C27B0'),

('Membro 1 Ano', 'Completa 1 ano no ParaTube', 'fa-birthday-cake', 'membership_days', 365, '#E91E63');
