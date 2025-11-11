-- Adicionar coluna visibility se não existir
-- Executar este SQL no phpMyAdmin ou MySQL Workbench

-- Verificar se a coluna existe e adicionar se necessário
ALTER TABLE `videos` 
ADD COLUMN IF NOT EXISTS `visibility` ENUM('public', 'unlisted', 'private') DEFAULT 'public' AFTER `dislikes`;

-- Atualizar todos os vídeos existentes para serem públicos
UPDATE `videos` SET `visibility` = 'public' WHERE `visibility` IS NULL OR `visibility` = '';

-- Verificar os vídeos
SELECT id, title, user_id, visibility, views, created_at FROM videos ORDER BY created_at DESC;
