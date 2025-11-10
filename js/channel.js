// Get channel ID from URL
const urlParams = new URLSearchParams(window.location.search);
const channelId = urlParams.get('id');

let currentUser = null;
let channelData = null;
let allVideos = [];
let allShorts = [];
let isSubscribed = false;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎬 Channel page loaded, ID:', channelId, 'Type:', typeof channelId);
    console.log('🔗 Full URL:', window.location.href);
    
    // Close sidebar for better channel viewing
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.remove('active');
        console.log('✅ Sidebar fechada para melhor visualização do canal');
    }
    
    if (!channelId) {
        alert('Canal não encontrado!');
        window.location.href = 'index.html';
        return;
    }
    
    // Validate channelId is a valid number
    const channelIdNum = parseInt(channelId);
    if (isNaN(channelIdNum) || channelIdNum <= 0) {
        alert('ID do canal inválido!');
        window.location.href = 'index.html';
        return;
    }
    
    console.log('✅ Valid channel ID:', channelIdNum);

    // Get current user
    const userStr = localStorage.getItem('user');
    if (userStr) {
        currentUser = JSON.parse(userStr);
    }

    // Load channel data
    await loadChannelInfo();
    await loadChannelStats();
    await loadSubscriptionStatus();
    await loadAllVideos();
    
    // Setup event listeners
    setupTabNavigation();
    setupFilterButtons();
    setupSubscribeButton();
    
    // Extra: Force load customization after a delay to ensure DOM is ready
    setTimeout(() => {
        console.log('🔄 Re-carregando customização após 500ms...');
        loadChannelCustomization();
    }, 500);
});

