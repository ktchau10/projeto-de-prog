// TMDB API Configuration (mantendo consistência com main.js)
const TMDB_API_KEY = '2c19bf5eb981d886122e44a78fed935d';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Elements
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const movieInfo = document.getElementById('movie-info');
const trailerContainer = document.getElementById('trailer-container');
let currentMovieId = null;
let isFavorited = false;
const favoriteBtn = document.getElementById('add-favorite-btn');


// Get movie ID from URL
function getMovieIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    currentMovieId = urlParams.get('id'); // Armazena o ID globalmente
    return currentMovieId;
}

// Format runtime to hours and minutes
function formatRuntime(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
}

// Format date to Brazilian format
function formatDate(dateString) {
    if (!dateString) return 'Data não disponível';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

// Fetch movie details
async function fetchMovieDetails(movieId) {
    const response = await fetch(
        `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=pt-BR`
    );

    if (!response.ok) {
        throw new Error('Falha ao carregar detalhes do filme');
    }

    return response.json();
}

async function checkFavoriteStatus(movieId) {
    if (!movieId || !favoriteBtn) return;

    try {
        const response = await fetch(`api/favoritos/verificar.php?tmdb_movie_id=${movieId}`);
        
        if (response.status === 401) {
            // Se não estiver logado, desabilita o botão
            favoriteBtn.disabled = true;
            favoriteBtn.innerHTML = '<i class="fas fa-lock"></i> Faça login para favoritar';
            return;
        }

        if (!response.ok) {
           throw new Error('Erro ao verificar status.');
        }
        
        const data = await response.json();
        if (data.success) {
            isFavorited = data.favoritado;
            updateFavoriteButtonUI();
        }
    } catch (error) {
        console.error('Erro ao verificar favoritos:', error);
        favoriteBtn.style.display = 'none'; // Esconde se houver erro
    }
}

// Atualiza a aparência do botão
function updateFavoriteButtonUI() {
    if (!favoriteBtn) return;
    
    if (isFavorited) {
        favoriteBtn.innerHTML = '<i class="fas fa-check"></i> Na sua lista';
        favoriteBtn.classList.remove('secondary-button');
        favoriteBtn.classList.add('primary-button'); // Muda cor para vermelho
    } else {
        favoriteBtn.innerHTML = '<i class="fas fa-heart"></i> Adicionar aos Favoritos';
        favoriteBtn.classList.remove('primary-button');
        favoriteBtn.classList.add('secondary-button'); // Muda cor para cinza
    }
}

// Adiciona ou remove o favorito
async function toggleFavorite() {
    if (!currentMovieId || !favoriteBtn) return;

    const endpoint = isFavorited ? 'api/favoritos/remover.php' : 'api/favoritos/adicionar.php';
    const formData = new FormData();
    formData.append('tmdb_movie_id', currentMovieId);

    try {
        favoriteBtn.disabled = true; // Previne cliques duplos

        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            // Inverte o status e atualiza a UI
            isFavorited = !isFavorited;
            updateFavoriteButtonUI();
        } else {
            alert('Erro ao atualizar favoritos: ' + data.error);
        }
    } catch (error) {
        console.error('Erro ao favoritar:', error);
        alert('Erro de conexão ao atualizar favoritos.');
    } finally {
        favoriteBtn.disabled = false; // Reabilita o botão
    }
}

// Fetch movie videos (trailers)
async function fetchMovieVideos(movieId) {
    const response = await fetch(
        `${TMDB_BASE_URL}/movie/${movieId}/videos?api_key=${TMDB_API_KEY}`
    );

    if (!response.ok) {
        throw new Error('Falha ao carregar vídeos do filme');
    }

    const data = await response.json();
    
    // Find the first YouTube trailer
    return data.results.find(
        video => video.site === 'YouTube' && 
        video.type === 'Trailer'
    );
}

// Fetch movie credits (cast)
async function fetchMovieCredits(movieId) {
    const response = await fetch(
        `${TMDB_BASE_URL}/movie/${movieId}/credits?api_key=${TMDB_API_KEY}&language=pt-BR`
    );

    if (!response.ok) {
        throw new Error('Falha ao carregar elenco do filme');
    }

    return response.json();
}

