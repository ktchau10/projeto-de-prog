<?php
require_once __DIR__ . '/../../database/config.php';
require_once __DIR__ . '/../../utils/functions.php';

requireAuth();

$tmdbMovieId = filter_var($_GET['tmdb_movie_id'] ?? null, FILTER_VALIDATE_INT);

if (!$tmdbMovieId) {
    jsonResponse(['error' => 'ID do filme inválido'], 400);
}

try {
    $pdo = getDbConnection();
    
    $stmt = $pdo->prepare('
        SELECT COUNT(*) > 0 as favoritado
        FROM favoritos 
        WHERE usuario_id = ? AND tmdb_movie_id = ?
    ');
    $stmt->execute([$_SESSION['user_id'], $tmdbMovieId]);
    
    $resultado = $stmt->fetch();

    jsonResponse([
        'success' => true,
        'favoritado' => (bool) $resultado['favoritado']
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    jsonResponse(['error' => 'Erro ao verificar status do favorito'], 500);
}
