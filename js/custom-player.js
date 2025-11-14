// Custom Video Player (YouTube Style) - v2.1 with Next Video Feature

let player = null;
let playerControls = null;
let isPlaying = false;
let isSeeking = false;
let volumeBeforeMute = 1;

// Initialize custom player
function initCustomPlayer() {
    const videoPlayer = document.getElementById('videoPlayer');
    if (!videoPlayer) return;
    
    // Hide native controls
    videoPlayer.removeAttribute('controls');
    
    // Create custom controls
    createCustomControls();
    
    // Setup event listeners
    setupPlayerEvents();
    
    // Initialize volume
    videoPlayer.volume = 1;
}

// Create custom controls HTML
function createCustomControls() {
    const videoPlayer = document.getElementById('videoPlayer');
    const videoPlayerContainer = videoPlayer.parentElement;
    
    // Check if controls already exist to prevent duplicates
    if (document.getElementById('customControls')) {
        console.log('Custom controls already exist, skipping creation');
        return;
    }
    
    const controlsHTML = `
        <div class="custom-video-controls" id="customControls">
            <!-- Progress Bar -->
            <div class="video-progress-container" id="progressContainer">
                <div class="video-progress-bar">
                    <div class="video-progress-filled" id="progressFilled"></div>
                    <div class="video-progress-buffered" id="progressBuffered"></div>
                    <div class="video-progress-hover" id="progressHover"></div>
                    <div class="video-progress-thumb" id="progressThumb"></div>
                </div>
                <div class="video-progress-tooltip" id="progressTooltip">0:00</div>
            </div>
            
            <!-- Control Buttons -->
            <div class="video-controls-bottom">
                <div class="controls-left">
                    <button class="control-btn play-btn" id="playBtn" title="Reproduzir (k)">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="control-btn" id="nextFrameBtn" title="Próximo frame (,)">
                        <i class="fas fa-step-forward"></i>
                    </button>
                    <div class="volume-control">
                        <button class="control-btn" id="volumeBtn" title="Mudo (m)">
                            <i class="fas fa-volume-up"></i>
                        </button>
                        <div class="volume-slider-container">
                            <input type="range" class="volume-slider" id="volumeSlider" min="0" max="100" value="100">
                        </div>
                    </div>
                    <div class="time-display">
                        <span id="currentTime">0:00</span> / <span id="duration">0:00</span>
                    </div>
                </div>
                
                <div class="controls-right">
                    <div class="speed-control">
                        <button class="control-btn" id="speedBtn" title="Velocidade">
                            <span class="speed-text">1x</span>
                        </button>
                        <div class="speed-menu" id="speedMenu">
                            <div class="speed-option" data-speed="0.25">0.25</div>
                            <div class="speed-option" data-speed="0.5">0.5</div>
                            <div class="speed-option" data-speed="0.75">0.75</div>
                            <div class="speed-option active" data-speed="1">Normal</div>
                            <div class="speed-option" data-speed="1.25">1.25</div>
                            <div class="speed-option" data-speed="1.5">1.5</div>
                            <div class="speed-option" data-speed="1.75">1.75</div>
                            <div class="speed-option" data-speed="2">2</div>
                        </div>
                    </div>
                    <button class="control-btn settings-btn" id="theaterBtn" title="Modo Teatro (t)">
                        <i class="fas fa-tv"></i>
                    </button>
                    <button class="control-btn" id="fullscreenBtn" title="Tela cheia (f)">
                        <i class="fas fa-expand"></i>
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Loading Spinner -->
        <div class="video-loading" id="videoLoading">
            <i class="fas fa-circle-notch fa-spin"></i>
        </div>
        
        <!-- Center Play Button -->
        <div class="center-play-btn" id="centerPlayBtn">
            <i class="fas fa-play"></i>
        </div>
        
        <!-- Keyboard Shortcuts Overlay -->
        <div class="keyboard-shortcuts-overlay" id="keyboardShortcuts" style="display: none;">
            <h3>Atalhos de Teclado</h3>
            <div class="shortcuts-list">
                <div><kbd>K</kbd> ou <kbd>Space</kbd> - Play/Pause</div>
                <div><kbd>←</kbd> ou <kbd>J</kbd> - Voltar 5s</div>
                <div><kbd>→</kbd> ou <kbd>L</kbd> - Avançar 5s</div>
                <div><kbd>↑</kbd> - Aumentar volume</div>
                <div><kbd>↓</kbd> - Diminuir volume</div>
                <div><kbd>M</kbd> - Mudo</div>
                <div><kbd>F</kbd> - Tela cheia</div>
                <div><kbd>T</kbd> - Modo teatro</div>
                <div><kbd>I</kbd> - Miniplayer</div>
                <div><kbd>C</kbd> - Modo cinema</div>
                <div><kbd>&lt;</kbd> - Diminuir velocidade</div>
                <div><kbd>&gt;</kbd> - Aumentar velocidade</div>
                <div><kbd>,</kbd> - Frame anterior</div>
                <div><kbd>.</kbd> - Próximo frame</div>
                <div><kbd>0-9</kbd> - Pular para % do vídeo</div>
                <div><kbd>Home</kbd> - Início</div>
                <div><kbd>End</kbd> - Fim</div>
            </div>
        </div>
        
        <!-- Next Video Overlay -->
        <div class="next-video-overlay" id="nextVideoOverlay" style="display: none;">
            <div class="next-video-content">
                <div class="next-video-header">
                    <h3>Próximo vídeo</h3>
                    <div class="next-video-timer" id="nextVideoTimer">5</div>
                </div>
                <div class="next-video-card" id="nextVideoCard">
                    <div class="next-video-thumbnail">
                        <img src="" alt="Próximo vídeo" id="nextVideoThumbnail">
                        <div class="next-video-duration" id="nextVideoDuration">0:00</div>
                    </div>
                    <div class="next-video-info">
                        <h4 class="next-video-title" id="nextVideoTitle">Título do próximo vídeo</h4>
                        <div class="next-video-channel">
                            <span id="nextVideoChannelName">Nome do canal</span>
                        </div>
                        <div class="next-video-stats">
                            <span id="nextVideoViews">0 visualizações</span>
                        </div>
                    </div>
                </div>
                <div class="next-video-actions">
                    <button class="next-video-btn cancel" id="cancelNextVideo">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                    <button class="next-video-btn play" id="playNextVideo">
                        <i class="fas fa-play"></i> Reproduzir agora
                    </button>
                </div>
            </div>
        </div>
    `;
    
    videoPlayerContainer.insertAdjacentHTML('beforeend', controlsHTML);
    playerControls = document.getElementById('customControls');
}

