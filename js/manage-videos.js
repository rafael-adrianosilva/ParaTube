// ===== MANAGE VIDEOS (STUDIO) =====

let currentUser = null;
let allVideos = [];
let currentFilter = 'all';
let editingVideoId = null;

// Check authentication
function checkAuth() {
    const user = localStorage.getItem('user');
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    try {
        currentUser = JSON.parse(user);
        return currentUser;
    } catch (error) {
        console.error('Erro ao parsear usuário:', error);
        window.location.href = 'login.html';
        return null;
    }
}

// Load all videos
async function loadVideos() {
    if (!currentUser) return;
    
    try {
        const response = await fetch('php/get-user-videos.php', {
            headers: { 'X-User-Id': currentUser.id }
        });
        const videos = await response.json();
        allVideos = videos;
        displayVideos(videos);
    } catch (error) {
        console.error('Erro ao carregar vídeos:', error);
        showNoVideosMessage();
    }
}

// Display videos in table
function displayVideos(videos) {
    const tbody = document.getElementById('videosTableBody');
    const noVideosMsg = document.getElementById('noVideosMessage');
    
    if (videos.length === 0) {
        tbody.innerHTML = '';
        noVideosMsg.style.display = 'block';
        return;
    }
    
    noVideosMsg.style.display = 'none';
    
    tbody.innerHTML = videos.map(video => `
        <tr>
            <td>
                <div class="video-info-cell">
                    <img src="${video.thumbnail || 'assets/default-thumbnail.jpg'}" alt="${video.title}" class="video-thumbnail-studio">
                    <div class="video-details-studio">
                        <div class="video-title-studio">${video.title}</div>
                        <div class="video-desc-studio">${video.description || 'Sem descrição'}</div>
                    </div>
                </div>
            </td>
            <td>
                <span class="visibility-badge ${video.visibility || 'public'}">
                    ${getVisibilityText(video.visibility || 'public')}
                </span>
            </td>
            <td>${formatDate(video.created_at)}</td>
            <td>${formatNumber(video.views || 0)}</td>
            <td>${formatNumber(video.comment_count || 0)}</td>
            <td>${formatNumber(video.like_count || 0)}</td>
            <td>
                <div class="studio-actions">
                    <button class="studio-btn" onclick="editVideo(${video.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="studio-btn" onclick="viewInsights(${video.id})" title="Análises">
                        <i class="fas fa-chart-line"></i>
                    </button>
                    <button class="studio-btn" onclick="toggleVisibility(${video.id}, '${video.visibility || 'public'}')" title="Alterar visibilidade">
                        <i class="fas fa-eye${video.visibility === 'private' ? '-slash' : ''}"></i>
                    </button>
                    <button class="studio-btn danger" onclick="confirmDelete(${video.id})" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getVisibilityText(visibility) {
    const texts = {
        'public': 'Público',
        'private': 'Privado',
        'unlisted': 'Não listado'
    };
    return texts[visibility] || 'Público';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('pt-BR', options);
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// Filter tabs
document.querySelectorAll('.studio-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.studio-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.dataset.filter;
        filterVideos();
    });
});

function filterVideos() {
    let filtered = allVideos;
    
    if (currentFilter === 'videos') {
        filtered = allVideos.filter(v => parseDuration(v.duration) >= 60);
    } else if (currentFilter === 'shorts') {
        filtered = allVideos.filter(v => parseDuration(v.duration) < 60);
    } else if (currentFilter === 'private') {
        filtered = allVideos.filter(v => v.visibility === 'private');
    } else if (currentFilter === 'unlisted') {
        filtered = allVideos.filter(v => v.visibility === 'unlisted');
    }
    
    displayVideos(filtered);
}

function parseDuration(duration) {
    if (!duration) return 0;
    const parts = duration.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
}

// Search
document.getElementById('studioSearch')?.addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = allVideos.filter(v => 
        v.title.toLowerCase().includes(searchTerm) ||
        (v.description && v.description.toLowerCase().includes(searchTerm))
    );
    displayVideos(filtered);
});

// Edit video
function editVideo(videoId) {
    const video = allVideos.find(v => v.id === videoId);
    if (!video) return;
    
    editingVideoId = videoId;
    document.getElementById('editVideoId').value = videoId;
    document.getElementById('editVideoTitle').value = video.title;
    document.getElementById('editVideoDescription').value = video.description || '';
    document.getElementById('editVideoVisibility').value = video.visibility || 'public';
    
    // Show thumbnail preview if exists
    if (video.thumbnail) {
        document.getElementById('thumbnailPreview').innerHTML = `
            <img src="${video.thumbnail}" style="max-width: 200px; border-radius: 8px;">
        `;
    }
    
    document.getElementById('editVideoModal').classList.add('active');
}

// Save video changes
document.getElementById('saveVideoChanges')?.addEventListener('click', async function() {
    const videoId = document.getElementById('editVideoId').value;
    const title = document.getElementById('editVideoTitle').value;
    const description = document.getElementById('editVideoDescription').value;
    const visibility = document.getElementById('editVideoVisibility').value;
    
    if (!title.trim()) {
        alert('O título não pode estar vazio');
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('video_id', videoId);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('visibility', visibility);
        
        const thumbnailInput = document.getElementById('editVideoThumbnail');
        if (thumbnailInput.files.length > 0) {
            formData.append('thumbnail', thumbnailInput.files[0]);
        }
        
        const response = await fetch('php/update-video.php', {
            method: 'POST',
            headers: { 'X-User-Id': currentUser.id },
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Vídeo atualizado com sucesso!');
            document.getElementById('editVideoModal').classList.remove('active');
            loadVideos();
        } else {
            alert('Erro ao atualizar vídeo: ' + result.message);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao atualizar vídeo');
    }
});

// View insights
async function viewInsights(videoId) {
    const video = allVideos.find(v => v.id === videoId);
    if (!video) return;
    
    try {
        const response = await fetch(`php/get-video-insights.php?video_id=${videoId}`, {
            headers: { 'X-User-Id': currentUser.id }
        });
        const insights = await response.json();
        
        document.getElementById('insightViews').textContent = insights.views || 0;
        document.getElementById('insightLikes').textContent = insights.likes || 0;
        document.getElementById('insightDislikes').textContent = insights.dislikes || 0;
        document.getElementById('insightComments').textContent = insights.comments || 0;
        
        document.getElementById('insightsModal').classList.add('active');
    } catch (error) {
        console.error('Erro ao carregar insights:', error);
        alert('Erro ao carregar estatísticas');
    }
}

// Toggle visibility
async function toggleVisibility(videoId, currentVisibility) {
    const options = ['public', 'unlisted', 'private'];
    const currentIndex = options.indexOf(currentVisibility);
    const nextVisibility = options[(currentIndex + 1) % options.length];
    
    try {
        const response = await fetch('php/update-video-visibility.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': currentUser.id
            },
            body: JSON.stringify({ video_id: videoId, visibility: nextVisibility })
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadVideos();
        } else {
            alert('Erro ao alterar visibilidade: ' + result.message);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao alterar visibilidade');
    }
}

// Delete video
function confirmDelete(videoId) {
    document.getElementById('deleteVideoId').value = videoId;
    document.getElementById('deleteModal').classList.add('active');
}

document.getElementById('confirmDelete')?.addEventListener('click', async function() {
    const videoId = document.getElementById('deleteVideoId').value;
    
    try {
        const response = await fetch('php/delete-video.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': currentUser.id
            },
            body: JSON.stringify({ video_id: videoId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Vídeo excluído com sucesso!');
            document.getElementById('deleteModal').classList.remove('active');
            loadVideos();
        } else {
            alert('Erro ao excluir vídeo: ' + result.message);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao excluir vídeo');
    }
});

// Modal controls
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', function() {
        this.closest('.modal').classList.remove('active');
    });
});

document.getElementById('cancelEdit')?.addEventListener('click', () => {
    document.getElementById('editVideoModal').classList.remove('active');
});

document.getElementById('cancelDelete')?.addEventListener('click', () => {
    document.getElementById('deleteModal').classList.remove('active');
});

// Close modals on outside click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
});

// Theme toggle
const themeToggle = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

themeToggle?.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggle.querySelector('i').className = newTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
});

function showNoVideosMessage() {
    document.getElementById('videosTableBody').innerHTML = '';
    document.getElementById('noVideosMessage').style.display = 'block';
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    currentUser = checkAuth();
    if (currentUser) {
        loadVideos();
    }
});
