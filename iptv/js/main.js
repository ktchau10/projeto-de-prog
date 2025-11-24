// iptv/js/main.js (Versão Limpa)

// Configurações e Helpers Mantidos
const TMDB_API_KEY = '2c19bf5eb981d886122e44a78fed935d';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Header scroll effect (Mantido)
const header = document.querySelector('.header');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Mobile menu toggle (Mantido)
const menuToggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('.menu');

menuToggle.addEventListener('click', () => {
    menu.classList.toggle('active');
});

// Smooth scroll for navigation links (Mantido)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
            menu.classList.remove('active');
        }
    });
});

// Função genérica para criar card (Mantida)
function createMediaCard(item, mediaType) {
    const movieCard = document.createElement('div');
    movieCard.className = 'movie-card';
    movieCard.dataset.movieId = item.id;
    movieCard.dataset.mediaType = mediaType; 

    const posterPath = item.poster_path
        ? `${TMDB_IMAGE_BASE_URL}/w300${item.poster_path}`
        : 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=450';

    const title = item.title || item.name;
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

// LÓGICA DO NOVO CATÁLOGO CENTRALIZADO
async function fetchFeaturedContent() {
    // Esta função foi reescrita e movemos a lógica de listagem para index_list.js (NOVA PÁGINA)
    // No index.html simplificado, esta função não fará nada.
    console.log("Catálogo principal movido para index_list.html. Redirecione o link do botão 'Explorar agora'.");
}

// Implement details button functionality (Mantida)
function attachDetailsButtonListeners() {
    const detailButtons = document.querySelectorAll('.movies-carousel .details-button');
    
    detailButtons.forEach(button => {
        button.replaceWith(button.cloneNode(true));
    });

    document.querySelectorAll('.movies-carousel .details-button').forEach(button => {
        button.addEventListener('click', function() {
            const movieCard = this.closest('.movie-card');
            const movieId = movieCard.dataset.movieId;
            const mediaType = movieCard.dataset.mediaType; 
            
            if (movieId && mediaType) {
                // Manter .html para compatibilidade temporária ou renomear para .php
                window.location.href = `movie-details.html?id=${movieId}&type=${mediaType}`; 
            }
        });
    });
}

// Inicialização (Agora só chama a função vazia, o conteúdo será carregado em outra página)
document.addEventListener('DOMContentLoaded', () => {
    // Nenhuma chamada automática de API aqui.
});