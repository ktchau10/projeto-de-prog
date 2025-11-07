// TMDB API Configuration
const TMDB_API_KEY = '2c19bf5eb981d886122e44a78fed935d'; // Substitua pela sua chave real
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

// Fetch featured movies from TMDB API
async function fetchFeaturedMovies() {
    try {
        const moviesCarousel = document.querySelector('.movies-carousel');
        moviesCarousel.innerHTML = '<div class="loading">Carregando...</div>'; // Loading state

        const response = await fetch(
            `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`
        );

        if (!response.ok) {
            throw new Error('Falha ao carregar os filmes');
        }

        const data = await response.json();
        moviesCarousel.innerHTML = ''; // Clear loading state

        data.results.forEach(movie => {
            const movieCard = document.createElement('div');
            movieCard.className = 'movie-card';
            movieCard.dataset.movieId = movie.id; // Add movie ID for future reference

            const posterPath = movie.poster_path
                ? `${TMDB_IMAGE_BASE_URL}/w300${movie.poster_path}`
                : 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&h=450'; // Fallback image for movies without posters

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
            
            moviesCarousel.appendChild(movieCard);
        });

        // After rendering, attach event listeners to detail buttons
        attachDetailsButtonListeners();

    } catch (error) {
        console.error('Erro ao carregar filmes:', error);
        const moviesCarousel = document.querySelector('.movies-carousel');
        moviesCarousel.innerHTML = `
            <div class="error">
                <p>Ops! Algo deu errado ao carregar os filmes.</p>
                <button onclick="fetchFeaturedMovies()">Tentar novamente</button>
            </div>
        `;
    }
}

// Implement details button functionality
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

// Initialize features when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    fetchFeaturedMovies();
    // A função de busca foi removida daqui para permitir o redirecionamento
});