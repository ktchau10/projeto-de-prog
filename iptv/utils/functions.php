<?php
// Verifica se é uma requisição POST
function requirePost() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Método não permitido']);
        exit;
    }
}

// Verifica se o usuário está autenticado
function requireAuth() {
    session_start();
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Usuário não autenticado']);
        exit;
    }
}

// Função para validar e-mail
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

// Função para retornar resposta JSON
function jsonResponse($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

// Função para validar senha
function validatePassword($password) {
    // Mínimo 8 caracteres, pelo menos uma letra e um número
    return strlen($password) >= 8 && 
           preg_match('/[A-Za-z]/', $password) && 
           preg_match('/[0-9]/', $password);
}

// Função para sanitizar inputs
function sanitizeInput($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

// iptv/utils/functions.php

// ... (existing functions like requirePost, requireAuth, etc.)

// NOVO: Função para verificar se o usuário é administrador
function requireAdmin() {
    session_start();
    // Verifica se está logado E se é administrador
    if (!isset($_SESSION['user_id']) || !isset($_SESSION['is_admin']) || !$_SESSION['is_admin']) {
        http_response_code(403);
        jsonResponse(['error' => 'Acesso negado. Requer permissão de administrador.'], 403);
    }
}


