// YouTube Style My Channel - Global variables
let currentUser = null;
let allVideos = [];
let allShorts = [];

function checkChannelAuth() {
    const user = localStorage.getItem('user');
    if (!user) {
        console.error('❌ Nenhum usuário no localStorage');
        window.location.href = 'login.html';
        return null;
    }
    try {
        currentUser = JSON.parse(user);
        console.log('✅ Usuário carregado do localStorage:', currentUser);
        console.log('   - ID:', currentUser.id);
        console.log('   - Username:', currentUser.username);
        console.log('   - Email:', currentUser.email);
        return currentUser;
    } catch (error) {
        console.error('❌ Erro ao parsear usuário:', error);
        window.location.href = 'login.html';
        return null;
    }
}

async function loadChannelInfo() {
    if (!currentUser) return;
    try {
        console.log('📊 Carregando info do canal para user ID:', currentUser.id);
        const response = await fetch('php/get-profile.php', {
            headers: { 'X-User-Id': currentUser.id.toString() }
        });
        const data = await response.json();
        console.log('✅ Resposta get-profile:', data);
        
        if (data.success) {
            // Use data directly, not data.profile (both are available for compatibility)
            updateChannelHeader(data);
            updateAboutTab(data);
        } else {
            console.error('❌ Erro ao carregar perfil:', data.message);
        }
        
        // Load channel customization (banner, links)
        await loadChannelCustomization();
    } catch (error) {
        console.error('❌ Erro ao carregar info do canal:', error);
    }
}

