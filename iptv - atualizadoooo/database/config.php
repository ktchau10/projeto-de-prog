<?php
// Configurações do banco de dados
define('DB_HOST', 'localhost');
define('DB_NAME', 'cinestream');
define('DB_USER', 'root');         // Altere conforme suas configurações
define('DB_PASSWORD', '');         // Altere conforme suas configurações
define('DB_CHARSET', 'utf8mb4');

// Função para obter conexão com o banco de dados
function getDbConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ];
        
        return new PDO($dsn, DB_USER, DB_PASSWORD, $options);
    } catch (PDOException $e) {
        // Log do erro (em produção, não exibir o erro diretamente)
        error_log("Erro de conexão com o banco: " . $e->getMessage());
        throw new Exception("Erro ao conectar ao banco de dados");
    }
}

// Função para testar a conexão
function testDbConnection() {
    try {
        $conn = getDbConnection();
        return "Conexão com o banco de dados estabelecida com sucesso!";
    } catch (Exception $e) {
        return "Erro: " . $e->getMessage();
    }
}
