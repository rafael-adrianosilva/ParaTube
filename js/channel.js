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
    console.log('🎬 Channel page loaded, ID:', channelId);
    
    if (!channelId) {
        alert('Canal não encontrado!');
        window.location.href = 'index.html';
        return;
    }

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
});

// Load channel information
async function loadChannelInfo() {
    try {
        const response = await fetch('php/get-profile.php', {
            headers: {
                'X-User-Id': channelId
            }
        });

        if (!response.ok) throw new Error('Failed to load channel');

        const data = await response.json();
        console.log('👤 Channel info:', data);
        
        channelData = data;

        // Update channel info
        document.getElementById('channelName').textContent = data.username;
        document.getElementById('channelHandle').textContent = `@${data.username.toLowerCase().replace(/\s+/g, '')}`;
        
        if (data.profile_image) {
            document.getElementById('channelAvatar').src = data.profile_image;
        }

        if (data.bio) {
            document.getElementById('channelDescriptionPreview').textContent = data.bio.substring(0, 100) + (data.bio.length > 100 ? '...' : '');
            document.getElementById('channelDescriptionFull').textContent = data.bio;
        }

        // Load customization (banner, links)
        await loadChannelCustomization();

        // Update about tab
        document.getElementById('joinedDate').textContent = new Date(data.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

    } catch (error) {
        console.error('❌ Error loading channel:', error);
        alert('Erro ao carregar canal!');
    }
}

// Load channel customization
async function loadChannelCustomization() {
    try {
        const response = await fetch('php/get-channel-customization.php', {
            headers: {
                'X-User-Id': channelId
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('🎨 Channel customization:', data);

            // Set banner
            if (data.banner) {
                document.getElementById('channelBanner').style.backgroundImage = `url('${data.banner}')`;
            }

            // Set links
            if (data.links) {
                const links = JSON.parse(data.links);
                if (links.length > 0) {
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
        // Not logged in - hide subscribe button bell icon
        const subscribeBtn = document.getElementById('subscribeBtn');
        subscribeBtn.innerHTML = '<span>Inscrever-se</span>';
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
            <span>Inscrever-se</span>
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

        try {
            const response = await fetch('php/subscribe.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': currentUser.id.toString()
                },
                body: JSON.stringify({
                    channel_id: parseInt(channelId)
                })
            });

            if (response.ok) {
                const data = await response.json();
                isSubscribed = data.subscribed;
                updateSubscribeButton();
                
                // Update subscriber count
                await loadChannelStats();
            }
        } catch (error) {
            console.error('Error toggling subscription:', error);
            alert('Erro ao processar inscrição!');
        }
    });
}

// Load all videos
async function loadAllVideos() {
    try {
        const response = await fetch('php/get-user-videos.php', {
            headers: {
                'X-User-Id': channelId
            }
        });

        if (response.ok) {
            const videos = await response.json();
            console.log('📹 Loaded videos:', videos.length);

            // Filter only public videos (unless viewing own channel)
            let visibleVideos = videos;
            if (!currentUser || parseInt(channelId) !== currentUser.id) {
                visibleVideos = videos.filter(v => v.visibility === 'public');
            }

            // Separate shorts (duration < 60s) from regular videos
            allShorts = visibleVideos.filter(v => parseDuration(v.duration) < 60);
            allVideos = visibleVideos.filter(v => parseDuration(v.duration) >= 60);

            console.log('📹 Videos:', allVideos.length, '🎬 Shorts:', allShorts.length);

            // Display in inicio tab
            displayShortsSection();
            displayVideosHorizontal();

            // Display in dedicated tabs
            displayAllVideosGrid();
            displayAllShortsGrid();
        }
    } catch (error) {
        console.error('Error loading videos:', error);
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
    const allVideosGrid = document.getElementById('allVideosGrid');
    
    if (allVideos.length === 0) {
        allVideosGrid.innerHTML = '<p class="no-content">Nenhum vídeo encontrado</p>';
        return;
    }

    allVideosGrid.innerHTML = allVideos.map(video => `
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
