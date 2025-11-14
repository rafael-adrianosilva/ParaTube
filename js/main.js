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

// ===== USER MENU DROPDOWN =====
// Dropdown is now controlled by auth.js

// ===== UPLOAD MODAL =====
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

// ===== VIDEO DURATION CAPTURE =====
const videoInput = document.getElementById('videoFile');
let videoDuration = 0;

videoInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.match('video.*')) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        video.onloadedmetadata = function() {
            window.URL.revokeObjectURL(video.src);
            videoDuration = Math.round(video.duration);
            console.log('📹 Video duration captured:', videoDuration, 'seconds');
        };
        
        video.src = URL.createObjectURL(file);
    }
});

// ===== THUMBNAIL PREVIEW =====
const thumbnailInput = document.getElementById('thumbnailFile');
const thumbnailPreview = document.getElementById('thumbnailPreview');
const thumbnailImg = document.getElementById('thumbnailImg');

thumbnailInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.match('image.*')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            thumbnailImg.src = e.target.result;
            thumbnailPreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        thumbnailPreview.style.display = 'none';
    }
});

// ===== UPLOAD FORM =====
const uploadForm = document.getElementById('uploadForm');
const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

uploadForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(uploadForm);
    
    // Add video duration to form data
    if (videoDuration > 0) {
        formData.append('duration', videoDuration);
        console.log('✅ Adding duration to upload:', videoDuration);
    }
    
    uploadProgress.style.display = 'block';
    
    try {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                progressFill.style.width = percentComplete + '%';
                progressText.textContent = Math.round(percentComplete) + '%';
            }
        });
        
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                alert('Vídeo enviado com sucesso!');
                uploadModal.classList.remove('active');
                uploadForm.reset();
                thumbnailPreview.style.display = 'none';
                uploadProgress.style.display = 'none';
                progressFill.style.width = '0%';
                progressText.textContent = '0%';
                loadVideos();
            } else {
                alert('Erro ao enviar vídeo. Tente novamente.');
            }
        });
        
        xhr.addEventListener('error', () => {
            alert('Erro ao enviar vídeo. Tente novamente.');
        });
        
        xhr.open('POST', 'php/upload-video.php');
        xhr.send(formData);
        
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao enviar vídeo.');
    }
});

// ===== SEARCH FORM =====
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');

searchForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query) {
        searchVideos(query);
    }
});

// ===== FILTER CHIPS =====
const chips = document.querySelectorAll('.chip');
chips.forEach(chip => {
    chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        
        const category = chip.textContent;
        if (category === 'Todos') {
            loadVideos();
        } else {
            filterVideos(category);
        }
    });
});

// ===== LOAD VIDEOS =====
async function loadVideos() {
    try {
        const response = await fetch('php/get-videos.php');
        const videos = await response.json();
        displayVideos(videos);
    } catch (error) {
        console.error('Erro ao carregar vídeos:', error);
        // Load sample videos if PHP is not available
        loadSampleVideos();
    }
}

