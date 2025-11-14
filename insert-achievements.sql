-- Inserir conquistas padrão se não existirem
INSERT IGNORE INTO achievements (id, name, description, icon, requirement_type, requirement_value, badge_color) VALUES
(1, 'Primeiro Vídeo', 'Faça upload do seu primeiro vídeo', '🎬', 'uploads', 1, '#4CAF50'),
(2, 'Produtor Iniciante', 'Faça upload de 5 vídeos', '📹', 'uploads', 5, '#2196F3'),
(3, 'Criador de Conteúdo', 'Faça upload de 10 vídeos', '🎥', 'uploads', 10, '#9C27B0'),
(4, 'Primeira Visualização', 'Receba sua primeira visualização', '👁', 'views', 1, '#FF9800'),
(5, 'Popular', 'Alcance 100 visualizações totais', '⭐', 'views', 100, '#F44336'),
(6, 'Viral', 'Alcance 1000 visualizações totais', '🔥', 'views', 1000, '#E91E63'),
(7, 'Primeira Curtida', 'Receba sua primeira curtida', '👍', 'comments', 1, '#00BCD4'),
(8, 'Amado pela Comunidade', 'Receba 50 curtidas totais', '❤', 'comments', 50, '#FF5722'),
(9, 'Primeiro Comentário', 'Receba seu primeiro comentário', '💬', 'comments', 1, '#8BC34A'),
(10, 'Conversador', 'Receba 25 comentários totais', '�', 'comments', 25, '#FFC107'),
(11, 'Maratonista', 'Assista 20 vídeos', '📺', 'views', 20, '#607D8B');
