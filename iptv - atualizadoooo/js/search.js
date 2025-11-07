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
 * Renders movie cards in the carousel
 * @param {Array} results - The array of movie results from the API
 */
function renderMovieResults(results) {
    console.log("Renderizando resultados. Recebidos:", results.length);

    // Relaxed filter (poster only)
    let filtered = results.filter(movie => movie.poster_path);
    console.log("Filmes filtrados (com pôster):", filtered.length);


    if (!filtered.length) {
        // Updated error message to be more generic
        moviesCarousel.innerHTML = '<div class="error">Nenhum filme relevante foi encontrado.</div>';
        return;
    }

    moviesCarousel.innerHTML = ''; // Clear loading/error

    filtered.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';
        movieCard.dataset.movieId = movie.id;
        const posterPath = `${TMDB_IMAGE_BASE_URL}/w300${movie.poster_path}`;

        movieCard.innerHTML = `
            <img src="${posterPath}" alt="${movie.title}" loading="lazy">
            <h3>${movie.title}</h3>
            <div class="movie-info">
                <span class="rating">
                    <i class="fas fa-star"></i>
                    ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}
                </span>
                <span class="year">${movie.release_date?.split('-')[0] || 'N/A'}</span>
            </div>
            <button class="details-button" data-movie-id="${movie.id}">Ver detalhes</button>
        `;
        moviesCarousel.appendChild(movieCard);
    });

    attachDetailsButtonListeners();
}

/**
 * --- UPDATED FUNCTION ---
 * Dynamically fetches movies, fetching multiple pages of results
 * @param {string} query - The search term
 */
async function fetchSearchResults(query) {
    moviesCarousel.innerHTML = '<div class="loading">Buscando...</div>';

    try {
        // 1. Fetch the FIRST page to find out the total number of pages
        const urlPage1 = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}&page=1`;
        const responsePage1 = await fetch(urlPage1);
        
        if (!responsePage1.ok) {
            throw new Error('Falha ao buscar a primeira página de resultados');
        }
        
        const dataPage1 = await responsePage1.json();
        const totalPages = dataPage1.total_pages;
        let allResults = dataPage1.results; // Start with page 1 results

        console.log(`Total de páginas detectadas: ${totalPages}`);

        if (totalPages > 1) {
            const pagePromises = [];
            console.log(`Iniciando busca por páginas de 2 a ${totalPages}...`);
            
            // 2. Create promises for the remaining pages (from 2 to totalPages)
            for (let page = 2; page <= totalPages; page++) {
                const url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}&page=${page}`;
                pagePromises.push(
                    fetch(url).then(res => {
                        // If a page fails, it doesn't break the entire search
                        if (!res.ok) console.warn(`Falha ao carregar página ${page}`);
                        return res.ok ? res.json() : null; // Return null on failure
                    })
                );
            }

            // 3. Wait for all searches
            const remainingPageData = await Promise.all(pagePromises);

            // 4. Combine the results
            remainingPageData.forEach(pageData => {
                if (pageData && pageData.results) {
                    allResults = allResults.concat(pageData.results);
                }
            });
        }

        console.log("Total de resultados combinados:", allResults.length);
        // 5. Render the combined array
        renderMovieResults(allResults);

    } catch (error) {
        console.error("Erro ao buscar filmes:", error);
        moviesCarousel.innerHTML = '<div class="error">Erro ao buscar filmes.</div>';
    }
}

/**
 * Fetches movies by genre ID
 * @param {string} genreId - The genre ID
 */
async function fetchGenreResults(genreId) {
    moviesCarousel.innerHTML = '<div class="loading">Carregando categoria...</div>';

    try {
        // The genre search can also be expanded, but for now let's focus on the text search.
        // To expand, the same pagination logic above would need to be applied.
        const url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=pt-BR&with_genres=${genreId}&sort_by=popularity.desc&page=1`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Falha ao buscar gênero');

        const data = await response.json();
        renderMovieResults(data.results);
    } catch (error) {
        console.error("Erro na busca por GÊNERO:", error);
        moviesCarousel.innerHTML = '<div class="error">Erro ao carregar filmes da categoria.</div>';
    }
}

/**
 * Adds listeners to the "Ver detalhes" buttons
 */
function attachDetailsButtonListeners() {
    const detailButtons = document.querySelectorAll('.movies-carousel .details-button');
    detailButtons.forEach(button => {
        button.addEventListener('click', function() {
            const movieCard = this.closest('.movie-card');
            const movieId = movieCard.dataset.movieId;
            if (movieId) {
                window.location.href = `movie-details.html?id=${movieId}`;
            }
        });
    });
}

// --- MAIN LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    moviesCarousel = document.getElementById('search-movies-carousel');
    searchTitle = document.getElementById('search-title'); // This element does not exist in your search.html, but we keep the logic.

    if (!moviesCarousel) {
        console.error('Elemento do carousel (search-movies-carousel) não encontrado.');
        return;
    }

    const query = getQueryParam('q');
    const genreId = getQueryParam('genre_id');
    const genreName = getQueryParam('genre_name');

    if (query) {
        // 1. Text search (now calls the updated function)
        if (searchTitle) searchTitle.textContent = `Resultados para "${query}"`;
        fetchSearchResults(query);

    } else if (genreId && genreName) {
        // 2. Genre search
        if (searchTitle) searchTitle.textContent = `Categoria: ${genreName}`;
        fetchGenreResults(genreId);

    } else {
        // 3. No parameters
        if (searchTitle) searchTitle.textContent = 'Busca Inválida';
        moviesCarousel.innerHTML = '<div class="error">Nenhum termo de busca ou categoria informado.</div>';
    }
});