function loadSampleVideos() {
    const now = new Date();
    const sampleVideos = [
        {
            id: 1,
            title: 'Tutorial de JavaScript - Aprenda do Zero',
            channel: 'CodeMaster',
            views: 1200000,
            created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            duration: '15:32',
            thumbnail: 'https://via.placeholder.com/320x180/667eea/ffffff?text=JavaScript'
        },
        {
            id: 2,
            title: 'Como criar um site responsivo com HTML e CSS',
            channel: 'Web Design Pro',
            views: 850000,
            created_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            duration: '22:15',
            thumbnail: 'https://via.placeholder.com/320x180/764ba2/ffffff?text=HTML+CSS'
        },
        {
            id: 3,
            title: 'React JS - Curso Completo para Iniciantes',
            channel: 'Dev Academy',
            views: 2500000,
            created_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            duration: '45:20',
            thumbnail: 'https://via.placeholder.com/320x180/f093fb/ffffff?text=React'
        },
        {
            id: 4,
            title: 'Node.js e Express - Criando APIs REST',
            channel: 'Backend Masters',
            views: 650000,
            created_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            duration: '32:45',
            thumbnail: 'https://via.placeholder.com/320x180/4facfe/ffffff?text=Node.js'
        },
        {
            id: 5,
            title: 'MySQL do Básico ao Avançado',
            channel: 'Database Guru',
            views: 920000,
            created_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            duration: '38:12',
            thumbnail: 'https://via.placeholder.com/320x180/00f2fe/ffffff?text=MySQL'
        },
        {
            id: 6,
            title: 'PHP 8 - Novidades e Recursos',
            channel: 'PHP Developer',
            views: 480000,
            created_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            duration: '28:55',
            thumbnail: 'https://via.placeholder.com/320x180/43e97b/ffffff?text=PHP+8'
        },
        {
            id: 7,
            title: 'Git e GitHub para Iniciantes',
            channel: 'Version Control',
            views: 1800000,
            created_at: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            duration: '19:40',
            thumbnail: 'https://via.placeholder.com/320x180/fa709a/ffffff?text=Git'
        },
        {
            id: 8,
            title: 'Docker - Containerização de Aplicações',
            channel: 'DevOps Channel',
            views: 710000,
            created_at: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            duration: '41:30',
            thumbnail: 'https://via.placeholder.com/320x180/fee140/333333?text=Docker'
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
    
    console.log('📹 Displaying videos:', videos.length);
    if (videos.length > 0) {
        console.log('Sample video data:', videos[0]);
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

async function searchVideos(query) {
    try {
        const response = await fetch(`php/search-videos.php?q=${encodeURIComponent(query)}`);
        const videos = await response.json();
        displayVideos(videos);
    } catch (error) {
        console.error('Erro ao buscar vídeos:', error);
    }
}

async function filterVideos(category) {
    try {
        const response = await fetch(`php/filter-videos.php?category=${encodeURIComponent(category)}`);
        const videos = await response.json();
        displayVideos(videos);
    } catch (error) {
        console.error('Erro ao filtrar vídeos:', error);
    }
}

// ===== LOAD SUBSCRIPTIONS SIDEBAR =====
async function loadSubscriptionsSidebar() {
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

function loadSampleSubscriptions() {
    const sampleChannels = [
        { id: 1, username: 'CodeMaster', avatar: null },
        { id: 2, username: 'Web Design Pro', avatar: null },
        { id: 3, username: 'Dev Academy', avatar: null }
    ];
    displaySubscriptionsSidebar(sampleChannels);
}

function displaySubscriptionsSidebar(channels) {
    const subscriptionsList = document.getElementById('subscriptionsList');
    if (!subscriptionsList) return;
    
    if (channels.length === 0) {
        subscriptionsList.innerHTML = '<p class="no-subs">Nenhuma inscrição ainda</p>';
        return;
    }
    
    subscriptionsList.innerHTML = channels.map(channel => `
        <a href="#channel-${channel.id}" class="nav-item subscription-item" data-channel="${channel.id}">
            ${channel.avatar ? 
                `<img src="${channel.avatar}" alt="${channel.username}" class="channel-avatar-small">` :
                '<i class="fas fa-user-circle"></i>'
            }
            <span>${channel.username}</span>
        </a>
    `).join('');
}

// ===== SHOW/HIDE ELEMENTS BASED ON AUTH =====
function updateUIForAuth() {
    const user = localStorage.getItem('user');
    const myChannelLink = document.getElementById('myChannelLink');
    
    if (user && myChannelLink) {
        myChannelLink.style.display = 'flex';
    } else if (myChannelLink) {
        myChannelLink.style.display = 'none';
    }
}

// Load videos on page load
if (document.getElementById('videosGrid')) {
    loadVideos();
}

// Load subscriptions sidebar
loadSubscriptionsSidebar();

// Update UI based on authentication
updateUIForAuth();

// Listen for storage changes (when user logs in/out in another tab)
window.addEventListener('storage', function(e) {
    if (e.key === 'user') {
        updateUIForAuth();
        loadSubscriptionsSidebar();
    }
});

// ===== ACHIEVEMENTS SYSTEM =====
async function checkAchievements() {
    try {
        const response = await fetch('php/check-achievements.php');
        const data = await response.json();
        
        if (data.unlocked && data.unlocked.length > 0) {
            data.unlocked.forEach(achievement => {
                showAchievementNotification(achievement);
            });
        }
    } catch (error) {
        console.error('Erro ao verificar conquistas:', error);
    }
}

function showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <div class="achievement-icon" style="background: ${achievement.badge_color};">
            <i class="fas ${achievement.icon}"></i>
        </div>
        <div class="achievement-info">
            <div class="achievement-title">🎉 Conquista Desbloqueada!</div>
            <div class="achievement-name">${achievement.name}</div>
            <div class="achievement-description">${achievement.description}</div>
        </div>
        <button class="achievement-close">×</button>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Close button
    notification.querySelector('.achievement-close').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 8000);
}

// Check achievements every 30 seconds if user is logged in
if (localStorage.getItem('user')) {
    checkAchievements(); // Check immediately
    setInterval(checkAchievements, 30000);
}

// Add achievement notification CSS
const achievementStyle = document.createElement('style');
achievementStyle.textContent = `
    .achievement-notification {
        position: fixed;
        top: 80px;
        right: -400px;
        width: 360px;
        background: var(--bg-secondary);
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        gap: 16px;
        z-index: 10001;
        transition: right 0.3s ease-out;
        border: 2px solid var(--accent-color);
    }
    
    .achievement-notification.show {
        right: 20px;
    }
    
    .achievement-icon {
        width: 60px;
        height: 60px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        color: white;
        flex-shrink: 0;
    }
    
    .achievement-info {
        flex: 1;
    }
    
    .achievement-title {
        font-size: 12px;
        font-weight: 600;
        color: var(--accent-color);
        text-transform: uppercase;
        margin-bottom: 4px;
    }
    
    .achievement-name {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 4px;
    }
    
    .achievement-description {
        font-size: 13px;
        color: var(--text-secondary);
    }
    
    .achievement-close {
        position: absolute;
        top: 8px;
        right: 8px;
        background: none;
        border: none;
        font-size: 24px;
        color: var(--text-secondary);
        cursor: pointer;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s;
    }
    
    .achievement-close:hover {
        background: var(--bg-hover);
        color: var(--text-primary);
    }
    
    @media (max-width: 768px) {
        .achievement-notification {
            width: calc(100% - 40px);
            right: -100%;
        }
        
        .achievement-notification.show {
            right: 20px;
        }
    }
`;
document.head.appendChild(achievementStyle);

// ===== GLOBAL USER SESSION & AVATAR LOADER =====
async function loadUserSession() {
    try {
        const response = await fetch('php/check-session.php');
        const data = await response.json();
        
        if (data.logged_in) {
            updateUserUI(data.user);
            return data.user;
        } else {
            updateUserUILoggedOut();
            return null;
        }
    } catch (error) {
        console.error('Erro ao carregar sessão:', error);
        updateUserUILoggedOut();
        return null;
    }
}

function updateUserUI(user) {
    // Atualizar avatar no header
    const userAvatar = document.getElementById('userAvatar');
    if (userAvatar) {
        if (user.avatar && user.avatar !== '') {
            userAvatar.innerHTML = `<img src="${user.avatar}" alt="${user.username}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">`;
        } else {
            userAvatar.innerHTML = '<i class="fas fa-user-circle"></i>';
        }
    }
    
    // Atualizar menu dropdown
    const dropdownMenu = document.getElementById('dropdownMenu');
    if (dropdownMenu) {
        // Mostrar links logados
        document.getElementById('myChannelLink')?.style.setProperty('display', 'flex');
        document.getElementById('profileLink')?.style.setProperty('display', 'flex');
        document.getElementById('revenueLink')?.style.setProperty('display', 'flex');
        document.getElementById('manageVideosLink')?.style.setProperty('display', 'flex');
        document.getElementById('menuDivider')?.style.setProperty('display', 'block');
        document.getElementById('logoutLink')?.style.setProperty('display', 'flex');
        
        // Esconder links de login/registro
        const loginLink = document.querySelector('.login-link');
        const registerLink = document.getElementById('registerLink');
        if (loginLink) loginLink.style.display = 'none';
        if (registerLink) registerLink.style.display = 'none';
    }
    
    // Atualizar sidebar
    document.getElementById('myChannelSidebarLink')?.style.setProperty('display', 'flex');
    document.getElementById('manageVideosSidebarLink')?.style.setProperty('display', 'flex');
    document.getElementById('revenueSidebarLink')?.style.setProperty('display', 'flex');
    
    // Mostrar botão de upload
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) uploadBtn.style.display = 'block';
}

function updateUserUILoggedOut() {
    const userAvatar = document.getElementById('userAvatar');
    if (userAvatar) {
        userAvatar.innerHTML = '<i class="fas fa-user-circle"></i>';
    }
    
    // Esconder links logados
    document.getElementById('myChannelLink')?.style.setProperty('display', 'none');
    document.getElementById('profileLink')?.style.setProperty('display', 'none');
    document.getElementById('revenueLink')?.style.setProperty('display', 'none');
    document.getElementById('manageVideosLink')?.style.setProperty('display', 'none');
    document.getElementById('menuDivider')?.style.setProperty('display', 'none');
    document.getElementById('logoutLink')?.style.setProperty('display', 'none');
    
    // Mostrar links de login/registro
    const loginLink = document.querySelector('.login-link');
    const registerLink = document.getElementById('registerLink');
    if (loginLink) loginLink.style.display = 'flex';
    if (registerLink) registerLink.style.display = 'flex';
    
    // Esconder sidebar links logados
    document.getElementById('myChannelSidebarLink')?.style.setProperty('display', 'none');
    document.getElementById('manageVideosSidebarLink')?.style.setProperty('display', 'none');
    document.getElementById('revenueSidebarLink')?.style.setProperty('display', 'none');
    
    // Esconder botão de upload
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) uploadBtn.style.display = 'none';
}

// Carregar sessão ao iniciar página
document.addEventListener('DOMContentLoaded', () => {
    loadUserSession();
    
    // Setup logout
    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await fetch('php/logout.php');
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Erro ao fazer logout:', error);
            }
        });
    }
});

function updateVideoCountMenu(count) {
    const myChannelLink = document.getElementById('myChannelLink');
    if (myChannelLink) {
        let txt = myChannelLink.textContent.replace(/\(\d+\)/, '').trim();
        myChannelLink.textContent = `${txt} (${count})`;
    }
    const myChannelSidebarLink = document.getElementById('myChannelSidebarLink');
    if (myChannelSidebarLink) {
        let txt = myChannelSidebarLink.textContent.replace(/\(\d+\)/, '').trim();
        myChannelSidebarLink.textContent = `${txt} (${count})`;
    }
}

