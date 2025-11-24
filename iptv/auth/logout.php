<?php
// O script de logout não precisa incluir functions.php se não usar jsonResponse() ou outra função de lá.
// No entanto, é bom mantê-lo limpo para evitar erros.
// require_once __DIR__ . '/../utils/functions.php'; 

// 1. Inicia a sessão se já não estiver iniciada
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// 2. Destruir a sessão (logout)
session_unset(); // Remove todas as variáveis de sessão
session_destroy(); // Destrói os dados da sessão

// 3. Redirecionar o usuário para a página de login.
// O caminho '../login.html' é relativo a 'iptv/auth/'.
header('Location: ../login.html');
exit(); // Garante que o script pare de ser executado imediatamente após o redirecionamento
?>