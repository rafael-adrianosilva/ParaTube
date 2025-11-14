-- Corrigir conquistas existentes (tipos errados)
UPDATE achievements SET requirement_type = 'likes' WHERE id = 7;  -- Primeira Curtida
UPDATE achievements SET requirement_type = 'likes' WHERE id = 8;  -- Amado pela Comunidade
UPDATE achievements SET requirement_type = 'comments' WHERE id = 9;  -- Primeiro Comentário (já está correto)
UPDATE achievements SET requirement_type = 'comments' WHERE id = 10; -- Conversador (já está correto)

-- Remover conquista duplicada "Maratonista" se existir
DELETE FROM achievements WHERE id = 11 AND name = 'Maratonista' AND requirement_type = 'views';

-- Adicionar 10 novas conquistas incríveis
INSERT IGNORE INTO achievements (id, name, description, icon, requirement_type, requirement_value, badge_color) VALUES
(11, 'Maratonista', 'Assista 20 vídeos diferentes', '📺', 'watch_history', 20, '#607D8B'),
(12, 'Viciado em Vídeos', 'Assista 50 vídeos diferentes', '🍿', 'watch_history', 50, '#795548'),
(13, 'Cinéfilo', 'Assista 100 vídeos diferentes', '🎬', 'watch_history', 100, '#3F51B5'),
(14, 'Famoso', 'Alcance 10.000 visualizações totais', '🌟', 'views', 10000, '#FFD700'),
(15, 'Celebridade', 'Alcance 100.000 visualizações totais', '👑', 'views', 100000, '#FF00FF'),
(16, 'Influenciador', 'Consiga 100 inscritos', '💎', 'subscribers', 100, '#00CED1'),
(17, 'Criador Veterano', 'Faça upload de 25 vídeos', '🏆', 'uploads', 25, '#FFB300'),
(18, 'Produtor Profissional', 'Faça upload de 50 vídeos', '🎯', 'uploads', 50, '#D32F2F'),
(19, 'Membro Veterano', 'Seja membro há 30 dias', '⏰', 'membership_days', 30, '#4CAF50'),
(20, 'Membro Lendário', 'Seja membro há 365 dias', '🔥', 'membership_days', 365, '#FF4500'),
(21, 'Conversas Intensas', 'Receba 100 comentários totais', '💭', 'comments', 100, '#9C27B0'),
(22, 'Ídolo da Plataforma', 'Receba 200 curtidas totais', '⭐', 'likes', 200, '#FF6B6B');
