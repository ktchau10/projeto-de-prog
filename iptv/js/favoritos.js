// Configurações do TMDB (mesmas do main.js e details.js)
const TMDB_API_KEY = '2c19bf5eb981d886122e44a78fed935d';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';


/**
 * Busca os detalhes de um filme específico no TMDB.
 */
async function fetchMovieDetails(movieId) {
    try {
        const response = await fetch(
            `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=pt-BR`
        );
        if (!response.ok) {
            throw new Error(`Falha ao buscar detalhes do filme ID: ${movieId}`);
        }
        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}

/**
 * Renderiza um card de filme no carrossel.
 */
function renderMovieCard(movie, carouselElement) {
    if (!movie) return;

    const movieCard = document.createElement('div');
    movieCard.className = 'movie-card';
    movieCard.dataset.movieId = movie.id;

    const posterPath = movie.poster_path
        ? `${TMDB_IMAGE_BASE_URL}/w300${movie.poster_path}`
        : 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=450';

    movieCard.innerHTML = `
        <img src="${posterPath}" alt="${movie.title}" loading="lazy">
        <h3>${movie.title}</h3>
        <div class="movie-info">
            <span class="rating">
                <i class="fas fa-star"></i>
                ${movie.vote_average.toFixed(1)}
            </span>
            <span class="year">${movie.release_date?.split('-')[0] || 'N/A'}</span>
        </div>
        <button class="details-button" data-movie-id="${movie.id}">Ver detalhes</button>
    `;

    // Adiciona o listener para o botão de detalhes
    movieCard.querySelector('.details-button').addEventListener('click', () => {
        window.location.href = `movie-details.html?id=${movie.id}`;
    });

    carouselElement.appendChild(movieCard);
}

/**
 * Função principal: busca a lista de IDs favoritos da nossa API
 * e depois busca os detalhes de cada um no TMDB.
 */
/**
 * Função principal: busca a lista de IDs favoritos da nossa API
 * e depois busca os detalhes de cada um no TMDB.
 */
async function loadFavoriteMovies() {
    
    // 1. Define o carousel PRIMEIRO
    const carousel = document.getElementById('favorites-list');

    // 2. Verifica se ele existe (importante!)
    if (!carousel) {
        console.error("Elemento #favorites-list não foi encontrado!");
        return; 
    }

    // 3. AGORA podes usá-lo
    carousel.innerHTML = '<div class="loading">Carregando favoritos...</div>';

    try {
        // 1. Buscar a lista de IDs da nossa API PHP
        const response = await fetch('api/favoritos/listar.php');
        
        if (!response.ok) {
            if(response.status === 401) {
                // Se não estiver logado, redireciona
                window.location.href = 'login.html';
                return;
            }
            throw new Error('Falha ao buscar a lista de favoritos.');
        }

        const data = await response.json();

        if (data.success && data.favoritos.length > 0) {
            carousel.innerHTML = ''; // Limpa o "carregando"
            
            // 2. Criar um array de "promessas" para buscar detalhes de todos os filmes
            const moviePromises = data.favoritos.map(movieId => fetchMovieDetails(movieId));
            
            // 3. Aguardar todas as buscas terminarem
            const movies = await Promise.all(moviePromises);
            
            // 4. Renderizar cada filme
            movies.forEach(movie => renderMovieCard(movie, carousel));

        } else if (data.favoritos.length === 0) {
            carousel.innerHTML = '<div class="error">Você ainda não adicionou nenhum filme aos favoritos.</div>';
        } else {
            throw new Error(data.error || 'Erro desconhecido ao listar favoritos.');
        }

    } catch (error) {
        console.error('Erro:', error);
        carousel.innerHTML = '<div class="error">Erro ao carregar seus favoritos. Tente novamente mais tarde.</div>';
    }
}

// Inicia o processo quando a página carregar
document.addEventListener('DOMContentLoaded', loadFavoriteMovies);