// Render movie details
function renderMovieDetails(movie, trailer, credits) {
    // Set backdrop
    const backdropPath = movie.backdrop_path
        ? `${TMDB_IMAGE_BASE_URL}/original${movie.backdrop_path}`
        : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3';
    
    document.getElementById('backdrop-image').style.backgroundImage = `url('${backdropPath}')`;

    // Set poster
    const posterPath = movie.poster_path
        ? `${TMDB_IMAGE_BASE_URL}/w500${movie.poster_path}`
        : 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?ixlib=rb-4.0.3';
    
    document.getElementById('poster-container').innerHTML = `
        <img src="${posterPath}" alt="${movie.title}">
    `;

    // Set basic info
    document.getElementById('movie-title').textContent = movie.title;
    document.getElementById('release-year').innerHTML = `
        <i class="far fa-calendar"></i>
        ${formatDate(movie.release_date)}
    `;
    document.getElementById('runtime').innerHTML = `
        <i class="far fa-clock"></i>
        ${formatRuntime(movie.runtime)}
    `;
    document.getElementById('rating').innerHTML = `
        <i class="fas fa-star"></i>
        ${movie.vote_average.toFixed(1)}
    `;

    // Set genres
    document.getElementById('genres').innerHTML = movie.genres
        .map(genre => `<span class="genre-tag">${genre.name}</span>`)
        .join('');

    // Set overview
    document.getElementById('overview').textContent = movie.overview;

    // Set trailer if available
    if (trailer) {
        trailerContainer.style.display = 'block';
        trailerContainer.querySelector('.trailer-wrapper').innerHTML = `
            <iframe
                src="https://www.youtube.com/embed/${trailer.key}"
                title="Trailer de ${movie.title}"
                allowfullscreen>
            </iframe>
        `;
    }

    // Set cast
    if (credits && credits.cast) {
        const castList = document.getElementById('cast-list');
        castList.innerHTML = credits.cast
            .slice(0, 8) // Limit to 8 cast members
            .map(actor => {
                const profilePath = actor.profile_path
                    ? `${TMDB_IMAGE_BASE_URL}/w185${actor.profile_path}`
                    : 'https://images.unsplash.com/photo-1535704882196-765e5fc62a53?ixlib=rb-4.0.3&auto=format&fit=crop&w=185&h=278';
                
                return `
                    <div class="cast-card">
                        <img src="${profilePath}" alt="${actor.name}" class="cast-image">
                        <div class="cast-info">
                            <h3>${actor.name}</h3>
                            <p>${actor.character}</p>
                        </div>
                    </div>
                `;
            })
            .join('');
    }
}

// Initialize page
async function initializeMovieDetails() {
    const movieId = getMovieIdFromUrl(); // (Já deve estar definindo o currentMovieId)

    if (!movieId) {
        errorState.style.display = 'flex';
        loadingState.style.display = 'none';
        return;
    }

    try {
        loadingState.style.display = 'flex';
        errorState.style.display = 'none';
        movieInfo.style.display = 'none';

        // Fetch all data in parallel
        const [movieDetails, movieVideos, movieCredits] = await Promise.all([
            fetchMovieDetails(movieId),
            fetchMovieVideos(movieId),
            fetchMovieCredits(movieId)
        ]);

        // Render the data
        renderMovieDetails(movieDetails, movieVideos, movieCredits);

        // Após renderizar, verifica o status do favorito
        await checkFavoriteStatus(movieId);

        // Show content
        loadingState.style.display = 'none';
        movieInfo.style.display = 'block';

    } catch (error) {
        console.error('Error loading movie details:', error);
        loadingState.style.display = 'none';
        errorState.style.display = 'flex';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeMovieDetails();

    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', toggleFavorite);
    }

    // Adiciona listener ao botão de trailer (que estava faltando)
    const watchTrailerBtn = document.getElementById('watch-trailer-btn');
    if (watchTrailerBtn) {
        watchTrailerBtn.addEventListener('click', () => {
            // Rola suavemente até a seção do trailer
            trailerContainer.scrollIntoView({ behavior: 'smooth' });
        });
    }
    // -------------------
});
