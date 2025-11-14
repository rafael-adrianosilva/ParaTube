-- Adicionar colunas para features de comentários
ALTER TABLE comments 
ADD COLUMN is_pinned TINYINT(1) DEFAULT 0,
ADD COLUMN is_hearted TINYINT(1) DEFAULT 0,
ADD COLUMN edited_at TIMESTAMP NULL;

-- Criar índice para comentários fixados
CREATE INDEX idx_is_pinned ON comments(is_pinned);
