// ===== THEME TOGGLE =====
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

// Load saved theme
const savedTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

themeToggle?.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
});

function updateThemeIcon(theme) {
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

// ===== SIDEBAR TOGGLE =====
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('mainContent');

menuBtn?.addEventListener('click', () => {
    sidebar?.classList.toggle('collapsed');
    sidebar?.classList.toggle('active');
    mainContent?.classList.toggle('full-width');
});

// ===== UPLOAD BUTTON =====
const uploadBtn = document.getElementById('uploadBtn');
const uploadModal = document.getElementById('uploadModal');
const closeModal = document.getElementById('closeModal');
const cancelUpload = document.getElementById('cancelUpload');

uploadBtn?.addEventListener('click', () => {
    uploadModal?.classList.add('active');
});

closeModal?.addEventListener('click', () => {
    uploadModal?.classList.remove('active');
});

cancelUpload?.addEventListener('click', () => {
    uploadModal?.classList.remove('active');
});

uploadModal?.addEventListener('click', (e) => {
    if (e.target === uploadModal) {
        uploadModal.classList.remove('active');
    }
});

// ===== LOAD TRENDING VIDEOS =====
async function loadTrendingVideos() {
    try {
        const response = await fetch('php/get-trending.php');
        const videos = await response.json();
        displayVideos(videos);
    } catch (error) {
        console.error('Erro ao carregar vídeos em alta:', error);
        loadSampleTrendingVideos();
    }
}

function loadSampleTrendingVideos() {
    const sampleVideos = [
        {
            id: 1,
            title: 'TUTORIAL VIRAL: JavaScript em 2024',
            channel: 'CodeMaster',
            views: '5.2M',
            date: '1 dia atrás',
            duration: '15:32',
            thumbnail: 'https://via.placeholder.com/320x180/667eea/ffffff?text=JavaScript+Viral'
        },
        {
            id: 2,
            title: 'TOP 10 Tecnologias Mais Quentes do Ano',
            channel: 'Tech News',
            views: '3.8M',
            date: '2 dias atrás',
            duration: '22:15',
            thumbnail: 'https://via.placeholder.com/320x180/764ba2/ffffff?text=Top+10+Tech'
        },
        {
            id: 3,
            title: 'React vs Vue vs Angular - Comparação DEFINITIVA',
            channel: 'Dev Academy',
            views: '2.9M',
            date: '3 dias atrás',
            duration: '45:20',
            thumbnail: 'https://via.placeholder.com/320x180/f093fb/ffffff?text=Frameworks'
        },
        {
            id: 4,
            title: 'Como DOBRAR seu salário como DEV em 2024',
            channel: 'Career Tech',
            views: '4.5M',
            date: '1 dia atrás',
            duration: '18:45',
            thumbnail: 'https://via.placeholder.com/320x180/4facfe/ffffff?text=Carreira+Dev'
        },
        {
            id: 5,
            title: 'AI vai SUBSTITUIR programadores? A VERDADE',
            channel: 'Future Tech',
            views: '6.1M',
            date: '12 horas atrás',
            duration: '28:12',
            thumbnail: 'https://via.placeholder.com/320x180/00f2fe/ffffff?text=AI+Futuro'
        },
        {
            id: 6,
            title: 'Aprenda Python em 30 MINUTOS',
            channel: 'Quick Learn',
            views: '3.2M',
            date: '2 dias atrás',
            duration: '32:55',
            thumbnail: 'https://via.placeholder.com/320x180/43e97b/ffffff?text=Python+30min'
        },
        {
            id: 7,
            title: 'Docker Tutorial COMPLETO para Iniciantes',
            channel: 'DevOps Channel',
            views: '2.1M',
            date: '4 dias atrás',
            duration: '41:30',
            thumbnail: 'https://via.placeholder.com/320x180/fa709a/ffffff?text=Docker'
        },
        {
            id: 8,
            title: 'Criando um JOGO com JavaScript',
            channel: 'Game Dev',
            views: '1.8M',
            date: '3 dias atrás',
            duration: '56:20',
            thumbnail: 'https://via.placeholder.com/320x180/fee140/333333?text=Game+JS'
        }
    ];
    
    displayVideos(sampleVideos);
}

// ===== UTILITY FUNCTIONS =====
function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'agora';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutos atrás`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} horas atrás`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} dias atrás`;
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)} semanas atrás`;
    if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} meses atrás`;
    return `${Math.floor(seconds / 31536000)} anos atrás`;
}

function formatViews(views) {
    if (views >= 1000000) {
        return (views / 1000000).toFixed(1).replace('.0', '') + 'M';
    } else if (views >= 1000) {
        return (views / 1000).toFixed(1).replace('.0', '') + 'K';
    }
    return views.toString();
}

function displayVideos(videos) {
    const videosGrid = document.getElementById('videosGrid');
    if (!videosGrid) return;
    
    console.log('📹 Displaying trending videos:', videos.length);
    if (videos.length > 0) {
        console.log('Sample trending video data:', videos[0]);
    }
    
    if (videos.length === 0) {
        videosGrid.innerHTML = '<div class="no-videos"><i class="fas fa-video-slash"></i><p>Nenhum vídeo encontrado</p></div>';
        return;
    }
    
    videosGrid.innerHTML = videos.map(video => {
        const views = video.views ? (typeof video.views === 'number' ? formatViews(video.views) : video.views) : '0';
        const date = video.created_at ? formatTimeAgo(video.created_at) : (video.date || 'há pouco');
        
        console.log(`Video "${video.title}" - profile_image:`, video.profile_image);
        
        return `
            <a href="watch.html?v=${video.id}" class="video-card">
                <div class="video-thumbnail">
                    <img src="${video.thumbnail}" alt="${video.title}">
                    <span class="video-duration">${video.duration || '0:00'}</span>
                </div>
                <div class="video-details">
                    <div class="channel-avatar">
                        ${video.profile_image ? 
                            `<img src="${video.profile_image}" alt="${video.channel}">` :
                            '<i class="fas fa-user-circle"></i>'
                        }
                    </div>
                    <div class="video-meta">
                        <h3>${video.title}</h3>
                        <div class="channel-name">${video.channel}</div>
                        <div class="video-stats">${views} visualizações • ${date}</div>
                    </div>
                </div>
            </a>
        `;
    }).join('');
}

// Load trending videos on page load
loadTrendingVideos();

// Load subscriptions list
async function loadSubscriptions() {
    const user = localStorage.getItem('user');
    if (!user) return;
    
    try {
        const userData = JSON.parse(user);
        const response = await fetch('php/get-user-subscriptions.php', {
            headers: {
                'X-User-Id': userData.id
            }
        });
        const channels = await response.json();
        displaySubscriptionsSidebar(channels);
    } catch (error) {
        console.error('Erro ao carregar inscrições:', error);
        displaySubscriptionsSidebar([]);
    }
}

function displaySubscriptionsSidebar(channels) {
    const subscriptionsList = document.getElementById('subscriptionsList');
    if (!subscriptionsList) return;
    
    if (channels.length === 0) {
        subscriptionsList.innerHTML = '<p class="no-subs">Nenhuma inscrição ainda</p>';
        return;
    }
    
    subscriptionsList.innerHTML = channels.map(channel => `
        <a href="#" class="nav-item subscription-item" data-channel="${channel.id}">
            ${channel.avatar ? 
                `<img src="${channel.avatar}" alt="${channel.username}" class="channel-avatar-small">` :
                '<i class="fas fa-user-circle"></i>'
            }
            <span>${channel.username}</span>
        </a>
    `).join('');
}

loadSubscriptions();

// ===== UPDATE UI FOR AUTH STATE =====
function updateUIForAuth() {
    const user = localStorage.getItem('user');
    const myChannelLink = document.getElementById('myChannelLink');
    
    if (user && myChannelLink) {
        myChannelLink.style.display = 'flex';
    } else if (myChannelLink) {
        myChannelLink.style.display = 'none';
    }
}

// Listen for storage changes (login/logout in other tabs)
window.addEventListener('storage', (e) => {
    if (e.key === 'user') {
        updateUIForAuth();
        loadSubscriptions();
    }
});

// Update UI on load
updateUIForAuth();
