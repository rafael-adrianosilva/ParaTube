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
uploadBtn?.addEventListener('click', () => {
    window.location.href = 'index.html#upload';
});

// ===== LOAD SUBSCRIPTION VIDEOS =====
async function loadSubscriptionVideos() {
    try {
        const response = await fetch('php/get-subscriptions.php');
        const videos = await response.json();
        
        if (videos.length === 0) {
            showNoSubscriptionsMessage();
        } else {
            displayVideos(videos);
        }
    } catch (error) {
        console.error('Erro ao carregar vídeos das inscrições:', error);
        loadSampleSubscriptionVideos();
    }
}

function showNoSubscriptionsMessage() {
    const videosGrid = document.getElementById('videosGrid');
    const subscriptionsNotice = document.getElementById('subscriptionsNotice');
    
    videosGrid.style.display = 'none';
    subscriptionsNotice.style.display = 'block';
}

function loadSampleSubscriptionVideos() {
    const user = localStorage.getItem('user');
    
    if (!user) {
        showNoSubscriptionsMessage();
        return;
    }
    
    const sampleVideos = [
        {
            id: 1,
            title: 'Novo Tutorial de JavaScript - Parte 5',
            channel: 'CodeMaster',
            views: '125K',
            date: '2 horas atrás',
            duration: '15:32',
            thumbnail: 'https://via.placeholder.com/320x180/667eea/ffffff?text=JavaScript+P5'
        },
        {
            id: 2,
            title: 'CSS Grid - Layout Avançado',
            channel: 'Web Design Pro',
            views: '85K',
            date: '5 horas atrás',
            duration: '22:15',
            thumbnail: 'https://via.placeholder.com/320x180/764ba2/ffffff?text=CSS+Grid'
        },
        {
            id: 3,
            title: 'React Hooks - useEffect Explicado',
            channel: 'Dev Academy',
            views: '250K',
            date: '1 dia atrás',
            duration: '18:20',
            thumbnail: 'https://via.placeholder.com/320x180/f093fb/ffffff?text=React+Hooks'
        },
        {
            id: 4,
            title: 'Node.js - Autenticação com JWT',
            channel: 'Backend Masters',
            views: '65K',
            date: '1 dia atrás',
            duration: '32:45',
            thumbnail: 'https://via.placeholder.com/320x180/4facfe/ffffff?text=JWT+Auth'
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
    const subscriptionsNotice = document.getElementById('subscriptionsNotice');
    
    if (!videosGrid) return;
    
    console.log('📹 Displaying subscription videos:', videos.length);
    if (videos.length > 0) {
        console.log('Sample subscription video data:', videos[0]);
    }
    
    subscriptionsNotice.style.display = 'none';
    videosGrid.style.display = 'grid';
    
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

// Load subscription videos on page load
loadSubscriptionVideos();

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
        loadSubscriptionVideos();
    }
});

// Update UI on load
updateUIForAuth();
