-- OMRX-56 recuperacao de senha
-- Tabela que guarda o hash dos tokens de redefinicao de senha.
-- Uso unico, com validade definida em expires_at.
-- Ao excluir um usuario, os tokens dele sao removidos (ON DELETE CASCADE).

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  token_hash CHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY user_id (user_id),
  CONSTRAINT password_reset_tokens_ibfk_1
    FOREIGN KEY (user_id) REFERENCES users (user_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;