// iptv/js/admin.js

// Configurações da API TMDB (Chave do main.js)
const TMDB_API_KEY = '2c19bf5eb981d886122e44a78fed935d';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Elementos
const searchInput = document.getElementById('admin-search-input');
const searchButton = document.getElementById('admin-search-btn');
const resultsContainer = document.getElementById('tmdb-results');
const activeContentList = document.getElementById('active-content-list');
const loadingState = document.getElementById('loading-state');
const adminStatus = document.getElementById('admin-status');

// Variável para armazenar o ID do TMDB ativo no catálogo
let activeTmdbIds = new Set();

// ==========================================================
// FUNÇÕES DE ADMINISTRAÇÃO (ADD/REMOVE)
// ==========================================================

// 1. Busca no catálogo local e popula 'activeTmdbIds' (e a lista de remoção)
async function fetchActiveContentIds() {
    activeContentList.innerHTML = '<div class="loading">Carregando catálogo ativo...</div>';
    try {
        // Usa o novo endpoint público para obter a lista curada
        const response = await fetch('api/content/listar_ativos.php');
        if (!response.ok) throw new Error('Falha ao buscar catálogo ativo.');
        
        const data = await response.json();
        
        activeTmdbIds.clear(); // Limpa o Set
        data.conteudo.forEach(item => {
            activeTmdbIds.add(item.tmdb_id.toString());
        });

        // Popula a seção de remoção rápida
        renderActiveContentList(data.conteudo);

    } catch (error) {
        console.error('Erro ao carregar catálogo ativo:', error);
        activeContentList.innerHTML = '<div class="error">Erro ao carregar catálogo ativo.</div>';
    }
}

// 2. Renderiza a lista de conteúdo ativo para remoção
function renderActiveContentList(contentList) {
    activeContentList.innerHTML = ''; 
    contentList.forEach(item => {
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card'; 
        
        const posterPath = item.poster_path
            ? `${TMDB_IMAGE_BASE_URL}/w300${item.poster_path}`
            : '';

        movieCard.innerHTML = `
            <img src="${posterPath}" alt="${item.titulo}" loading="lazy">
            <h3>${item.titulo}</h3>
            <div class="movie-info">
                <span class="rating"><i class="fas fa-star"></i> ${item.vote_average.toFixed(1)}</span>
                <span class="year">${item.release_year || 'N/A'}</span>
            </div>
            <button class="details-button btn-remove" data-tmdb-id="${item.tmdb_id}" data-media-type="${item.media_type}">
                <i class="fas fa-trash-alt"></i> Remover
            </button>
        `;

        // Listener de remoção
        movieCard.querySelector('.btn-remove').addEventListener('click', () => 
            handleContentAction(item.tmdb_id, 'remove', item.media_type)
        );

        activeContentList.appendChild(movieCard);
    });
    if (contentList.length === 0) {
        activeContentList.innerHTML = '<div class="error">O catálogo está vazio.</div>';
    }
}

