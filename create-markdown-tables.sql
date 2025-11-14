-- Tabela para salvar templates de descrição
CREATE TABLE IF NOT EXISTS description_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    tags TEXT NULL COMMENT 'Tags sugeridas, separadas por vírgula',
    is_default TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Adicionar coluna para descrição em markdown na tabela videos (se não existir)
ALTER TABLE videos 
ADD COLUMN description_markdown TEXT NULL AFTER description,
ADD COLUMN auto_tags VARCHAR(500) NULL COMMENT 'Tags geradas automaticamente';
