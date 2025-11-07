// YouTube Style My Channel - Global variables
let currentUser = null;
let allVideos = [];
let allShorts = [];

function checkChannelAuth() {
    const user = localStorage.getItem('user');
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    try {
        currentUser = JSON.parse(user);
        return currentUser;
    } catch (error) {
        console.error('Erro:', error);
        window.location.href = 'login.html';
        return null;
    }
}

async function loadChannelInfo() {
    if (!currentUser) return;
    try {
        const response = await fetch('php/get-profile.php', {
            headers: { 'X-User-Id': currentUser.id }
        });
        const data = await response.json();
        if (data.success) {
            updateChannelHeader(data.profile);
            updateAboutTab(data.profile);
        }
        
        // Load channel customization (banner, links)
        await loadChannelCustomization();
    } catch (error) {
        console.error('Erro:', error);
    }
}

async function loadChannelCustomization() {
    if (!currentUser) return;
    try {
        const response = await fetch('php/get-channel-customization.php', {
            headers: { 'X-User-Id': currentUser.id }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('🎨 Customização carregada:', data);
            
            // Set banner
            const banner = document.querySelector('.channel-banner');
            if (data.banner && banner) {
                banner.style.backgroundImage = `url('${data.banner}')`;
                banner.style.backgroundSize = 'cover';
                banner.style.backgroundPosition = 'center';
            }
            
            // Set links in about tab (if exists)
            if (data.links) {
                const links = JSON.parse(data.links);
                if (links.length > 0) {
                    const aboutContent = document.querySelector('.about-content');
                    if (aboutContent) {
                        const linksSection = document.createElement('div');
                        linksSection.className = 'about-item';
                        linksSection.innerHTML = `
                            <h3>Links</h3>
                            ${links.map(link => `
                                <p><a href="${link.url}" target="_blank" class="channel-link">
                                    <i class="fas fa-link"></i> ${link.title}
                                </a></p>
                            `).join('')}
                        `;
                        aboutContent.appendChild(linksSection);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Erro ao carregar customização:', error);
    }
}

function updateChannelHeader(profile) {
    const avatar = document.getElementById('channelAvatar');
    const avatarIcon = document.getElementById('channelAvatarIcon');
    if (profile.profile_image) {
        avatar.src = profile.profile_image;
        avatar.style.display = 'block';
        avatarIcon.style.display = 'none';
    } else {
        avatar.style.display = 'none';
        avatarIcon.style.display = 'block';
    }
    document.getElementById('channelName').textContent = profile.username || 'Meu Canal';
    document.getElementById('channelUsername').textContent = '@' + (profile.username || 'usuario');
    const descText = document.getElementById('descriptionText');
    if (profile.bio && profile.bio.trim() !== '') {
        descText.textContent = profile.bio.substring(0, 100);
        if (profile.bio.length > 100) descText.textContent += '...';
    } else {
        descText.textContent = 'Saiba mais sobre este canal';
    }
}

function updateAboutTab(profile) {
    document.getElementById('aboutDescription').textContent = profile.bio || 'Sem descrição';
    if (profile.created_at) {
        const date = new Date(profile.created_at);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('joinDate').textContent = date.toLocaleDateString('pt-BR', options);
    }
}

async function loadChannelStats() {
    if (!currentUser) return;
    try {
        const response = await fetch('php/get-channel-stats.php', {
            headers: { 'X-User-Id': currentUser.id }
        });
        const stats = await response.json();
        const subCount = stats.subscribers || 0;
        document.getElementById('subscriberCount').textContent = subCount === 1 ? '1 inscrito' : `${subCount} inscritos`;
        const vidCount = stats.videoCount || stats.videos || 0;
        document.getElementById('videoCount').textContent = vidCount === 1 ? '1 vídeo' : `${vidCount} vídeos`;
        if (document.getElementById('totalViews')) {
            document.getElementById('totalViews').textContent = stats.totalViews || stats.total_views || 0;
        }
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

async function loadAllVideos() {
    if (!currentUser) return;
    try {
        const response = await fetch('php/get-user-videos.php', {
            headers: { 'X-User-Id': currentUser.id }
        });
        const videos = await response.json();
        allVideos = videos;
        allShorts = videos.filter(v => parseDuration(v.duration) < 60);
        const regularVideos = videos.filter(v => parseDuration(v.duration) >= 60);
        displayShortsSection(allShorts.slice(0, 6));
        displayVideosHorizontal(regularVideos.slice(0, 10));
        displayAllVideosGrid(videos);
        displayAllShortsGrid(allShorts);
    } catch (error) {
        console.error('Erro ao carregar vídeos:', error);
    }
}

function parseDuration(duration) {
    if (!duration) return 0;
    const parts = duration.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
}

function displayShortsSection(shorts) {
    const shortsSection = document.getElementById('shortsSection');
    const shortsGrid = document.getElementById('shortsGrid');
    if (shorts.length === 0) {
        shortsSection.style.display = 'none';
        return;
    }
    shortsSection.style.display = 'block';
    shortsGrid.innerHTML = shorts.map(short => `
        <div class="short-card" onclick="window.location.href='watch.html?v=${short.id}'">
            <img src="${short.thumbnail || 'assets/default-thumbnail.jpg'}" alt="${short.title}">
            <div class="short-duration">${short.duration || '0:00'}</div>
            <div class="short-info">
                <div class="short-title">${short.title}</div>
                <div class="short-views">${formatViews(short.views)} visualizações</div>
            </div>
        </div>
    `).join('');
}

function displayVideosHorizontal(videos) {
    const container = document.getElementById('videosHorizontalScroll');
    if (videos.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary);">Nenhum vídeo publicado ainda</p>';
        return;
    }
    container.innerHTML = videos.map(video => `
        <div class="video-card-horizontal" onclick="window.location.href='watch.html?v=${video.id}'">
            <div class="video-thumbnail">
                <img src="${video.thumbnail || 'assets/default-thumbnail.jpg'}" alt="${video.title}">
                <div class="video-duration">${video.duration || '0:00'}</div>
            </div>
            <div class="video-info-hor">
                <div class="video-title">${video.title}</div>
                <div class="video-meta">${formatViews(video.views)} visualizações • ${formatDate(video.created_at)}</div>
            </div>
        </div>
    `).join('');
}

function displayAllVideosGrid(videos) {
    const container = document.getElementById('allVideosGrid');
    if (videos.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-secondary);"><i class="fas fa-video" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i><h3>Nenhum vídeo publicado</h3><p>Publique seu primeiro vídeo para aparecer aqui!</p></div>';
        return;
    }
    container.innerHTML = videos.map(video => `
        <div class="video-card-horizontal" onclick="window.location.href='watch.html?v=${video.id}'">
            <div class="video-thumbnail">
                <img src="${video.thumbnail || 'assets/default-thumbnail.jpg'}" alt="${video.title}">
                <div class="video-duration">${video.duration || '0:00'}</div>
            </div>
            <div class="video-info-hor">
                <div class="video-title">${video.title}</div>
                <div class="video-meta">${formatViews(video.views)} visualizações • ${formatDate(video.created_at)}</div>
            </div>
        </div>
    `).join('');
}

function displayAllShortsGrid(shorts) {
    const container = document.getElementById('allShortsGrid');
    if (shorts.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-secondary);"><i class="fab fa-youtube" style="font-size: 48px; margin-bottom: 16px; color: #ff0000; opacity: 0.5;"></i><h3>Nenhum Short publicado</h3><p>Publique vídeos curtos (menos de 60 segundos) para aparecerem aqui!</p></div>';
        return;
    }
    container.innerHTML = shorts.map(short => `
        <div class="short-card" onclick="window.location.href='watch.html?v=${short.id}'">
            <img src="${short.thumbnail || 'assets/default-thumbnail.jpg'}" alt="${short.title}">
            <div class="short-duration">${short.duration || '0:00'}</div>
            <div class="short-info">
                <div class="short-title">${short.title}</div>
                <div class="short-views">${formatViews(short.views)} visualizações</div>
            </div>
        </div>
    `).join('');
}

function setupTabNavigation() {
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content-yt');
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            navTabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`${tabName}Tab`).classList.add('active');
        });
    });
}

