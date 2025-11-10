-- Criar banco de dados se não existir
CREATE DATABASE IF NOT EXISTS cinestream
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Usar o banco de dados
USE cinestream;

-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_email CHECK (email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Criar tabela de favoritos
CREATE TABLE IF NOT EXISTS favoritos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    tmdb_movie_id INT NOT NULL,
    data_favoritado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_favorito (usuario_id, tmdb_movie_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Criar tabela de histórico
CREATE TABLE IF NOT EXISTS historico (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    tmdb_movie_id INT NOT NULL,
    data_acesso DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    INDEX idx_usuario_data (usuario_id, data_acesso)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Criar tabela de filmes locais
CREATE TABLE IF NOT EXISTS filmes_locais (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tmdb_movie_id INT NOT NULL UNIQUE,
    video_path VARCHAR(255) NOT NULL,
    data_upload DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Adicionar índices para otimização
CREATE INDEX idx_email ON usuarios(email);
CREATE INDEX idx_tmdb_movie_id ON favoritos(tmdb_movie_id);
CREATE INDEX idx_historico_movie ON historico(tmdb_movie_id);
CREATE INDEX idx_filmes_locais_tmdb ON filmes_locais(tmdb_movie_id);

-- Comentários nas tabelas para documentação
ALTER TABLE usuarios COMMENT 'Armazena informações dos usuários cadastrados';
ALTER TABLE favoritos COMMENT 'Registra os filmes que o usuário deseja assistir em outras plataformas (lista "Assistir Depois")';
ALTER TABLE historico COMMENT 'Registra o histórico de visualização dos usuários';
ALTER TABLE filmes_locais COMMENT 'Armazena referências para filmes hospedados localmente na plataforma (seção "Assistir")';

-- Comentários nos campos da tabela filmes_locais
ALTER TABLE filmes_locais MODIFY COLUMN tmdb_movie_id INT NOT NULL UNIQUE 
    COMMENT 'ID do filme na API TMDB para obter metadados (título, pôster, sinopse)';
ALTER TABLE filmes_locais MODIFY COLUMN video_path VARCHAR(255) NOT NULL 
    COMMENT 'Caminho relativo do arquivo de vídeo no servidor';
ALTER TABLE filmes_locais MODIFY COLUMN data_upload DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP 
    COMMENT 'Data e hora do upload do filme';