async function loadChannelCustomization() {
    if (!currentUser) return;
    try {
        const response = await fetch('php/get-channel-customization.php', {
            headers: { 'X-User-Id': currentUser.id.toString() }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('🎨 Customização carregada:', data);
            
            // Set banner - check if data has the banner property
            const banner = document.querySelector('.channel-banner');
            console.log('🎨 Banner element:', banner);
            console.log('🎨 data.success:', data.success);
            console.log('🎨 data.banner:', data.banner);
            console.log('🎨 data.watermark:', data.watermark);
            
            if (data.success && data.banner && data.banner !== '' && data.banner !== null) {
                console.log('🎨 Banner URL recebida:', data.banner);
                
                if (banner) {
                    // Add timestamp to force cache refresh
                    const bannerUrl = data.banner + '?t=' + new Date().getTime();
                    console.log('🎨 Banner URL com cache-buster:', bannerUrl);
                    
                    // Set styles with high priority
                    banner.style.setProperty('background-image', `url('${bannerUrl}')`, 'important');
                    banner.style.setProperty('background-size', 'cover', 'important');
                    banner.style.setProperty('background-position', 'center', 'important');
                    banner.style.setProperty('background-repeat', 'no-repeat', 'important');
                    
                    console.log('✅ Banner style aplicado com !important!');
                    console.log('✅ backgroundImage:', banner.style.backgroundImage);
                    console.log('✅ Computed style:', window.getComputedStyle(banner).backgroundImage);
                } else {
                    console.error('❌ Elemento .channel-banner não encontrado no DOM!');
                }
            } else {
                console.log('ℹ️ Nenhum banner personalizado encontrado');
                console.log('ℹ️ Usando banner padrão (gradiente CSS)');
            }
            
            // Set watermark if exists
            if (data.success && data.watermark && data.watermark !== '' && data.watermark !== null) {
                console.log('💧 Marca d\'água encontrada:', data.watermark);
                // TODO: Implementar exibição de marca d'água
                // A marca d'água geralmente aparece nos vídeos, não na página do canal
            }
            
            // Set links in about tab (if exists)
            if (data.success && data.links) {
                try {
                    const links = JSON.parse(data.links);
                    if (links && links.length > 0) {
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
                } catch (e) {
                    console.log('ℹ️ Links não são JSON válido ou estão vazios');
                }
            }
        } else {
            console.log('ℹ️ Resposta não-OK ao buscar customização');
        }
    } catch (error) {
        console.error('Erro ao carregar customização:', error);
    }
}

function updateChannelHeader(profile) {
    const avatar = document.getElementById('channelAvatar');
    if (profile.profile_image) {
        avatar.src = profile.profile_image;
    }
    
    document.getElementById('channelName').textContent = profile.username || 'Meu Canal';
    document.getElementById('channelHandle').textContent = '@' + (profile.username || 'usuario').toLowerCase().replace(/\s+/g, '');
    
    const descPreview = document.getElementById('channelDescriptionPreview');
    if (profile.bio && profile.bio.trim() !== '') {
        descPreview.textContent = profile.bio.substring(0, 100);
        if (profile.bio.length > 100) descPreview.textContent += '...';
    } else {
        descPreview.textContent = '';
    }
}

function updateAboutTab(profile) {
    document.getElementById('channelDescriptionFull').textContent = profile.bio || 'Sem descrição';
    if (profile.created_at) {
        const date = new Date(profile.created_at);
        const options = { year: 'numeric', month: 'short' };
        document.getElementById('joinedDate').textContent = date.toLocaleDateString('pt-BR', options);
    }
}

async function loadChannelStats() {
    if (!currentUser) return;
    try {
        console.log('📈 Carregando estatísticas para user ID:', currentUser.id);
        const response = await fetch('php/get-channel-stats.php', {
            headers: { 'X-User-Id': currentUser.id.toString() }
        });
        const stats = await response.json();
        console.log('✅ Estatísticas carregadas:', stats);
        
        const subCount = stats.subscribers || 0;
        document.getElementById('subscriberCount').textContent = subCount === 1 ? '1 inscrito' : `${subCount} inscritos`;
        
        const vidCount = stats.videoCount || stats.videos || 0;
        document.getElementById('videoCount').textContent = vidCount === 1 ? '1 vídeo' : `${vidCount} vídeos`;
        
        // Update about tab stats
        if (document.getElementById('subscribersAbout')) {
            document.getElementById('subscribersAbout').textContent = subCount === 1 ? '1 inscrito' : `${subCount} inscritos`;
        }
        if (document.getElementById('videosAbout')) {
            document.getElementById('videosAbout').textContent = vidCount === 1 ? '1 vídeo' : `${vidCount} vídeos`;
        }
        if (document.getElementById('totalViewsAbout')) {
            const totalViews = stats.totalViews || stats.total_views || 0;
            document.getElementById('totalViewsAbout').textContent = formatViews(totalViews) + ' visualizações';
        }
    } catch (error) {
        console.error('❌ Erro ao carregar estatísticas:', error);
    }
}

async function loadAllVideos() {
    if (!currentUser) {
        console.error('❌ currentUser is null ou undefined!');
        return;
    }
    
    console.log('🎬 =================================');
    console.log('🎬 CARREGANDO VÍDEOS');
    console.log('🎬 User ID:', currentUser.id);
    console.log('🎬 =================================');
    
    try {
        const response = await fetch('php/get-user-videos.php', {
            headers: { 'X-User-Id': currentUser.id.toString() }
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response OK:', response.ok);
        
        if (!response.ok) {
            console.error('❌ Erro HTTP:', response.status);
            allVideos = [];
            allShorts = [];
            displayAllVideosGrid([]);
            displayAllShortsGrid([]);
            return;
        }
        
        const videos = await response.json();
        console.log('✅ Vídeos carregados:', videos);
        console.log('📊 Total de vídeos:', videos.length);
        console.log('📦 Tipo:', Array.isArray(videos) ? 'Array' : typeof videos);
        
        // Check if it's an error response
        if (videos.success === false) {
            console.error('❌ Erro do servidor:', videos.message);
            allVideos = [];
            allShorts = [];
        } else {
            allVideos = Array.isArray(videos) ? videos : [];
        }
        
        // Separate shorts and regular videos
        allShorts = allVideos.filter(v => parseDuration(v.duration) < 60);
        const regularVideos = allVideos.filter(v => parseDuration(v.duration) >= 60);
        
        console.log('🎞️ Vídeos regulares:', regularVideos.length);
        console.log('📱 Shorts:', allShorts.length);
        
        // List all video titles for debugging
        if (allVideos.length > 0) {
            console.log('📋 Títulos dos vídeos:');
            allVideos.forEach((v, i) => {
                console.log(`  ${i + 1}. "${v.title}" (ID: ${v.id}, Duração: ${v.duration})`);
            });
        }
        
        // Display videos in all sections
        console.log('🎨 =================================');
        console.log('🎨 RENDERIZANDO VÍDEOS');
        console.log('🎨 =================================');
        
        console.log('📺 Chamando displayShortsSection com', allShorts.slice(0, 6).length, 'shorts');
        displayShortsSection(allShorts.slice(0, 6));
        
        console.log('📺 Chamando displayVideosHorizontal com', regularVideos.slice(0, 10).length, 'vídeos');
        displayVideosHorizontal(regularVideos.slice(0, 10));
        
        console.log('📺 Chamando displayAllVideosGrid com', allVideos.length, 'vídeos');
        displayAllVideosGrid(allVideos);
        
        console.log('📺 Chamando displayAllShortsGrid com', allShorts.length, 'shorts');
        displayAllShortsGrid(allShorts);
        
        console.log('✅ =================================');
        console.log('✅ RENDERIZAÇÃO COMPLETA');
        console.log('✅ =================================');
        
    } catch (error) {
        console.error('❌ Erro ao carregar vídeos:', error);
        console.error('❌ Stack trace:', error.stack);
        allVideos = [];
        allShorts = [];
        displayAllVideosGrid([]);
        displayAllShortsGrid([]);
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
        <div class="short-card-yt" onclick="window.location.href='watch.html?v=${short.id}'">
            <div class="short-thumbnail">
                <img src="${short.thumbnail || 'assets/default-thumbnail.jpg'}" alt="${short.title}">
                <div class="short-duration">${short.duration || '0:00'}</div>
            </div>
            <div class="short-title">${short.title}</div>
            <div class="short-views">${formatViews(short.views)} visualizações</div>
        </div>
    `).join('');
}

function displayVideosHorizontal(videos) {
    const videosSection = document.getElementById('videosSection');
    const container = document.getElementById('videosScroll');
    
    if (videos.length === 0) {
        videosSection.style.display = 'none';
        return;
    }
    
    videosSection.style.display = 'block';
    container.innerHTML = videos.map(video => `
        <div class="video-card-horizontal" onclick="window.location.href='watch.html?v=${video.id}'">
            <div class="video-thumbnail-container">
                <img src="${video.thumbnail || 'assets/default-thumbnail.jpg'}" alt="${video.title}">
                <div class="video-duration">${video.duration || '0:00'}</div>
            </div>
            <div class="video-info-horizontal">
                <div class="video-title-horizontal">${video.title}</div>
                <div class="video-meta-horizontal">${formatViews(video.views)} visualizações • ${formatDate(video.created_at)}</div>
            </div>
        </div>
    `).join('');
}

function displayAllVideosGrid(videos) {
    console.log('🎯 displayAllVideosGrid CHAMADA');
    console.log('🎯 Parâmetro videos:', videos);
    console.log('🎯 Tipo:', Array.isArray(videos) ? 'Array' : typeof videos);
    console.log('🎯 Length:', videos ? videos.length : 'N/A');
    
    const container = document.getElementById('allVideosGrid');
    console.log('🎯 Container allVideosGrid:', container ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
    
    if (!container) {
        console.error('❌ Container allVideosGrid não encontrado no DOM!');
        console.error('❌ Verifique se my-channel.html tem <div id="allVideosGrid">');
        return;
    }
    
    if (!videos || videos.length === 0) {
        console.log('⚠️ Nenhum vídeo para exibir - mostrando mensagem de "sem conteúdo"');
        container.innerHTML = '<div class="no-content"><i class="fas fa-video"></i><h3>Nenhum vídeo publicado</h3><p>Publique seu primeiro vídeo para aparecer aqui!</p></div>';
        return;
    }
    
    console.log('🎨 Gerando HTML para', videos.length, 'vídeos...');
    
    const html = videos.map((video, index) => {
        console.log(`  📹 ${index + 1}. ${video.title}`);
        return `
        <a href="watch.html?v=${video.id}" class="video-card">
            <div class="video-thumbnail">
                <img src="${video.thumbnail || 'https://via.placeholder.com/320x180'}" alt="${video.title}">
                <div class="video-duration">${video.duration || '0:00'}</div>
            </div>
            <div class="video-details">
                <h3 class="video-title">${video.title}</h3>
                <p class="video-stats">${formatViews(video.views)} visualizações • ${formatDate(video.created_at)}</p>
            </div>
        </a>
    `;
    }).join('');
    
    console.log('🎨 HTML gerado, tamanho:', html.length, 'caracteres');
    
    container.innerHTML = html;
    
    console.log('✅ container.innerHTML definido');
    console.log('✅ container.children.length:', container.children.length);
    console.log('✅ Grid renderizado com sucesso!');
}

function displayAllShortsGrid(shorts) {
    const container = document.getElementById('allShortsGrid');
    if (shorts.length === 0) {
        container.innerHTML = '<div class="no-content"><i class="fab fa-youtube" style="color: #ff0000;"></i><h3>Nenhum Short publicado</h3><p>Publique vídeos curtos (menos de 60 segundos) para aparecerem aqui!</p></div>';
        return;
    }
    container.innerHTML = shorts.map(short => `
        <div class="short-card-yt" onclick="window.location.href='watch.html?v=${short.id}'">
            <div class="short-thumbnail">
                <img src="${short.thumbnail || 'assets/default-thumbnail.jpg'}" alt="${short.title}">
                <div class="short-duration">${short.duration || '0:00'}</div>
            </div>
            <div class="short-title">${short.title}</div>
            <div class="short-views">${formatViews(short.views)} visualizações</div>
        </div>
    `).join('');
}

function setupTabNavigation() {
    const tabs = document.querySelectorAll('.channel-tab');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            // Remove active from all tabs and panes
            tabs.forEach(t => t.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Add active to clicked tab
            tab.classList.add('active');
            
            // Add active to corresponding pane
            const targetPane = document.getElementById(`${tabName}-content`);
            if (targetPane) {
                targetPane.classList.add('active');
            }
        });
    });
}

function setupFilterButtons() {
    const filterBtns = document.querySelectorAll('.filter-btn-yt');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            let sortedVideos = [...allVideos];
            if (filter === 'popular') {
                sortedVideos.sort((a, b) => (b.views || 0) - (a.views || 0));
            } else if (filter === 'oldest') {
                sortedVideos.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            } else {
                sortedVideos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            }
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

// Menu and theme handling
function setupMenuAndTheme() {
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.getElementById('sidebar');
    const themeToggle = document.getElementById('themeToggle');
    
    // Close sidebar on channel pages for better viewing
    if (sidebar) {
        sidebar.classList.remove('active');
        console.log('✅ Sidebar fechada para melhor visualização do canal');
    }
    
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
}

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

// Setup upload modal
function setupUploadModal() {
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadModal = document.getElementById('uploadModal');
    const closeModal = document.getElementById('closeModal');
    const cancelUpload = document.getElementById('cancelUpload');
    
    uploadBtn?.addEventListener('click', () => uploadModal?.classList.add('active'));
    closeModal?.addEventListener('click', () => uploadModal?.classList.remove('active'));
    cancelUpload?.addEventListener('click', () => uploadModal?.classList.remove('active'));
    uploadModal?.addEventListener('click', (e) => { 
        if (e.target === uploadModal) uploadModal.classList.remove('active'); 
    });
}

// Setup action buttons
function setupActionButtons() {
    document.querySelector('.btn-customize-channel')?.addEventListener('click', () => {
        window.location.href = 'customize-channel.html';
    });
    document.querySelector('.btn-manage-videos')?.addEventListener('click', () => {
        window.location.href = 'manage-videos.html';
    });
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando página My Channel...');
    
    currentUser = checkChannelAuth();
    if (currentUser) {
        console.log('✅ Usuário autenticado:', currentUser);
        
        // Setup UI
        setupMenuAndTheme();
        setupUploadModal();
        setupActionButtons();
        setupTabNavigation();
        setupFilterButtons();
        
        // Load data
        loadChannelInfo();
        loadChannelStats();
        loadAllVideos();
        loadSubscriptions();
        
        // Extra: Force load banner after a delay to ensure DOM is ready
        setTimeout(() => {
            console.log('🔄 Re-carregando customização após 500ms...');
            loadChannelCustomization();
        }, 500);
    } else {
        console.error('❌ Usuário não autenticado, redirecionando...');
    }
});
