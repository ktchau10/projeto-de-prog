// iptv/js/index_list.js

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

function getQueryParam(param) {
    return new URLSearchParams(window.location.search).get(param);
}

// Reutiliza a lógica de criação de card (para manter o DRY)
function createMediaCard(item) {
    const movieCard = document.createElement('div');
    movieCard.className = 'movie-card';
    movieCard.dataset.movieId = item.tmdb_id;
    movieCard.dataset.mediaType = item.media_type;

    const posterPath = item.poster_path
        ? `${TMDB_IMAGE_BASE_URL}/w300${item.poster_path}`
        : 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=450';

    const title = item.titulo;
    const year = item.release_year || 'N/A';

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
    
    // Listener de detalhes
    movieCard.querySelector('.details-button').addEventListener('click', () => {
        window.location.href = `movie-details.html?id=${item.tmdb_id}&type=${item.media_type}`;
    });
    
    return movieCard;
}

async function loadCuratedCatalog() {
    const mediaType = getQueryParam('type'); // 'movie' ou 'tv'
    const listTitle = document.getElementById('list-title');
    const catalogList = document.getElementById('catalog-list');
    
    if (!mediaType) {
        listTitle.textContent = 'Seleção Inválida';
        catalogList.innerHTML = '<div class="error">Selecione Filmes ou Séries na página inicial.</div>';
        return;
    }

    listTitle.textContent = mediaType === 'movie' ? 'Filmes Curados' : 'Séries Curadas';
    catalogList.innerHTML = '<div class="loading">Carregando catálogo curado...</div>';

    try {
        // 1. Busca o catálogo curado (todos)
        const response = await fetch('api/content/listar_ativos.php');
        if (!response.ok) throw new Error('Falha ao carregar o catálogo ativo.');

        const data = await response.json();
        
        // 2. Filtra por tipo de mídia e ordena por nome
        let filteredContent = data.conteudo
            .filter(item => item.media_type === mediaType)
            .sort((a, b) => a.titulo.localeCompare(b.titulo)); // Ordenação Alfabética

        catalogList.innerHTML = ''; // Limpa o loading

        if (filteredContent.length === 0) {
            catalogList.innerHTML = `<div class="error">Nenhum(a) ${mediaType === 'movie' ? 'filme' : 'série'} encontrado(a) no catálogo curado.</div>`;
            return;
        }

        // 3. Renderiza
        filteredContent.forEach(item => {
            catalogList.appendChild(createMediaCard(item));
        });

    } catch (error) {
        console.error('Erro ao carregar catálogo:', error);
        catalogList.innerHTML = '<div class="error">Erro ao carregar o catálogo. Tente novamente mais tarde.</div>';
    }
}

document.addEventListener('DOMContentLoaded', loadCuratedCatalog);