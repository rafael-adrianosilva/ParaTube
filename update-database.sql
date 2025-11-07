-- Script para atualizar o banco de dados com os novos campos
-- Execute este script se você já tem o banco criado

USE paratube;

-- Adicionar campo profile_image e bio na tabela users (se não existir)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_image VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT NULL;

-- Garantir que a tabela videos tem o campo thumbnail
ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS thumbnail VARCHAR(255) DEFAULT NULL;

-- Atualizar dados de exemplo com timestamps mais recentes
UPDATE videos SET created_at = DATE_SUB(NOW(), INTERVAL 2 DAY) WHERE id = 1;
UPDATE videos SET created_at = DATE_SUB(NOW(), INTERVAL 5 DAY) WHERE id = 2;
UPDATE videos SET created_at = DATE_SUB(NOW(), INTERVAL 7 DAY) WHERE id = 3;
UPDATE videos SET created_at = DATE_SUB(NOW(), INTERVAL 3 DAY) WHERE id = 4;

SELECT 'Database atualizado com sucesso!' as status;