// Setup all player events
function setupPlayerEvents() {
    const videoPlayer = document.getElementById('videoPlayer');
    const playBtn = document.getElementById('playBtn');
    const centerPlayBtn = document.getElementById('centerPlayBtn');
    const progressContainer = document.getElementById('progressContainer');
    const volumeBtn = document.getElementById('volumeBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const speedBtn = document.getElementById('speedBtn');
    const theaterBtn = document.getElementById('theaterBtn');
    
    // Play/Pause
    playBtn?.addEventListener('click', togglePlay);
    centerPlayBtn?.addEventListener('click', togglePlay);
    videoPlayer.addEventListener('click', togglePlay);
    
    // Progress bar - Allow click and drag
    progressContainer?.addEventListener('click', seek);
    progressContainer?.addEventListener('mousedown', startSeeking);
    progressContainer?.addEventListener('mousemove', showProgressTooltip);
    progressContainer?.addEventListener('mouseleave', hideProgressTooltip);
    
    // Document-level events for dragging
    document.addEventListener('mousemove', onSeekingMove);
    document.addEventListener('mouseup', stopSeeking);
    
    // Volume
    volumeBtn?.addEventListener('click', toggleMute);
    volumeSlider?.addEventListener('input', changeVolume);
    
    // Fullscreen
    fullscreenBtn?.addEventListener('click', toggleFullscreen);
    
    // Speed
    speedBtn?.addEventListener('click', toggleSpeedMenu);
    document.querySelectorAll('.speed-option').forEach(option => {
        option.addEventListener('click', changeSpeed);
    });
    
    // Theater mode
    theaterBtn?.addEventListener('click', toggleTheaterMode);
    
    // Video events
    videoPlayer.addEventListener('play', onPlay);
    videoPlayer.addEventListener('pause', onPause);
    videoPlayer.addEventListener('timeupdate', updateProgress);
    videoPlayer.addEventListener('loadedmetadata', onLoadedMetadata);
    videoPlayer.addEventListener('waiting', showLoading);
    videoPlayer.addEventListener('canplay', hideLoading);
    videoPlayer.addEventListener('ended', onEnded);
    
    // Show controls on hover
    const videoPlayerContainer = videoPlayer.parentElement;
    videoPlayerContainer.addEventListener('mouseenter', showControls);
    videoPlayerContainer.addEventListener('mousemove', showControls);
    videoPlayerContainer.addEventListener('mouseleave', hideControls);
    
    // Keyboard shortcuts
    setupKeyboardShortcuts();
}

// Toggle play/pause
function togglePlay() {
    const videoPlayer = document.getElementById('videoPlayer');
    if (videoPlayer.paused) {
        videoPlayer.play();
    } else {
        videoPlayer.pause();
    }
}

function onPlay() {
    isPlaying = true;
    const playBtn = document.getElementById('playBtn');
    const centerPlayBtn = document.getElementById('centerPlayBtn');
    
    if (playBtn) {
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        playBtn.title = 'Pausar (k)';
    }
    if (centerPlayBtn) {
        centerPlayBtn.style.opacity = '0';
        centerPlayBtn.style.pointerEvents = 'none';
    }
    
    // GA4 Tracking
    if (typeof trackVideoPlay === 'function') {
        const urlParams = new URLSearchParams(window.location.search);
        const videoId = urlParams.get('id');
        const videoTitle = document.getElementById('videoTitle')?.textContent || 'Unknown';
        trackVideoPlay(videoId, videoTitle);
    }
}

function onPause() {
    isPlaying = false;
    const playBtn = document.getElementById('playBtn');
    const centerPlayBtn = document.getElementById('centerPlayBtn');
    const videoPlayer = document.getElementById('videoPlayer');
    
    if (playBtn) {
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        playBtn.title = 'Reproduzir (k)';
    }
    if (centerPlayBtn) {
        centerPlayBtn.style.opacity = '1';
        centerPlayBtn.style.pointerEvents = 'auto';
    }
    
    // GA4 Tracking
    if (typeof trackVideoPause === 'function' && videoPlayer) {
        const urlParams = new URLSearchParams(window.location.search);
        const videoId = urlParams.get('id');
        trackVideoPause(videoId, videoPlayer.currentTime);
    }
}

// Progress bar
function updateProgress() {
    const videoPlayer = document.getElementById('videoPlayer');
    const progressFilled = document.getElementById('progressFilled');
    const progressThumb = document.getElementById('progressThumb');
    const currentTimeEl = document.getElementById('currentTime');
    
    if (!videoPlayer || !progressFilled) return;
    
    const percent = (videoPlayer.currentTime / videoPlayer.duration) * 100;
    progressFilled.style.width = percent + '%';
    
    // Always update thumb position
    if (progressThumb) {
        progressThumb.style.left = percent + '%';
    }
    
    if (currentTimeEl) {
        currentTimeEl.textContent = formatTime(videoPlayer.currentTime);
    }
    
    // Update buffered
    updateBuffered();
}

function updateBuffered() {
    const videoPlayer = document.getElementById('videoPlayer');
    const progressBuffered = document.getElementById('progressBuffered');
    
    if (!videoPlayer || !progressBuffered || !videoPlayer.buffered.length) return;
    
    const bufferedEnd = videoPlayer.buffered.end(videoPlayer.buffered.length - 1);
    const duration = videoPlayer.duration;
    const bufferedPercent = (bufferedEnd / duration) * 100;
    
    progressBuffered.style.width = bufferedPercent + '%';
}

function seek(e) {
    const progressContainer = document.getElementById('progressContainer');
    const videoPlayer = document.getElementById('videoPlayer');
    
    if (!progressContainer || !videoPlayer || isSeeking) return;
    
    const rect = progressContainer.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    videoPlayer.currentTime = percent * videoPlayer.duration;
    
    // Flash thumb on click
    flashThumb();
}

// Drag-to-seek functionality
function startSeeking(e) {
    isSeeking = true;
    const progressContainer = document.getElementById('progressContainer');
    if (!progressContainer) return;
    
    // Add seeking class for visual feedback
    progressContainer.classList.add('seeking');
    
    // Prevent text selection while dragging
    e.preventDefault();
    
    // Immediately seek to clicked position
    seekToPosition(e.clientX);
    
    // Show controls while seeking
    showControls();
    
    // Make thumb visible
    const thumb = document.getElementById('progressThumb');
    if (thumb) {
        thumb.style.opacity = '1';
    }
}

function onSeekingMove(e) {
    if (!isSeeking) return;
    
    e.preventDefault();
    seekToPosition(e.clientX);
}

function stopSeeking() {
    if (!isSeeking) return;
    isSeeking = false;
    
    // Remove seeking class
    const progressContainer = document.getElementById('progressContainer');
    if (progressContainer) {
        progressContainer.classList.remove('seeking');
    }
}

function seekToPosition(clientX) {
    const progressContainer = document.getElementById('progressContainer');
    const videoPlayer = document.getElementById('videoPlayer');
    const progressTooltip = document.getElementById('progressTooltip');
    const progressThumb = document.getElementById('progressThumb');
    
    if (!progressContainer || !videoPlayer) return;
    
    const rect = progressContainer.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    videoPlayer.currentTime = percent * videoPlayer.duration;
    
    // Update UI immediately
    updateProgress();
    
    // Keep tooltip visible and positioned during drag
    if (progressTooltip && isSeeking) {
        const time = percent * videoPlayer.duration;
        progressTooltip.textContent = formatTime(time);
        progressTooltip.style.left = (clientX - rect.left) + 'px';
        progressTooltip.style.opacity = '1';
    }
    
    // Update thumb position
    if (progressThumb) {
        progressThumb.style.left = (percent * 100) + '%';
    }
}

function showProgressTooltip(e) {
    const progressContainer = document.getElementById('progressContainer');
    const progressTooltip = document.getElementById('progressTooltip');
    const progressHover = document.getElementById('progressHover');
    const videoPlayer = document.getElementById('videoPlayer');
    
    if (!progressContainer || !progressTooltip || !videoPlayer) return;
    
    const rect = progressContainer.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const time = percent * videoPlayer.duration;
    
    progressTooltip.textContent = formatTime(time);
    progressTooltip.style.left = (e.clientX - rect.left) + 'px';
    progressTooltip.style.opacity = '1';
    
    progressHover.style.width = (percent * 100) + '%';
}

function hideProgressTooltip() {
    const progressTooltip = document.getElementById('progressTooltip');
    const progressHover = document.getElementById('progressHover');
    
    if (progressTooltip) progressTooltip.style.opacity = '0';
    if (progressHover) progressHover.style.width = '0';
}

// Volume
function toggleMute() {
    const videoPlayer = document.getElementById('videoPlayer');
    const volumeBtn = document.getElementById('volumeBtn');
    
    if (!videoPlayer) return;
    
    if (videoPlayer.volume > 0) {
        volumeBeforeMute = videoPlayer.volume;
        videoPlayer.volume = 0;
    } else {
        videoPlayer.volume = volumeBeforeMute;
    }
    
    updateVolumeIcon();
}

function changeVolume(e) {
    const videoPlayer = document.getElementById('videoPlayer');
    if (!videoPlayer) return;
    
    videoPlayer.volume = e.target.value / 100;
    updateVolumeIcon();
}

function updateVolumeIcon() {
    const videoPlayer = document.getElementById('videoPlayer');
    const volumeBtn = document.getElementById('volumeBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    
    if (!videoPlayer || !volumeBtn) return;
    
    volumeSlider.value = videoPlayer.volume * 100;
    
    let icon = 'fa-volume-up';
    if (videoPlayer.volume === 0) {
        icon = 'fa-volume-mute';
    } else if (videoPlayer.volume < 0.5) {
        icon = 'fa-volume-down';
    }
    
    volumeBtn.innerHTML = `<i class="fas ${icon}"></i>`;
}

// Speed
function toggleSpeedMenu() {
    const speedMenu = document.getElementById('speedMenu');
    if (speedMenu) {
        speedMenu.classList.toggle('show');
    }
}

function changeSpeed(e) {
    const videoPlayer = document.getElementById('videoPlayer');
    const speed = parseFloat(e.target.dataset.speed);
    
    if (!videoPlayer) return;
    
    videoPlayer.playbackRate = speed;
    
    // Update UI
    document.querySelectorAll('.speed-option').forEach(opt => opt.classList.remove('active'));
    e.target.classList.add('active');
    
    const speedText = document.querySelector('.speed-text');
    if (speedText) {
        speedText.textContent = speed === 1 ? '1x' : speed + 'x';
    }
    
    toggleSpeedMenu();
}

// Fullscreen
function toggleFullscreen() {
    const videoPlayerContainer = document.querySelector('.video-player');
    
    if (!document.fullscreenElement) {
        videoPlayerContainer.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

document.addEventListener('fullscreenchange', () => {
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (!fullscreenBtn) return;
    
    if (document.fullscreenElement) {
        fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
        fullscreenBtn.title = 'Sair da tela cheia (f)';
    } else {
        fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
        fullscreenBtn.title = 'Tela cheia (f)';
    }
});

// Theater mode
function toggleTheaterMode() {
    document.body.classList.toggle('theater-mode');
    const theaterBtn = document.getElementById('theaterBtn');
    
    if (document.body.classList.contains('theater-mode')) {
        theaterBtn.innerHTML = '<i class="fas fa-tv"></i>';
        theaterBtn.title = 'Modo padrão (t)';
    } else {
        theaterBtn.innerHTML = '<i class="fas fa-tv"></i>';
        theaterBtn.title = 'Modo teatro (t)';
    }
}

// Loading
function showLoading() {
    const loading = document.getElementById('videoLoading');
    if (loading) loading.style.display = 'flex';
}

function hideLoading() {
    const loading = document.getElementById('videoLoading');
    if (loading) loading.style.display = 'none';
}

// Metadata loaded
function onLoadedMetadata() {
    const videoPlayer = document.getElementById('videoPlayer');
    const durationEl = document.getElementById('duration');
    
    if (durationEl && videoPlayer) {
        durationEl.textContent = formatTime(videoPlayer.duration);
    }
}

// Video ended
function onEnded() {
    const playBtn = document.getElementById('playBtn');
    const videoPlayer = document.getElementById('videoPlayer');
    
    if (playBtn) {
        playBtn.innerHTML = '<i class="fas fa-redo"></i>';
        playBtn.title = 'Assistir novamente';
    }
    
    // GA4 Tracking
    if (typeof trackVideoComplete === 'function' && videoPlayer) {
        const urlParams = new URLSearchParams(window.location.search);
        const videoId = urlParams.get('id');
        const videoTitle = document.getElementById('videoTitle')?.textContent || 'Unknown';
        trackVideoComplete(videoId, videoTitle, videoPlayer.duration);
    }
    
    // Show next video overlay
    showNextVideo();
}

// Next Video System
let nextVideo = null;
let nextVideoTimer = null;
let nextVideoCountdown = 5;

async function showNextVideo() {
    try {
        console.log('🎬 showNextVideo() called - Starting next video system');
        
        // Fetch next video
        await fetchNextVideo();
        
        if (!nextVideo) {
            console.log('❌ No next video available');
            return;
        }
        
        console.log('✅ Next video found:', nextVideo);
        
        // Display overlay
        const overlay = document.getElementById('nextVideoOverlay');
        if (!overlay) {
            console.error('❌ Next video overlay element not found!');
            return;
        }
        
        console.log('✅ Overlay element found, displaying...');
        
        // Populate next video info
        document.getElementById('nextVideoThumbnail').src = nextVideo.thumbnail_url || 'assets/default-thumbnail.jpg';
        document.getElementById('nextVideoTitle').textContent = nextVideo.title;
        document.getElementById('nextVideoChannelName').textContent = nextVideo.channel_name;
        document.getElementById('nextVideoViews').textContent = formatViews(nextVideo.views) + ' visualizações';
        document.getElementById('nextVideoDuration').textContent = nextVideo.duration || '0:00';
        
        // Show overlay
        overlay.style.display = 'flex';
        
        // Start countdown
        nextVideoCountdown = 5;
        updateCountdown();
        nextVideoTimer = setInterval(() => {
            nextVideoCountdown--;
            updateCountdown();
            
            if (nextVideoCountdown <= 0) {
                clearInterval(nextVideoTimer);
                playNextVideo();
            }
        }, 1000);
        
        // Setup button events
        document.getElementById('cancelNextVideo').onclick = cancelNextVideo;
        document.getElementById('playNextVideo').onclick = playNextVideo;
        document.getElementById('nextVideoCard').onclick = playNextVideo;
        
    } catch (error) {
        console.error('Error showing next video:', error);
    }
}

async function fetchNextVideo() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const currentVideoId = urlParams.get('v') || urlParams.get('id');
        
        console.log('🔍 Fetching next video for current video ID:', currentVideoId);
        
        if (!currentVideoId) {
            console.log('❌ No current video ID found');
            return;
        }
        
        // Fetch related videos
        console.log('📡 Fetching related videos from:', `php/get-related-videos.php?video_id=${currentVideoId}`);
        const response = await fetch(`php/get-related-videos.php?video_id=${currentVideoId}`);
        const data = await response.json();
        console.log('📥 Related videos response:', data);
        
        if (data.success && data.videos && data.videos.length > 0) {
            // Get first related video or random one
            const randomIndex = Math.floor(Math.random() * Math.min(5, data.videos.length));
            nextVideo = data.videos[randomIndex];
            console.log('✅ Selected related video:', nextVideo);
        } else {
            // Fallback: get random trending video
            console.log('⚠️ No related videos, fetching trending...');
            const trendingResponse = await fetch('php/get-trending.php?limit=10');
            const trendingData = await trendingResponse.json();
            console.log('📥 Trending videos response:', trendingData);
            
            if (trendingData.success && trendingData.videos && trendingData.videos.length > 0) {
                const randomIndex = Math.floor(Math.random() * trendingData.videos.length);
                nextVideo = trendingData.videos[randomIndex];
                console.log('✅ Selected trending video as fallback:', nextVideo);
            } else {
                console.log('❌ No trending videos available');
            }
        }
        
    } catch (error) {
        console.error('❌ Error fetching next video:', error);
    }
}

function updateCountdown() {
    const timerEl = document.getElementById('nextVideoTimer');
    if (timerEl) {
        timerEl.textContent = nextVideoCountdown;
    }
}

function cancelNextVideo() {
    clearInterval(nextVideoTimer);
    const overlay = document.getElementById('nextVideoOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

function playNextVideo() {
    if (!nextVideo) return;
    
    clearInterval(nextVideoTimer);
    
    // Navigate to next video
    window.location.href = `watch.html?v=${nextVideo.id}`;
}

function formatViews(views) {
    const num = parseInt(views) || 0;
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// Show/Hide controls
let controlsTimeout = null;
function showControls() {
    if (playerControls) {
        playerControls.classList.add('show');
    }
    
    clearTimeout(controlsTimeout);
    controlsTimeout = setTimeout(hideControls, 3000);
}

function hideControls() {
    const videoPlayer = document.getElementById('videoPlayer');
    if (playerControls && !videoPlayer.paused) {
        playerControls.classList.remove('show');
    }
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ignore if typing in input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        const videoPlayer = document.getElementById('videoPlayer');
        if (!videoPlayer) return;
        
        switch(e.key.toLowerCase()) {
            case 'k':
            case ' ':
                e.preventDefault();
                togglePlay();
                break;
            case 'arrowleft':
            case 'j':
                e.preventDefault();
                videoPlayer.currentTime -= 5;
                flashThumb();
                break;
            case 'arrowright':
            case 'l':
                e.preventDefault();
                videoPlayer.currentTime += 5;
                flashThumb();
                break;
            case 'arrowup':
                e.preventDefault();
                videoPlayer.volume = Math.min(1, videoPlayer.volume + 0.1);
                updateVolumeIcon();
                break;
            case 'arrowdown':
                e.preventDefault();
                videoPlayer.volume = Math.max(0, videoPlayer.volume - 0.1);
                updateVolumeIcon();
                break;
            case 'm':
                e.preventDefault();
                toggleMute();
                break;
            case 'f':
                e.preventDefault();
                toggleFullscreen();
                break;
            case 't':
                e.preventDefault();
                toggleTheaterMode();
                break;
            case '<':
            case ',':
                e.preventDefault();
                const newSpeed = Math.max(0.25, videoPlayer.playbackRate - 0.25);
                videoPlayer.playbackRate = newSpeed;
                document.querySelector('.speed-text').textContent = newSpeed + 'x';
                break;
            case '>':
            case '.':
                e.preventDefault();
                const fasterSpeed = Math.min(2, videoPlayer.playbackRate + 0.25);
                videoPlayer.playbackRate = fasterSpeed;
                document.querySelector('.speed-text').textContent = fasterSpeed + 'x';
                break;
            case '0': case '1': case '2': case '3': case '4':
            case '5': case '6': case '7': case '8': case '9':
                e.preventDefault();
                const percent = parseInt(e.key) / 10;
                videoPlayer.currentTime = videoPlayer.duration * percent;
                flashThumb();
                break;
            case 'home':
                e.preventDefault();
                videoPlayer.currentTime = 0;
                flashThumb();
                break;
            case 'end':
                e.preventDefault();
                videoPlayer.currentTime = videoPlayer.duration;
                flashThumb();
                break;
            case '?':
                e.preventDefault();
                toggleKeyboardShortcuts();
                break;
        }
    });
}

function toggleKeyboardShortcuts() {
    const shortcuts = document.getElementById('keyboardShortcuts');
    if (shortcuts) {
        shortcuts.style.display = shortcuts.style.display === 'none' ? 'block' : 'none';
    }
}

// Format time helper
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Flash thumb animation when seeking with keyboard
function flashThumb() {
    const thumb = document.getElementById('progressThumb');
    if (!thumb) return;
    
    // Add flash class
    thumb.classList.add('flash');
    
    // Remove after animation
    setTimeout(() => {
        thumb.classList.remove('flash');
    }, 500);
}

// Initialize on page load (only once)
if (document.getElementById('videoPlayer')) {
    if (document.readyState === 'loading') {
        // If still loading, wait for DOMContentLoaded
        document.addEventListener('DOMContentLoaded', initCustomPlayer);
    } else {
        // If already loaded, init immediately
        initCustomPlayer();
    }
}
