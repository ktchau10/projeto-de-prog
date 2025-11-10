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
    error_log("Login - Tentando conectar ao banco...");
    $pdo = getDbConnection();
    error_log("Login - Conexão estabelecida com sucesso!");

    // Buscar usuário pelo email
    error_log("Login - Buscando usuário com email: " . $email);
    $stmt = $pdo->prepare('SELECT id, nome, email, senha_hash FROM usuarios WHERE email = ?');
    $stmt->execute([$email]);
    $usuario = $stmt->fetch();

    if (!$usuario) {
        error_log("Login - Usuário não encontrado: " . $email);
        jsonResponse(['error' => 'E-mail ou senha inválidos'], 401);
    }

    error_log("Login - Verificando senha para usuário: " . $usuario['nome']);
    if (!password_verify($senha, $usuario['senha_hash'])) {
        error_log("Login - Senha inválida para usuário: " . $usuario['nome']);
        jsonResponse(['error' => 'E-mail ou senha inválidos'], 401);
    }

    // Iniciar sessão
    session_start();
    $_SESSION['user_id'] = $usuario['id'];
    $_SESSION['user_name'] = $usuario['nome'];

    jsonResponse([
        'success' => true,
        'user' => [
            'id' => $usuario['id'],
            'nome' => $usuario['nome'],
            'email' => $email
        ]
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    jsonResponse(['error' => 'Erro ao realizar login'], 500);
}