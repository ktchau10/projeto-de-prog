<?php
require_once __DIR__ . '/../../database/config.php';
require_once __DIR__ . '/../../utils/functions.php';

requireAuth();

try {
    $pdo = getDbConnection();
    
    $stmt = $pdo->prepare('
        SELECT tmdb_movie_id, data_favoritado 
        FROM favoritos 
        WHERE usuario_id = ? 
        ORDER BY data_favoritado DESC
    ');
    $stmt->execute([$_SESSION['user_id']]);
    
    $favoritos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Simplificar o resultado para array de IDs
    $ids = array_column($favoritos, 'tmdb_movie_id');

    jsonResponse([
        'success' => true,
        'favoritos' => $ids
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());
    jsonResponse(['error' => 'Erro ao listar favoritos'], 500);
}
