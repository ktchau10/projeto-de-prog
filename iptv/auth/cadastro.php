<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/../database/config.php';
require_once __DIR__ . '/../utils/functions.php';

requirePost();

// Receber e sanitizar dados
$nome = sanitizeInput($_POST['nome'] ?? '');
$email = sanitizeInput($_POST['email'] ?? '');
$senha = $_POST['senha'] ?? '';

// Validações
if (empty($nome) || empty($email) || empty($senha)) {
    jsonResponse(['error' => 'Todos os campos são obrigatórios'], 400);
}

if (!validateEmail($email)) {
    jsonResponse(['error' => 'E-mail inválido'], 400);
}

if (!validatePassword($senha)) {
    jsonResponse(['error' => 'A senha deve ter no mínimo 8 caracteres, uma letra e um número'], 400);
}

try {
    error_log("Tentando conectar ao banco...");
    $pdo = getDbConnection();
    error_log("Conexão estabelecida com sucesso!");

    // Verificar se o email já existe
    error_log("Verificando email: " . $email);
    $stmt = $pdo->prepare('SELECT id FROM usuarios WHERE email = ?');
    $stmt->execute([$email]);
    
    if ($stmt->fetch()) {
        error_log("Email já cadastrado: " . $email);
        jsonResponse(['error' => 'Este e-mail já está cadastrado'], 409);
    }

    // Criar hash da senha
    error_log("Criando hash da senha...");
    $senhaHash = password_hash($senha, PASSWORD_DEFAULT);

    // Inserir novo usuário (data_cadastro usa valor padrão do banco)
    $stmt = $pdo->prepare('INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)');
    $stmt->execute([$nome, $email, $senhaHash]);

    jsonResponse([
        'success' => true,
        'message' => 'Cadastro realizado com sucesso'
    ]);

} catch (Exception $e) {
    error_log('Cadastro erro: ' . $e->getMessage());
    jsonResponse(['error' => 'Erro ao realizar cadastro: ' . $e->getMessage()], 500);
}