function setupFilterButtons() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            let sortedVideos = [...allVideos];
            if (filter === 'popular') sortedVideos.sort((a, b) => b.views - a.views);
            else if (filter === 'oldest') sortedVideos.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            else sortedVideos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            displayAllVideosGrid(sortedVideos);
        });
    });
}

function formatViews(views) {
    if (views >= 1000000) return (views / 1000000).toFixed(1) + ' mi';
    if (views >= 1000) return (views / 1000).toFixed(1) + ' mil';
    return views || 0;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `há ${diffDays} dias`;
    if (diffDays < 30) return `há ${Math.floor(diffDays / 7)} semanas`;
    if (diffDays < 365) return `há ${Math.floor(diffDays / 30)} meses`;
    return `há ${Math.floor(diffDays / 365)} anos`;
}

const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const themeToggle = document.getElementById('themeToggle');
menuBtn?.addEventListener('click', () => sidebar?.classList.toggle('active'));
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
themeToggle?.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggle.querySelector('i').className = newTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
});

async function loadSubscriptions() {
    const user = localStorage.getItem('user');
    if (!user) return;
    try {
        const userData = JSON.parse(user);
        const response = await fetch('php/get-user-subscriptions.php', {
            headers: { 'X-User-Id': userData.id }
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
        <a href="channel.html?id=${channel.id}" class="nav-item subscription-item">
            ${channel.avatar ? `<img src="${channel.avatar}" alt="${channel.username}" class="channel-avatar-small">` : '<i class="fas fa-user-circle"></i>'}
            <span>${channel.username}</span>
        </a>
    `).join('');
}

const uploadBtn = document.getElementById('uploadBtn');
const uploadModal = document.getElementById('uploadModal');
const closeModal = document.getElementById('closeModal');
const cancelUpload = document.getElementById('cancelUpload');
uploadBtn?.addEventListener('click', () => uploadModal?.classList.add('active'));
closeModal?.addEventListener('click', () => uploadModal?.classList.remove('active'));
cancelUpload?.addEventListener('click', () => uploadModal?.classList.remove('active'));
uploadModal?.addEventListener('click', (e) => { if (e.target === uploadModal) uploadModal.classList.remove('active'); });
document.querySelector('.btn-customize-channel')?.addEventListener('click', () => window.location.href = 'customize-channel.html');
document.querySelector('.btn-manage-videos')?.addEventListener('click', () => window.location.href = 'manage-videos.html');

document.addEventListener('DOMContentLoaded', function() {
    currentUser = checkChannelAuth();
    if (currentUser) {
        loadChannelInfo();
        loadChannelStats();
        loadAllVideos();
        loadSubscriptions();
        setupTabNavigation();
        setupFilterButtons();
    }
});
