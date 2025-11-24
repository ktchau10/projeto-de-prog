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
    
    $stmt = $pdo->prepare('DELETE FROM favoritos WHERE usuario_id = ? AND tmdb_movie_id = ?');
    $stmt->execute([$_SESSION['user_id'], $tmdbMovieId]);

    if ($stmt->rowCount() === 0) {
        jsonResponse(['error' => 'Filme não encontrado nos favoritos'], 404);
    }

    jsonResponse([
        'success' => true,
        'message' => 'Filme removido dos favoritos'
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    jsonResponse(['error' => 'Erro ao remover favorito'], 500);
}
