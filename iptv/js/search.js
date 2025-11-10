// js/search.js

// TMDB API Configuration
const TMDB_API_KEY = '2c19bf5eb981d886122e44a78fed935d';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// --- GLOBAL VARIABLES ---
let moviesCarousel;
let searchTitle;

// --- FUNCTIONS ---

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param) || '';
}

/**
 * --- ATUALIZADO: Renderiza cards de mídia (filmes ou séries) ---
 * @param {Array} results - O array de resultados (filmes e séries misturados)
 */
function renderMovieResults(results) {
    console.log("Renderizando resultados. Recebidos:", results.length);

    // Filtra itens que não têm poster
    let filtered = results.filter(item => item.poster_path);
    console.log("Mídia filtrada (com pôster):", filtered.length);


    if (!filtered.length) {
        moviesCarousel.innerHTML = '<div class="error">Nenhum resultado relevante foi encontrado.</div>';
        return;
    }

    moviesCarousel.innerHTML = ''; // Clear loading/error

    filtered.forEach(item => {
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';
        movieCard.dataset.movieId = item.id;
        movieCard.dataset.mediaType = item.media_type; // <-- NOVO: 'movie' ou 'tv'
        
        const posterPath = `${TMDB_IMAGE_BASE_URL}/w300${item.poster_path}`;

        // Séries usam 'name', filmes usam 'title'
        const title = item.title || item.name;
        // Séries usam 'first_air_date', filmes usam 'release_date'
        const releaseDate = item.release_date || item.first_air_date;
        const year = releaseDate ? releaseDate.split('-')[0] : 'N/A';
        const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';

        movieCard.innerHTML = `
            <img src="${posterPath}" alt="${title}" loading="lazy">
            <h3>${title}</h3>
            <div class="movie-info">
                <span class="rating">
                    <i class="fas fa-star"></i>
                    ${rating}
                </span>
                <span class="year">${year}</span>
            </div>
            <button class="details-button">Ver detalhes</button>
        `;
        moviesCarousel.appendChild(movieCard);
    });

    attachDetailsButtonListeners();
}

/**
 * --- ATUALIZADO: Busca filmes E séries ---
 * @param {string} query - O termo de busca
 */
async function fetchSearchResults(query) {
    moviesCarousel.innerHTML = '<div class="loading">Buscando...</div>';

    try {
        // 1. Cria as duas promessas de busca (filmes e séries)
        const movieSearchUrl = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}&page=1`;
        const tvSearchUrl = `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}&page=1`;

        const [movieResponse, tvResponse] = await Promise.all([
            fetch(movieSearchUrl),
            fetch(tvSearchUrl)
        ]);

        if (!movieResponse.ok || !tvResponse.ok) {
            throw new Error('Falha ao buscar resultados');
        }

        const movieData = await movieResponse.json();
        const tvData = await tvResponse.json();

        // 2. Adiciona a tag 'media_type' a cada resultado
        const movieResults = movieData.results.map(item => ({
            ...item,
            media_type: 'movie'
        }));
        
        const tvResults = tvData.results.map(item => ({
            ...item,
            media_type: 'tv'
        }));

        // 3. Combina os resultados e ordena por popularidade
        let allResults = movieResults.concat(tvResults);
        allResults.sort((a, b) => b.popularity - a.popularity);

        console.log("Total de resultados combinados:", allResults.length);
        renderMovieResults(allResults);

    } catch (error) {
        console.error("Erro ao buscar mídia:", error);
        moviesCarousel.innerHTML = '<div class="error">Erro ao buscar resultados.</div>';
    }
}

/**
 * Fetches movies by genre ID (Mantido, já que categorias só busca filmes)
 * @param {string} genreId - The genre ID
 */
async function fetchGenreResults(genreId) {
    moviesCarousel.innerHTML = '<div class="loading">Carregando categoria...</div>';
    try {
        const url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=pt-BR&with_genres=${genreId}&sort_by=popularity.desc&page=1`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Falha ao buscar gênero');

        const data = await response.json();
        
        // Adiciona media_type 'movie' aos resultados de gênero
        const movieResults = data.results.map(item => ({
            ...item,
            media_type: 'movie'
        }));
        
        renderMovieResults(movieResults);
    } catch (error) {
        console.error("Erro na busca por GÊNERO:", error);
        moviesCarousel.innerHTML = '<div class="error">Erro ao carregar filmes da categoria.</div>';
    }
}

/**
 * --- ATUALIZADO: Adiciona listeners que constroem o link dinâmico ---
 */
function attachDetailsButtonListeners() {
    const detailButtons = document.querySelectorAll('.movies-carousel .details-button');
    
    detailButtons.forEach(button => {
        button.addEventListener('click', function() {
            const movieCard = this.closest('.movie-card');
            const movieId = movieCard.dataset.movieId;
            const mediaType = movieCard.dataset.mediaType; // <-- Pega o tipo
            
            if (movieId && mediaType) {
                // Constrói o link com o tipo
                window.location.href = `movie-details.html?id=${movieId}&type=${mediaType}`;
            } else {
                console.error('Não foi possível encontrar mediaType ou movieId no card');
            }
        });
    });
}

// --- MAIN LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    moviesCarousel = document.getElementById('search-movies-carousel');
    searchTitle = document.querySelector('#search-results h2'); // Pega o H2

    if (!moviesCarousel) {
        console.error('Elemento do carousel (search-movies-carousel) não encontrado.');
        return;
    }

    const query = getQueryParam('q');
    const genreId = getQueryParam('genre_id'); // (Vem do index.html, que só tem géneros de FILMES)
    const genreName = getQueryParam('genre_name');

    if (query) {
        if (searchTitle) searchTitle.textContent = `Resultados para "${query}"`;
        fetchSearchResults(query); // <-- Chama a nova função de busca mista

    } else if (genreId) {
        // A tua lógica de clique em categoria só envia ID, não o nome.
        // Vamos manter assim, mas a função de género agora adiciona &type=movie
        if (searchTitle) searchTitle.textContent = `Categoria`; // Simplificado
        fetchGenreResults(genreId);

    } else {
        if (searchTitle) searchTitle.textContent = 'Busca Inválida';
        moviesCarousel.innerHTML = '<div class="error">Nenhum termo de busca ou categoria informado.</div>';
    }
});