// TMDB API Configuration
const TMDB_API_KEY = '2c19bf5eb981d886122e44a78fed935d';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// --- Elementos Globais da Página ---
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const movieInfo = document.getElementById('movie-info');
const trailerContainer = document.getElementById('trailer-container');
const favoriteBtn = document.getElementById('add-favorite-btn');
const seriesDataContainer = document.getElementById('series-data');
const seasonSelect = document.getElementById('season-select');
const episodeList = document.getElementById('episode-list');
const castListEl = document.getElementById('cast-list'); // <-- Adicionado elemento do elenco

// --- Variáveis de Estado ---
let currentId = null;
let currentType = null;
let currentImdbId = null; // Para filmes
let currentTmdbId = null; // Para séries
let currentSeason = 1;
let currentEpisode = 1;
let isFavorited = false;

// ==========================================================
// 1. INICIALIZAÇÃO E ROUTING
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
    // Pega os parâmetros da URL
    const urlParams = new URLSearchParams(window.location.search);
    currentId = urlParams.get('id');
    currentType = urlParams.get('type'); // 'movie' ou 'tv'

    if (!currentId || !currentType) {
        showError();
        return;
    }

    // Decide qual função de inicialização chamar
    if (currentType === 'movie') {
        initializeMoviePage(currentId);
    } else if (currentType === 'tv') {
        initializeSeriesPage(currentId);
    } else {
        showError();
    }

    // --- Listeners dos Botões Principais (Favoritos e Trailer) ---
    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', toggleFavorite);
    }

    const watchTrailerBtn = document.getElementById('watch-trailer-btn');
    if (watchTrailerBtn) {
        watchTrailerBtn.addEventListener('click', () => {
            trailerContainer.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // --- Listener do Modal do Player (Lógica unificada) ---
    setupPlayerModalListeners();
});

// ==========================================================
// 2. LÓGICA DE FILMES (MOVIE)
// ==========================================================

async function initializeMoviePage(movieId) {
    try {
        showLoading(true);

        // --- CORRIGIDO ---
        // Busca detalhes do FILME, vídeos e créditos em paralelo
        const [movie, videoData, credits] = await Promise.all([
            fetchApi(`${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=pt-BR`),
            fetchApi(`${TMDB_BASE_URL}/movie/${movieId}/videos?api_key=${TMDB_API_KEY}`),
            fetchApi(`${TMDB_BASE_URL}/movie/${movieId}/credits?api_key=${TMDB_API_KEY}&language=pt-BR`) // <-- ADICIONADO
        ]);

        // Guarda o ID do IMDb (necessário para o player de filmes)
        currentImdbId = movie.imdb_id;

        // Renderiza os detalhes
        renderCommonDetails(movie, videoData);
        renderCast(credits.cast); // <-- ADICIONADO

        // Verifica o status de favorito
        await checkFavoriteStatus(movieId);
        showLoading(false);

    } catch (error) {
        console.error('Erro ao carregar filme:', error);
        showError();
    }
}

// ==========================================================
// 3. LÓGICA DE SÉRIES (TV)
// ==========================================================

async function initializeSeriesPage(tvId) {
    try {
        showLoading(true);
        currentTmdbId = tvId; // Guarda o ID da TV (necessário para o player de séries)

        // --- CORRIGIDO ---
        // Busca detalhes da SÉRIE, vídeos e créditos em paralelo
        const [show, videoData, credits] = await Promise.all([
            fetchApi(`${TMDB_BASE_URL}/tv/${tvId}?api_key=${TMDB_API_KEY}&language=pt-BR`),
            fetchApi(`${TMDB_BASE_URL}/tv/${tvId}/videos?api_key=${TMDB_API_KEY}`),
            fetchApi(`${TMDB_BASE_URL}/tv/${tvId}/credits?api_key=${TMDB_API_KEY}&language=pt-BR`) // <-- ADICIONADO
        ]);

        // Renderiza detalhes comuns (título, poster, etc.)
        renderCommonDetails(show, videoData);
        renderCast(credits.cast); // <-- ADICIONADO

        // --- Lógica Específica de Séries ---
        seriesDataContainer.style.display = 'block'; // Mostra a secção de séries

        // Preenche o dropdown de temporadas
        seasonSelect.innerHTML = '';
        show.seasons.forEach(season => {
            // Não mostra "Especiais" (season 0)
            if (season.season_number > 0) {
                const option = document.createElement('option');
                option.value = season.season_number;
                option.textContent = season.name;
                seasonSelect.appendChild(option);
            }
        });

        // Adiciona listener para carregar episódios quando a temporada mudar
        seasonSelect.addEventListener('change', (e) => {
            const newSeason = e.target.value;
            loadSeason(tvId, newSeason);
        });

        // Carrega a primeira temporada por defeito
        await loadSeason(tvId, 1);

        // Verifica o status de favorito
        await checkFavoriteStatus(tvId);
        showLoading(false);

    } catch (error) {
        console.error('Erro ao carregar série:', error);
        showError();
    }
}

async function loadSeason(tvId, seasonNumber) {
    try {
        currentSeason = seasonNumber; // Atualiza o estado global
        episodeList.innerHTML = '<div class="loading">Carregando episódios...</div>';

        const seasonData = await fetchApi(
            `${TMDB_BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&language=pt-BR`
        );

        renderEpisodes(seasonData.episodes);

    } catch (error) {
        console.error(`Erro ao carregar temporada ${seasonNumber}:`, error);
        episodeList.innerHTML = '<div class="error">Erro ao carregar episódios.</div>';
    }
}

function renderEpisodes(episodes) {
    episodeList.innerHTML = ''; // Limpa a lista

    if (!episodes || episodes.length === 0) {
        episodeList.innerHTML = '<div class="error">Nenhum episódio encontrado para esta temporada.</div>';
        return;
    }

    episodes.forEach((ep, index) => {
        const epCard = document.createElement('div');
        epCard.className = 'episode-card';
        epCard.dataset.epNumber = ep.episode_number;

        const poster = ep.still_path
            ? `${TMDB_IMAGE_BASE_URL}/w300${ep.still_path}`
            : 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=450'; // Fallback

        epCard.innerHTML = `
            <img src="${poster}" alt="${ep.name}">
            <div class="episode-info">
                <h4>Episódio ${ep.episode_number}: ${ep.name}</h4>
                <p>${ep.overview.substring(0, 100)}...</p>
            </div>
        `;

        // --- Listener de Seleção de Episódio ---
        epCard.addEventListener('click', () => {
            // Atualiza o estado global
            currentEpisode = ep.episode_number;

            // Remove a classe 'active' de todos os outros cartões
            episodeList.querySelectorAll('.episode-card').forEach(card => {
                card.classList.remove('active');
            });
            // Adiciona a classe 'active' ao cartão clicado
            epCard.classList.add('active');
        });

        // Seleciona o primeiro episódio por defeito
        if (index === 0) {
            epCard.classList.add('active');
            currentEpisode = ep.episode_number;
        }

        episodeList.appendChild(epCard);
    });
}

// ==========================================================
// 4. LÓGICA DO PLAYER (MODAL UNIFICADO)
// ==========================================================

function setupPlayerModalListeners() {
    const watchNowBtn = document.getElementById('watch-now-btn');
    const playerModal = document.getElementById('player-modal');
    const playerContainer = document.getElementById('player-iframe-container');
    const closeModalBtn = document.querySelector('.player-modal-close');

    if (!watchNowBtn || !playerModal || !playerContainer || !closeModalBtn) {
        console.error('Elementos do modal não encontrados');
        return;
    }

    // --- Abrir o modal ---
    watchNowBtn.addEventListener('click', () => {
        let playerUrl = '';

        if (currentType === 'movie' && currentImdbId) {
            // Constrói URL para FILME
            playerUrl = `https://superflixapi.asia/filme/${currentImdbId}#color:e50914#noEpList`;

        } else if (currentType === 'tv' && currentTmdbId) {
            // Constrói URL para SÉRIE (baseado no estado atual)
            playerUrl = `https://superflixapi.asia/serie/${currentTmdbId}/${currentSeason}/${currentEpisode}#color:e50914`;

        } else {
            alert('Não foi possível encontrar um player para este título.');
            return;
        }

        // Injeta o iframe e mostra o modal
        playerContainer.innerHTML = `
            <iframe src="${playerUrl}"
                    frameborder="0"
                    allowfullscreen>
            </iframe>`;
        playerModal.style.display = 'block';
    });

    // --- Fechar o modal (clicando no X) ---
    closeModalBtn.addEventListener('click', () => {
        playerModal.style.display = 'none';
        playerContainer.innerHTML = ''; // Limpa o iframe (importante para parar o vídeo)
    });

    // --- Fechar o modal (clicando fora da caixa) ---
    window.addEventListener('click', (event) => {
        if (event.target == playerModal) {
            playerModal.style.display = 'none';
            playerContainer.innerHTML = ''; // Limpa o iframe
        }
    });
}

// ==========================================================
// 5. FUNÇÕES COMUNS (Detalhes, Favoritos, Helpers)
// ==========================================================

// Função genérica para buscar dados
async function fetchApi(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Falha na requisição HTTP: ${response.status}`);
    }
    return response.json();
}

// Renderiza os detalhes que são comuns a filmes e séries
function renderCommonDetails(data, videoData) {
    // Título (filme usa 'title', série usa 'name')
    document.getElementById('movie-title').textContent = data.title || data.name;

    // Data (filme usa 'release_date', série usa 'first_air_date')
    const releaseDate = data.release_date || data.first_air_date;
    document.getElementById('release-year').innerHTML = `
        <i class="far fa-calendar"></i>
        ${formatDate(releaseDate)}
    `;

    // Duração (filme usa 'runtime', série não tem um equivalente simples)
    const runtimeEl = document.getElementById('runtime');
    if (data.runtime) {
        runtimeEl.style.display = 'flex'; // Garante que está visível
        runtimeEl.innerHTML = `<i class="far fa-clock"></i> ${formatRuntime(data.runtime)}`;
    } else {
        runtimeEl.style.display = 'none'; // Esconde se for série
    }

    // Rating
    document.getElementById('rating').innerHTML = `
        <i class="fas fa-star"></i>
        ${data.vote_average.toFixed(1)}
    `;

    // Géneros
    document.getElementById('genres').innerHTML = data.genres
        .map(genre => `<span class="genre-tag">${genre.name}</span>`)
        .join('');

    // Sinopse
    document.getElementById('overview').textContent = data.overview;

    // Backdrop
    const backdropPath = data.backdrop_path
        ? `${TMDB_IMAGE_BASE_URL}/original${data.backdrop_path}`
        : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3';
    document.getElementById('backdrop-image').style.backgroundImage = `url('${backdropPath}')`;

    // Poster
    const posterPath = data.poster_path
        ? `${TMDB_IMAGE_BASE_URL}/w500${data.poster_path}`
        : 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?ixlib=rb-4.0.3';
    document.getElementById('poster-container').innerHTML = `<img src="${posterPath}" alt="${data.title || data.name}">`;

    // Trailer
    const trailer = videoData.results.find(v => v.site === 'YouTube' && v.type === 'Trailer');
    if (trailer) {
        trailerContainer.style.display = 'block';
        trailerContainer.querySelector('.trailer-wrapper').innerHTML = `
            <iframe src="https://www.youtube.com/embed/${trailer.key}"
                    title="Trailer de ${data.title || data.name}"
                    allowfullscreen>
            </iframe>
        `;
    }
}

// --- NOVA FUNÇÃO ---
// Renderiza o elenco
function renderCast(castMembers) {
    if (!castListEl) return; // Se o elemento não existir, sai

    castListEl.innerHTML = ''; // Limpa o container

    // Filtra para pegar apenas os X primeiros atores com foto
    const filteredCast = castMembers
        .filter(member => member.profile_path)
        .slice(0, 10); // Limita aos 10 primeiros

    if (filteredCast.length === 0) {
        castListEl.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">Elenco principal não disponível.</p>';
        return;
    }

    filteredCast.forEach(member => {
        const poster = `${TMDB_IMAGE_BASE_URL}/w185${member.profile_path}`; // w185 é um bom tamanho para fotos de elenco

        const card = document.createElement('div');
        card.className = 'cast-card';
        card.innerHTML = `
            <img src="${poster}" alt="${member.name}" class="cast-image">
            <div class="cast-info">
                <h3>${member.name}</h3>
                <p>${member.character}</p>
            </div>
        `;
        castListEl.appendChild(card);
    });
}


// --- Funções de Favoritos (Idênticas às anteriores) ---
async function checkFavoriteStatus(id) {
    if (!id || !favoriteBtn) return;
    try {
        const response = await fetch(`api/favoritos/verificar.php?tmdb_movie_id=${id}`); // A API de favoritos guarda por ID, não importa o tipo
        if (response.status === 401) {
            favoriteBtn.disabled = true;
            favoriteBtn.innerHTML = '<i class="fas fa-lock"></i> Faça login para favoritar';
            return;
        }
        if (!response.ok) throw new Error('Erro ao verificar status.');

        const data = await response.json();
        if (data.success) {
            isFavorited = data.favoritado;
            updateFavoriteButtonUI();
        }
    } catch (error) {
        console.error('Erro ao verificar favoritos:', error);
        favoriteBtn.style.display = 'none';
    }
}

function updateFavoriteButtonUI() {
    if (!favoriteBtn) return;
    if (isFavorited) {
        favoriteBtn.innerHTML = '<i class="fas fa-check"></i> Na sua lista';
        favoriteBtn.classList.remove('secondary-button');
        favoriteBtn.classList.add('primary-button');
    } else {
        favoriteBtn.innerHTML = '<i class="fas fa-heart"></i> Adicionar aos Favoritos';
        favoriteBtn.classList.remove('primary-button');
        favoriteBtn.classList.add('secondary-button');
    }
}

async function toggleFavorite() {
    if (!currentId || !favoriteBtn) return;
    const endpoint = isFavorited ? 'api/favoritos/remover.php' : 'api/favoritos/adicionar.php';
    const formData = new FormData();
    formData.append('tmdb_movie_id', currentId); // Usa o ID atual (seja filme ou tv)

    try {
        favoriteBtn.disabled = true;
        const response = await fetch(endpoint, { method: 'POST', body: formData });
        const data = await response.json();
        if (data.success) {
            isFavorited = !isFavorited;
            updateFavoriteButtonUI();
        } else {
            alert('Erro ao atualizar favoritos: ' + data.error);
        }
    } catch (error) {
        console.error('Erro ao favoritar:', error);
        alert('Erro de conexão ao atualizar favoritos.');
    } finally {
        favoriteBtn.disabled = false;
    }
}

// --- Funções Helpers (Formatação e UI) ---
function formatRuntime(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
}

function formatDate(dateString) {
    if (!dateString) return 'Data não disponível';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

function showLoading(isLoading) {
    loadingState.style.display = isLoading ? 'flex' : 'none';
    movieInfo.style.display = isLoading ? 'none' : 'block';
    errorState.style.display = 'none';
}

function showError() {
    loadingState.style.display = 'none';
    movieInfo.style.display = 'none';
    errorState.style.display = 'flex';
}