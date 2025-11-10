// TMDB API Configuration
const TMDB_API_KEY = '2c19bf5eb981d886122e44a78fed935d';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Header scroll effect
const header = document.querySelector('.header');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Mobile menu toggle
const menuToggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('.menu');

menuToggle.addEventListener('click', () => {
    menu.classList.toggle('active');
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
            // Close mobile menu if open
            menu.classList.remove('active');
        }
    });
});

// Função genérica para criar card (evita repetição)
function createMediaCard(item, mediaType) {
    const movieCard = document.createElement('div');
    movieCard.className = 'movie-card';
    movieCard.dataset.movieId = item.id;
    movieCard.dataset.mediaType = mediaType; // <-- NOVO: 'movie' ou 'tv'

    const posterPath = item.poster_path
        ? `${TMDB_IMAGE_BASE_URL}/w300${item.poster_path}`
        : 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=450';

    // Séries usam 'name', filmes usam 'title'
    const title = item.title || item.name;
    // Séries usam 'first_air_date', filmes usam 'release_date'
    const releaseDate = item.release_date || item.first_air_date;
    const year = releaseDate ? releaseDate.split('-')[0] : 'N/A';

    movieCard.innerHTML = `
        <img src="${posterPath}" alt="${title}" loading="lazy">
        <h3>${title}</h3>
        <div class="movie-info">
            <span class="rating">
                <i class="fas fa-star"></i>
                ${item.vote_average.toFixed(1)}
            </span>
            <span class="year">${year}</span>
        </div>
        <button class="details-button">Ver detalhes</button>
    `;
    return movieCard;
}

// Fetch featured MOVIES from TMDB API
async function fetchFeaturedMovies() {
    try {
        const moviesCarousel = document.querySelector('#featured .movies-carousel');
        moviesCarousel.innerHTML = '<div class="loading">Carregando...</div>'; 

        const response = await fetch(
            `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`
        );
        if (!response.ok) throw new Error('Falha ao carregar os filmes');

        const data = await response.json();
        moviesCarousel.innerHTML = ''; // Clear loading

        data.results.forEach(movie => {
            const movieCard = createMediaCard(movie, 'movie'); // Passa 'movie'
            moviesCarousel.appendChild(movieCard);
        });

        attachDetailsButtonListeners(); // Re-anexa os listeners

    } catch (error) {
        console.error('Erro ao carregar filmes:', error);
        // ... (código de erro)
    }
}

// --- NOVO: Fetch featured TV SHOWS from TMDB API ---
async function fetchFeaturedTvShows() {
    try {
        const tvCarousel = document.querySelector('#tv-carousel'); // Target o novo ID
        if (!tvCarousel) return; // Se o HTML não foi atualizado, sai
        
        tvCarousel.innerHTML = '<div class="loading">Carregando...</div>'; 

        const response = await fetch(
            `${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`
        );
        if (!response.ok) throw new Error('Falha ao carregar as séries');

        const data = await response.json();
        tvCarousel.innerHTML = ''; // Clear loading

        data.results.forEach(show => {
            const tvCard = createMediaCard(show, 'tv'); // Passa 'tv'
            tvCarousel.appendChild(tvCard);
        });

        attachDetailsButtonListeners(); // Re-anexa os listeners

    } catch (error) {
        console.error('Erro ao carregar séries:', error);
        const tvCarousel = document.querySelector('#tv-carousel');
        tvCarousel.innerHTML = `
            <div class="error">
                <p>Ops! Algo deu errado ao carregar as séries.</p>
                <button onclick="fetchFeaturedTvShows()">Tentar novamente</button>
            </div>
        `;
    }
}

// --- ATUALIZADO: Implement details button functionality ---
function attachDetailsButtonListeners() {
    // Seleciona todos os botões de detalhes em AMBOS os carrosséis
    const detailButtons = document.querySelectorAll('.movies-carousel .details-button');
    
    detailButtons.forEach(button => {
        // Remove listener antigo para evitar duplicação
        button.replaceWith(button.cloneNode(true));
    });

    // Seleciona os botões clonados e adiciona o novo listener
    document.querySelectorAll('.movies-carousel .details-button').forEach(button => {
        button.addEventListener('click', function() {
            const movieCard = this.closest('.movie-card');
            const movieId = movieCard.dataset.movieId;
            const mediaType = movieCard.dataset.mediaType; // <-- Pega o tipo
            
            if (movieId && mediaType) {
                // Constrói o link com o tipo
                window.location.href = `movie-details.html?id=${movieId}&type=${mediaType}`;
            }
        });
    });
}

// Initialize features when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    fetchFeaturedMovies();
    fetchFeaturedTvShows(); // <-- Chama a nova função
});