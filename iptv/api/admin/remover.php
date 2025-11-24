<?php
// iptv/api/admin/remover.php
require_once __DIR__ . '/../../database/config.php';
require_once __DIR__ . '/../../utils/functions.php';

// Protegido: Apenas administradores podem acessar
requireAdmin();
requirePost();

$tmdbId = filter_var($_POST['tmdb_id'] ?? null, FILTER_VALIDATE_INT);

if (!$tmdbId) {
    jsonResponse(['error' => 'ID do TMDB inválido'], 400);
}

try {
    $pdo = getDbConnection();
    
    // Deletar o registro do catálogo
    $stmt = $pdo->prepare('DELETE FROM catalogo_curado WHERE tmdb_id = ?');
    $stmt->execute([$tmdbId]);

    if ($stmt->rowCount() === 0) {
        jsonResponse(['error' => 'Conteúdo não encontrado no catálogo'], 404);
    }

    jsonResponse([
        'success' => true,
        'message' => 'Conteúdo removido do catálogo'
    ]);

} catch (Exception $e) {
    error_log("Erro ao remover conteúdo: " . $e->getMessage());
    jsonResponse(['error' => 'Erro ao remover conteúdo'], 500);
}