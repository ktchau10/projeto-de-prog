<?php
require_once __DIR__ . '/../../database/config.php';
require_once __DIR__ . '/../../utils/functions.php';

requireAuth();
requirePost();

$tmdbMovieId = filter_var($_POST['tmdb_movie_id'] ?? null, FILTER_VALIDATE_INT);

if (!$tmdbMovieId) {
    jsonResponse(['error' => 'ID do filme inválido'], 400);
}

try {
    $pdo = getDbConnection();
    
    // Verificar se já está favoritado
    $stmt = $pdo->prepare('SELECT id FROM favoritos WHERE usuario_id = ? AND tmdb_movie_id = ?');
    $stmt->execute([$_SESSION['user_id'], $tmdbMovieId]);
    
    if ($stmt->fetch()) {
        jsonResponse(['error' => 'Filme já está nos favoritos'], 409);
    }

    // Adicionar aos favoritos
    $stmt = $pdo->prepare('INSERT INTO favoritos (usuario_id, tmdb_movie_id) VALUES (?, ?)');
    $stmt->execute([$_SESSION['user_id'], $tmdbMovieId]);

    jsonResponse([
        'success' => true,
        'message' => 'Filme adicionado aos favoritos'
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    jsonResponse(['error' => 'Erro ao adicionar favorito'], 500);
}
