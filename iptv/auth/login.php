<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/../database/config.php';
require_once __DIR__ . '/../utils/functions.php';

requirePost();

// Receber e sanitizar dados
$email = sanitizeInput($_POST['email'] ?? '');
$senha = $_POST['senha'] ?? '';

// Validações
if (empty($email) || empty($senha)) {
    jsonResponse(['error' => 'E-mail e senha são obrigatórios'], 400);
}

try {
    $pdo = getDbConnection();

    // 1. Buscar usuário pelo email, INCLUINDO is_admin
    $stmt = $pdo->prepare('SELECT id, nome, email, senha_hash, is_admin FROM usuarios WHERE email = ?');
    $stmt->execute([$email]);
    $usuario = $stmt->fetch();

    if (!$usuario) {
        jsonResponse(['error' => 'E-mail ou senha inválidos'], 401);
    }

    // 2. Verificar senha
    if (!password_verify($senha, $usuario['senha_hash'])) {
        jsonResponse(['error' => 'E-mail ou senha inválidos'], 401);
    }

    // 3. Iniciar sessão e salvar o status de admin
    session_start();
    $_SESSION['user_id'] = $usuario['id'];
    $_SESSION['user_name'] = $usuario['nome'];
    $_SESSION['is_admin'] = (bool) $usuario['is_admin']; // Salva o status BOOLEANO

    // 4. Retornar a resposta JSON, INCLUINDO o status is_admin
    jsonResponse([
        'success' => true,
        'user' => [
            'id' => $usuario['id'],
            'nome' => $usuario['nome'],
            'email' => $email,
            'is_admin' => $_SESSION['is_admin'] // O JS LERÁ ESTE VALOR
        ]
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    jsonResponse(['error' => 'Erro ao realizar login'], 500);
}