// 3. Função de busca no TMDB (para o Admin)
async function fetchTmdbSearchResults(query) {
    loadingState.style.display = 'block';
    resultsContainer.innerHTML = '';

    try {
        // Busca mista (movie e tv) no TMDB
        const url = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}&page=1`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error('Falha ao buscar TMDB');
        const data = await response.json();

        const results = data.results
            .filter(item => item.poster_path && (item.media_type === 'movie' || item.media_type === 'tv'))
            .sort((a, b) => b.popularity - a.popularity)
            .slice(0, 15); // Limita a 15 resultados na busca Admin

        if (results.length === 0) {
            resultsContainer.innerHTML = '<div class="error">Nenhum resultado encontrado no TMDB.</div>';
        }

        results.forEach(item => {
            const card = renderAdminResultCard(item);
            if(card) resultsContainer.appendChild(card);
        });

        attachActionButtonListeners();

    } catch (error) {
        console.error("Erro ao buscar TMDB:", error);
        resultsContainer.innerHTML = '<div class="error">Erro ao buscar resultados no TMDB.</div>';
    } finally {
        loadingState.style.display = 'none';
    }
}

// Renderiza um card de resultado da busca TMDB para o Admin
function renderAdminResultCard(item) {
    const card = document.createElement('div');
    card.className = 'result-card';
    card.dataset.tmdbId = item.id;
    card.dataset.mediaType = item.media_type;
    
    // Verifica se a mídia tem poster e é filme/série
    if (!item.poster_path || (item.media_type !== 'movie' && item.media_type !== 'tv')) {
        return null;
    }

    const posterPath = `${TMDB_IMAGE_BASE_URL}/w300${item.poster_path}`;
    const title = item.title || item.name;
    const isAdded = activeTmdbIds.has(item.id.toString());
    const buttonClass = isAdded ? 'btn-remove' : 'btn-add';
    const buttonText = isAdded ? '<i class="fas fa-check"></i> Adicionado' : '<i class="fas fa-plus-circle"></i> Adicionar';

    card.innerHTML = `
        <img src="${posterPath}" alt="${title}">
        <div class="result-info">
            <h3>${title}</h3>
            <p>${item.media_type === 'movie' ? 'Filme' : 'Série'} (${item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0] || 'N/A'})</p>
        </div>
        <button class="${buttonClass} ${isAdded ? 'added' : ''}" data-tmdb-id="${item.id}" data-media-type="${item.media_type}">
            ${buttonText}
        </button>
    `;
    return card;
}


// 4. Lógica de Adicionar/Remover
async function handleContentAction(tmdbId, action, mediaType) {
    const endpoint = action === 'add' ? 'api/admin/adicionar.php' : 'api/admin/remover.php';
    const formData = new FormData();
    formData.append('tmdb_id', tmdbId);
    formData.append('media_type', mediaType); // Sempre passa o tipo, mesmo para remover
    
    const targetButton = document.querySelector(`.admin-main [data-tmdb-id="${tmdbId}"]`);
    if (targetButton) {
        targetButton.disabled = true;
    }

    try {
        const response = await fetch(endpoint, { method: 'POST', body: formData });
        const data = await response.json();

        if (data.success) {
            adminStatus.textContent = data.message;
            adminStatus.style.backgroundColor = 'rgba(40, 167, 69, 0.2)';
            adminStatus.style.display = 'block';

            // Atualiza o estado e a UI após a ação
            if (action === 'add') {
                activeTmdbIds.add(tmdbId.toString());
            } else {
                activeTmdbIds.delete(tmdbId.toString());
            }
            
            // Recarrega as duas listas
            await fetchActiveContentIds(); 
            // Se houver busca ativa, recarrega os resultados para atualizar o botão
            if(searchInput.value) fetchTmdbSearchResults(searchInput.value); 
            
        } else {
            adminStatus.textContent = data.error || 'Erro desconhecido';
            adminStatus.style.backgroundColor = 'rgba(220, 53, 69, 0.2)';
            adminStatus.style.display = 'block';
        }
    } catch (error) {
        console.error('Erro de API:', error);
        adminStatus.textContent = 'Erro de conexão com o servidor';
        adminStatus.style.backgroundColor = 'rgba(220, 53, 69, 0.2)';
        adminStatus.style.display = 'block';
    } finally {
        if (targetButton) {
            targetButton.disabled = false;
        }
        setTimeout(() => { adminStatus.style.display = 'none'; }, 5000);
    }
}

// 5. Anexa listeners aos botões
function attachActionButtonListeners() {
    resultsContainer.querySelectorAll('.btn-add, .btn-remove').forEach(button => {
        // Remove listener antigo para evitar duplicação
        button.replaceWith(button.cloneNode(true));
    });

    // Re-seleciona e anexa o novo listener
    resultsContainer.querySelectorAll('.btn-add, .btn-remove').forEach(button => {
        button.addEventListener('click', function() {
            const tmdbId = this.dataset.tmdbId;
            const mediaType = this.dataset.mediaType;
            const action = this.classList.contains('btn-add') ? 'add' : 'remove';
            
            handleContentAction(tmdbId, action, mediaType);
        });
    });
}


// ==========================================================
// INICIALIZAÇÃO
// ==========================================================

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Carregar a lista de IDs ativos primeiro
    await fetchActiveContentIds();

    // 2. Listener do botão de busca
    searchButton.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            fetchTmdbSearchResults(query);
        } else {
            adminStatus.textContent = 'Digite um termo de busca.';
            adminStatus.style.backgroundColor = 'rgba(255, 193, 7, 0.2)';
            adminStatus.style.display = 'block';
            setTimeout(() => { adminStatus.style.display = 'none'; }, 3000);
        }
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            searchButton.click();
        }
    });
});