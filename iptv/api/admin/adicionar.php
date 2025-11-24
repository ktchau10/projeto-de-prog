<?php
// NOVO: Desativa a exibição de erros para garantir que apenas JSON seja retornado
error_reporting(E_ALL);
ini_set('display_errors', 0); // <--- Adicionar esta linha

// iptv/api/admin/adicionar.php
require_once __DIR__ . '/../../database/config.php';
require_once __DIR__ . '/../../utils/functions.php';

// Protegido: Apenas administradores podem acessar
requireAdmin();
requirePost();

// Configurações da API TMDB
$TMDB_API_KEY = '2c19bf5eb981d886122e44a78fed935d'; // Da iptv/js/main.js
$TMDB_BASE_URL = 'https://api.themoviedb.org/3';
$LANGUAGE = 'pt-BR';

$tmdbId = filter_var($_POST['tmdb_id'] ?? null, FILTER_VALIDATE_INT);
$mediaType = sanitizeInput($_POST['media_type'] ?? '');

if (!$tmdbId || !in_array($mediaType, ['movie', 'tv'])) {
    jsonResponse(['error' => 'ID do TMDB ou Tipo de Mídia inválido'], 400);
}

try {
    // 1. Buscar detalhes no TMDB
    $url = "$TMDB_BASE_URL/$mediaType/$tmdbId?api_key=$TMDB_API_KEY&language=$LANGUAGE";
    $tmdbResponse = @file_get_contents($url);
    
    if ($tmdbResponse === FALSE) {
        throw new Exception("Falha ao buscar detalhes na API TMDB.");
    }

    $data = json_decode($tmdbResponse, true);

    // Extrair dados essenciais para salvar
    $titulo = $data['title'] ?? $data['name'];
    $posterPath = $data['poster_path'];
    $voteAverage = $data['vote_average'];
    $releaseDate = $data['release_date'] ?? $data['first_air_date'];
    $releaseYear = $releaseDate ? explode('-', $releaseDate)[0] : null;

    if (!$titulo || !$posterPath) {
        jsonResponse(['error' => 'Conteúdo TMDB incompleto (sem título ou poster)'], 400);
    }
    
    // 2. Inserir na base de dados local (catalogo_curado)
    $pdo = getDbConnection();

    // ON DUPLICATE KEY UPDATE: Atualiza se já existir, para garantir que os metadados estejam frescos
    $stmt = $pdo->prepare('
        INSERT INTO catalogo_curado 
            (tmdb_id, media_type, titulo, poster_path, vote_average, release_year) 
        VALUES 
            (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            titulo = VALUES(titulo),
            poster_path = VALUES(poster_path),
            vote_average = VALUES(vote_average),
            release_year = VALUES(release_year)
    ');
    $stmt->execute([
        $tmdbId, 
        $mediaType, 
        $titulo, 
        $posterPath, 
        $voteAverage, 
        $releaseYear
    ]);

    jsonResponse([
        'success' => true,
        'message' => 'Conteúdo adicionado/atualizado com sucesso no catálogo!',
        'id' => $tmdbId
    ]);

} catch (Exception $e) {
    error_log("Erro ao adicionar conteúdo: " . $e->getMessage());
    jsonResponse(['error' => 'Erro interno ao processar a requisição'], 500);
}