// Load channel information
async function loadChannelInfo() {
    try {
        const response = await fetch('php/get-profile.php', {
            headers: {
                'X-User-Id': channelId
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load channel - HTTP ' + response.status);
        }

        const data = await response.json();
        console.log('👤 Channel info:', data);
        
        // Check if request was successful
        if (!data.success) {
            throw new Error(data.message || 'Erro ao carregar perfil');
        }
        
        // Store channel data
        channelData = data;

        // Update channel info using the correct data structure
        const username = data.username || data.profile?.username || 'Canal';
        const bio = data.bio || data.profile?.bio || '';
        const profileImage = data.profile_image || data.profile?.profile_image;
        const createdAt = data.created_at || data.profile?.created_at;

        document.getElementById('channelName').textContent = username;
        document.getElementById('channelHandle').textContent = `@${username.toLowerCase().replace(/\s+/g, '')}`;
        
        if (profileImage) {
            document.getElementById('channelAvatar').src = profileImage;
        }

        if (bio) {
            document.getElementById('channelDescriptionPreview').textContent = bio.substring(0, 100) + (bio.length > 100 ? '...' : '');
            document.getElementById('channelDescriptionFull').textContent = bio;
        }

        // Load customization (banner, links)
        await loadChannelCustomization();

        // Update about tab
        if (createdAt) {
            document.getElementById('joinedDate').textContent = new Date(createdAt).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        }

    } catch (error) {
        console.error('❌ Error loading channel:', error);
        alert('Erro ao carregar canal: ' + error.message);
    }
}

// Load channel customization
async function loadChannelCustomization() {
    try {
        const response = await fetch('php/get-channel-customization.php', {
            headers: {
                'X-User-Id': channelId.toString()
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('🎨 Channel customization:', data);

            // Set banner ONLY if exists for THIS channel
            const banner = document.getElementById('channelBanner');
            console.log('🎨 Banner element:', banner);
            
            if (data.success && data.banner) {
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
                    
                    console.log('✅ Banner loaded for channel:', channelId);
                    console.log('✅ backgroundImage:', banner.style.backgroundImage);
                    console.log('✅ Computed style:', window.getComputedStyle(banner).backgroundImage);
                } else {
                    console.error('❌ Elemento #channelBanner não encontrado no DOM!');
                }
            } else {
                console.log('ℹ️ No banner for channel:', channelId);
                console.log('ℹ️ data.success:', data.success);
                console.log('ℹ️ data.banner:', data.banner);
            }

            // Set links
            if (data.success && data.links) {
                try {
                    const links = JSON.parse(data.links);
                    if (links && links.length > 0) {
                        const linksBox = document.getElementById('linksBox');
                        linksBox.style.display = 'block';
                        
                        const linksContainer = document.getElementById('channelLinks');
                        linksContainer.innerHTML = links.map(link => `
                            <a href="${link.url}" target="_blank" class="channel-link">
                                <i class="fas fa-link"></i>
                                ${link.title}
                            </a>
                        `).join('');
                    }
                } catch (e) {
                    console.log('ℹ️ Error parsing links');
                }
            }
        }
    } catch (error) {
        console.error('Error loading customization:', error);
    }
}

// Load channel statistics
async function loadChannelStats() {
    try {
        const response = await fetch('php/get-channel-stats.php', {
            headers: {
                'X-User-Id': channelId
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('📊 Channel stats:', data);

            // Update subscriber count
            const subCount = formatNumber(data.subscribers || 0);
            document.getElementById('subscriberCount').textContent = `${subCount} inscritos`;
            document.getElementById('subscribersAbout').textContent = `${subCount} inscritos`;

            // Update video count
            const videoCount = data.videoCount || data.videos || 0;
            document.getElementById('videoCount').textContent = `${videoCount} vídeos`;
            document.getElementById('videosAbout').textContent = `${videoCount} vídeos`;

            // Update total views
            const totalViews = data.totalViews || data.total_views || 0;
            document.getElementById('totalViewsAbout').textContent = `${formatNumber(totalViews)} visualizações`;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load subscription status
async function loadSubscriptionStatus() {
    if (!currentUser) {
        // Not logged in - show simple subscribe button
        const subscribeBtn = document.getElementById('subscribeBtn');
        subscribeBtn.innerHTML = `
            <i class="fas fa-bell"></i>
            <span>Inscrever-se</span>
        `;
        return;
    }

    try {
        const response = await fetch(`php/check-subscription.php?channel_id=${channelId}`, {
            headers: {
                'X-User-Id': currentUser.id.toString()
            }
        });

        if (response.ok) {
            const data = await response.json();
            isSubscribed = data.subscribed;
            console.log('📊 Subscription status loaded:', isSubscribed);
            updateSubscribeButton();
        }
    } catch (error) {
        console.error('Error checking subscription:', error);
    }
}

// Update subscribe button appearance
function updateSubscribeButton() {
    const subscribeBtn = document.getElementById('subscribeBtn');
    
    if (currentUser && parseInt(channelId) === currentUser.id) {
        // Own channel - hide button
        subscribeBtn.style.display = 'none';
        return;
    }

    if (isSubscribed) {
        subscribeBtn.classList.add('subscribed');
        subscribeBtn.innerHTML = `
            <i class="fas fa-bell"></i>
            <span>Inscrito</span>
        `;
    } else {
        subscribeBtn.classList.remove('subscribed');
        subscribeBtn.innerHTML = `
            <i class="fas fa-bell"></i>
            <span></span>
        `;
    }
}

// Setup subscribe button
function setupSubscribeButton() {
    const subscribeBtn = document.getElementById('subscribeBtn');
    
    subscribeBtn.addEventListener('click', async () => {
        if (!currentUser) {
            alert('Faça login para se inscrever!');
            window.location.href = 'login.html';
            return;
        }

        console.log('🔔 Subscribe button clicked - Channel ID:', channelId, 'User ID:', currentUser.id);

        try {
            const requestData = {
                channelId: parseInt(channelId)
            };
            
            console.log('📤 Sending subscribe request:', requestData);
            
            const response = await fetch('php/subscribe.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': currentUser.id.toString()
                },
                body: JSON.stringify(requestData)
            });

            const data = await response.json();
            console.log('📥 Subscribe response:', data);
            
            if (data.success) {
                isSubscribed = data.subscribed;
                updateSubscribeButton();
                
                // Update subscriber count
                await loadChannelStats();
                
                console.log('✅ Subscription toggled successfully:', isSubscribed ? 'SUBSCRIBED' : 'UNSUBSCRIBED');
            } else {
                console.error('❌ Subscribe error from server:', data.message);
                alert('Erro do servidor: ' + (data.message || 'Erro ao processar inscrição!'));
            }
        } catch (error) {
            console.error('❌ Error toggling subscription:', error);
            alert('Erro ao processar inscrição!');
        }
    });
}

// Load all videos
async function loadAllVideos() {
    try {
        console.log('🎬 Carregando vídeos do canal:', channelId);
        const response = await fetch('php/get-user-videos.php', {
            headers: {
                'X-User-Id': channelId.toString()
            }
        });

        if (!response.ok) {
            console.error('❌ Erro HTTP ao carregar vídeos:', response.status);
            return;
        }

        const videos = await response.json();
        console.log('✅ Vídeos carregados:', videos);
        console.log('� Total de vídeos:', videos.length);

        // Check if error response
        if (videos.success === false) {
            console.error('❌ Erro do servidor:', videos.message);
            allVideos = [];
            allShorts = [];
        } else {
            // Filter only public videos (unless viewing own channel)
            let visibleVideos = Array.isArray(videos) ? videos : [];
            if (!currentUser || parseInt(channelId) !== currentUser.id) {
                // Show videos that are public or don't have visibility set (default to public)
                visibleVideos = visibleVideos.filter(v => !v.visibility || v.visibility === 'public');
                console.log('👁️ Vídeos públicos visíveis:', visibleVideos.length);
            } else {
                console.log('👤 Visualizando próprio canal - mostrando todos os vídeos');
            }

            // Separate shorts (duration < 60s) from regular videos
            allShorts = visibleVideos.filter(v => parseDuration(v.duration) < 60);
            allVideos = visibleVideos.filter(v => parseDuration(v.duration) >= 60);

            console.log('📹 Vídeos regulares:', allVideos.length);
            console.log('🎬 Shorts:', allShorts.length);
        }

        // Display in inicio tab
        displayShortsSection();
        displayVideosHorizontal();

        // Display in dedicated tabs
        displayAllVideosGrid();
        displayAllShortsGrid();
        
    } catch (error) {
        console.error('❌ Erro ao carregar vídeos:', error);
        allVideos = [];
        allShorts = [];
    }
}

// Parse duration string to seconds
function parseDuration(duration) {
    if (!duration) return 0;
    const parts = duration.split(':').map(Number);
    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    }
    return 0;
}

// Display shorts section in inicio tab
function displayShortsSection() {
    const shortsSection = document.getElementById('shortsSection');
    const shortsGrid = document.getElementById('shortsGrid');

    if (allShorts.length === 0) {
        shortsSection.style.display = 'none';
        return;
    }

    shortsSection.style.display = 'block';
    
    // Show up to 6 shorts
    const displayShorts = allShorts.slice(0, 6);
    
    shortsGrid.innerHTML = displayShorts.map(short => `
        <a href="watch.html?v=${short.id}" class="short-card-yt">
            <div class="short-thumbnail">
                <img src="${short.thumbnail || 'https://via.placeholder.com/200x355'}" alt="${short.title}">
                <span class="short-duration">${short.duration}</span>
            </div>
            <h3 class="short-title">${short.title}</h3>
            <p class="short-views">${formatViews(short.views)} visualizações</p>
        </a>
    `).join('');
}

// Display videos in horizontal scroll (inicio tab)
function displayVideosHorizontal() {
    const videosSection = document.getElementById('videosSection');
    const videosScroll = document.getElementById('videosScroll');

    if (allVideos.length === 0) {
        videosSection.style.display = 'none';
        return;
    }

    videosSection.style.display = 'block';

    // Show up to 10 videos
    const displayVideos = allVideos.slice(0, 10);

    videosScroll.innerHTML = displayVideos.map(video => `
        <a href="watch.html?v=${video.id}" class="video-card-horizontal">
            <div class="video-thumbnail-container">
                <img src="${video.thumbnail || 'https://via.placeholder.com/320x180'}" alt="${video.title}">
                <span class="video-duration">${video.duration}</span>
            </div>
            <div class="video-info-horizontal">
                <h3 class="video-title-horizontal">${video.title}</h3>
                <p class="video-meta-horizontal">
                    ${formatViews(video.views)} visualizações • ${formatDate(video.created_at)}
                </p>
            </div>
        </a>
    `).join('');
}

// Display all videos in grid (videos tab)
function displayAllVideosGrid() {
    console.log('🎯 displayAllVideosGrid CHAMADA (channel.js)');
    console.log('🎯 allVideos:', allVideos);
    console.log('🎯 allVideos.length:', allVideos.length);
    
    const allVideosGrid = document.getElementById('allVideosGrid');
    console.log('🎯 Container allVideosGrid:', allVideosGrid ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
    
    if (!allVideosGrid) {
        console.error('❌ Elemento allVideosGrid não encontrado no DOM!');
        return;
    }
    
    if (allVideos.length === 0) {
        console.log('⚠️ Nenhum vídeo para exibir');
        allVideosGrid.innerHTML = '<div class="no-content"><i class="fas fa-video"></i><h3>Nenhum vídeo publicado</h3><p>Este canal ainda não publicou vídeos.</p></div>';
        return;
    }

    console.log('🎨 Gerando HTML para', allVideos.length, 'vídeos...');
    
    const html = allVideos.map((video, index) => {
        console.log(`  📹 ${index + 1}. ${video.title}`);
        return `
        <a href="watch.html?v=${video.id}" class="video-card">
            <div class="video-thumbnail">
                <img src="${video.thumbnail || 'https://via.placeholder.com/320x180'}" alt="${video.title}">
                <span class="video-duration">${video.duration}</span>
            </div>
            <div class="video-details">
                <h3 class="video-title">${video.title}</h3>
                <p class="video-stats">${formatViews(video.views)} visualizações • ${formatDate(video.created_at)}</p>
            </div>
        </a>
    `;
    }).join('');
    
    console.log('🎨 HTML gerado, tamanho:', html.length, 'caracteres');
    allVideosGrid.innerHTML = html;
    console.log('✅ container.children.length:', allVideosGrid.children.length);
    console.log('✅ Grid de vídeos renderizado com sucesso');
}

// Display all shorts in grid (shorts tab)
function displayAllShortsGrid() {
    const allShortsGrid = document.getElementById('allShortsGrid');
    
    if (allShorts.length === 0) {
        allShortsGrid.innerHTML = '<p class="no-content">Nenhum short encontrado</p>';
        return;
    }

    allShortsGrid.innerHTML = allShorts.map(short => `
        <a href="watch.html?v=${short.id}" class="short-card-yt">
            <div class="short-thumbnail">
                <img src="${short.thumbnail || 'https://via.placeholder.com/200x355'}" alt="${short.title}">
                <span class="short-duration">${short.duration}</span>
            </div>
            <h3 class="short-title">${short.title}</h3>
            <p class="short-views">${formatViews(short.views)} visualizações</p>
        </a>
    `).join('');
}

// Setup tab navigation
function setupTabNavigation() {
    const tabs = document.querySelectorAll('.channel-tab');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;

            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update active pane
            tabPanes.forEach(pane => pane.classList.remove('active'));
            document.getElementById(`${targetTab}-content`).classList.add('active');
        });
    });
}

// Setup filter buttons
function setupFilterButtons() {
    const filterBtns = document.querySelectorAll('.filter-btn-yt');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Apply filter
            const filter = btn.dataset.filter;
            applyVideoFilter(filter);
        });
    });
}

