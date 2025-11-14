-- Atualizar ícones das conquistas com ícones do Font Awesome

-- Conquistas originais (já têm ícones, mas vou padronizar)
UPDATE achievements SET icon = 'fa-video' WHERE id = 1;  -- Primeiro Vídeo
UPDATE achievements SET icon = 'fa-film' WHERE id = 2;   -- Produtor Iniciante
UPDATE achievements SET icon = 'fa-camera-retro' WHERE id = 3;  -- Criador de Conteúdo
UPDATE achievements SET icon = 'fa-eye' WHERE id = 4;  -- Primeira Visualização
UPDATE achievements SET icon = 'fa-star' WHERE id = 5;  -- Popular
UPDATE achievements SET icon = 'fa-fire' WHERE id = 6;  -- Viral
UPDATE achievements SET icon = 'fa-thumbs-up' WHERE id = 7;  -- Primeira Curtida
UPDATE achievements SET icon = 'fa-heart' WHERE id = 8;  -- Amado pela Comunidade
UPDATE achievements SET icon = 'fa-comment' WHERE id = 9;  -- Primeiro Comentário
UPDATE achievements SET icon = 'fa-comments' WHERE id = 10;  -- Conversador

-- Novas conquistas (adicionar ícones)
UPDATE achievements SET icon = 'fa-tv' WHERE id = 11;  -- Maratonista
UPDATE achievements SET icon = 'fa-popcorn' WHERE id = 12;  -- Viciado em Vídeos
UPDATE achievements SET icon = 'fa-film' WHERE id = 13;  -- Cinéfilo
UPDATE achievements SET icon = 'fa-trophy' WHERE id = 14;  -- Famoso
UPDATE achievements SET icon = 'fa-crown' WHERE id = 15;  -- Celebridade
UPDATE achievements SET icon = 'fa-gem' WHERE id = 16;  -- Influenciador
UPDATE achievements SET icon = 'fa-medal' WHERE id = 17;  -- Criador Veterano
UPDATE achievements SET icon = 'fa-bullseye' WHERE id = 18;  -- Produtor Profissional
UPDATE achievements SET icon = 'fa-clock' WHERE id = 19;  -- Membro Veterano
UPDATE achievements SET icon = 'fa-fire-flame-curved' WHERE id = 20;  -- Membro Lendário
UPDATE achievements SET icon = 'fa-message' WHERE id = 21;  -- Conversas Intensas
UPDATE achievements SET icon = 'fa-star-half-stroke' WHERE id = 22;  -- Ídolo da Plataforma