// Apply video filter
function applyVideoFilter(filter) {
    let sortedVideos = [...allVideos];

    switch (filter) {
        case 'recent':
            sortedVideos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
        case 'popular':
            sortedVideos.sort((a, b) => b.views - a.views);
            break;
        case 'oldest':
            sortedVideos.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            break;
    }

    // Update display
    const allVideosGrid = document.getElementById('allVideosGrid');
    allVideosGrid.innerHTML = sortedVideos.map(video => `
        <a href="watch.html?v=${video.id}" class="video-card">
            <div class="video-thumbnail">
                <img src="${video.thumbnail || 'https://via.placeholder.com/320x180'}" alt="${video.title}">
                <span class="video-duration">${video.duration}</span>
            </div>
            <div class="video-details">
                <div class="video-info-wrapper">
                    <h3 class="video-title">${video.title}</h3>
                    <p class="video-stats">${formatViews(video.views)} visualizações • ${formatDate(video.created_at)}</p>
                </div>
            </div>
        </a>
    `).join('');
}

// Format number (e.g., 1000 -> 1mil, 1000000 -> 1mi)
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace('.', ',') + ' mi';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1).replace('.', ',') + ' mil';
    }
    return num.toString();
}

// Format views
function formatViews(views) {
    return formatNumber(views);
}

// Format date
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 1) {
        return 'Hoje';
    } else if (diffDays === 1) {
        return 'Há 1 dia';
    } else if (diffDays < 7) {
        return `Há ${diffDays} dias`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `Há ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
    } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `Há ${months} ${months === 1 ? 'mês' : 'meses'}`;
    } else {
        const years = Math.floor(diffDays / 365);
        return `Há ${years} ${years === 1 ? 'ano' : 'anos'}`;
    }
}
