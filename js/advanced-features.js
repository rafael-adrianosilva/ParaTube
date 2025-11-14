/**
 * ========================================
 * ADVANCED FEATURES - ALL IN ONE
 * ParaTube Enhanced Features System
 * ========================================
 */

// ==================== 1. VIDEO QUALITY SELECTOR ====================
class VideoQualityManager {
    constructor(videoElement) {
        this.video = videoElement;
        this.qualities = ['144p', '240p', '360p', '480p', '720p', '1080p', 'auto'];
        this.currentQuality = this.loadPreference() || 'auto';
        this.setupQualitySelector();
    }

    loadPreference() {
        return localStorage.getItem('preferredQuality') || 'auto';
    }

    savePreference(quality) {
        localStorage.setItem('preferredQuality', quality);
        this.sendPreferenceToServer(quality);
    }

    async sendPreferenceToServer(quality) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.id) return;

        try {
            await fetch('php/save-preference.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': user.id.toString()
                },
                body: JSON.stringify({
                    preference_key: 'video_quality',
                    preference_value: quality
                })
            });
        } catch (error) {
            console.error('Failed to save quality preference:', error);
        }
    }

    setupQualitySelector() {
        const controls = document.querySelector('.custom-video-controls') || 
                        document.querySelector('.custom-controls') ||
                        document.querySelector('.controls-right');
        if (!controls) {
            console.warn('Controls not found for quality selector');
            return;
        }

        const qualityBtn = document.createElement('button');
        qualityBtn.className = 'control-btn quality-btn';
        qualityBtn.title = 'Qualidade';
        qualityBtn.innerHTML = `<i class="fas fa-cog"></i><span class="quality-text">${this.currentQuality}</span>`;

        const qualityMenu = document.createElement('div');
        qualityMenu.className = 'quality-menu';
        qualityMenu.style.display = 'none';
        
        this.qualities.forEach(quality => {
            const option = document.createElement('button');
            option.className = 'quality-option' + (quality === this.currentQuality ? ' active' : '');
            option.textContent = quality;
            option.onclick = () => this.changeQuality(quality);
            qualityMenu.appendChild(option);
        });

        qualityBtn.onclick = (e) => {
            e.stopPropagation();
            qualityMenu.style.display = qualityMenu.style.display === 'none' ? 'block' : 'none';
        };

        document.addEventListener('click', () => {
            qualityMenu.style.display = 'none';
        });

        qualityBtn.appendChild(qualityMenu);
        
        // Try to find the controls-right section
        const controlsRight = document.querySelector('.controls-right');
        if (controlsRight) {
            const settingsBtn = controlsRight.querySelector('.settings-btn') || 
                               controlsRight.querySelector('#theaterBtn');
            if (settingsBtn) {
                settingsBtn.before(qualityBtn);
            } else {
                controlsRight.insertBefore(qualityBtn, controlsRight.firstChild);
            }
        } else {
            const settingsBtn = controls.querySelector('.settings-btn');
            if (settingsBtn) {
                settingsBtn.before(qualityBtn);
            } else {
                controls.appendChild(qualityBtn);
            }
        }
    }

    changeQuality(quality) {
        this.currentQuality = quality;
        this.savePreference(quality);
        
        document.querySelectorAll('.quality-option').forEach(opt => {
            opt.classList.toggle('active', opt.textContent === quality);
        });
        
        document.querySelector('.quality-text').textContent = quality;
        
        if (quality === 'auto') {
            this.detectAndSetQuality();
        } else {
            this.setVideoQuality(quality);
        }
    }

    async detectAndSetQuality() {
        // Simple connection speed test
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection && connection.effectiveType) {
            const speedMap = {
                '4g': '1080p',
                '3g': '720p',
                '2g': '360p',
                'slow-2g': '144p'
            };
            const suggestedQuality = speedMap[connection.effectiveType] || '720p';
            this.setVideoQuality(suggestedQuality);
        } else {
            this.setVideoQuality('720p'); // Default fallback
        }
    }

    setVideoQuality(quality) {
        console.log(`🎬 Switching to quality: ${quality}`);
        
        const currentTime = this.video.currentTime;
        const wasPaused = this.video.paused;
        const currentSrc = this.video.currentSrc;
        
        // Remove existing quality classes
        this.video.classList.remove('quality-144p', 'quality-240p', 'quality-360p', 'quality-480p', 'quality-720p', 'quality-1080p');
        
        // Apply quality-specific styling
        if (quality !== 'auto') {
            this.video.classList.add(`quality-${quality}`);
        }
        
        // Apply visual effects based on quality
        const qualitySettings = {
            '144p': { scale: 0.25, blur: 3, pixelate: 4 },
            '240p': { scale: 0.4, blur: 2, pixelate: 3 },
            '360p': { scale: 0.6, blur: 1, pixelate: 2 },
            '480p': { scale: 0.8, blur: 0.5, pixelate: 1 },
            '720p': { scale: 1, blur: 0, pixelate: 0 },
            '1080p': { scale: 1, blur: 0, pixelate: 0 }
        };
        
        const settings = qualitySettings[quality] || qualitySettings['720p'];
        
        // Apply CSS filters and transformations
        let filterStyle = '';
        if (settings.blur > 0) {
            filterStyle += `blur(${settings.blur}px) `;
        }
        if (settings.pixelate > 0) {
            filterStyle += `contrast(${1 + settings.pixelate * 0.1}) `;
        }
        
        this.video.style.filter = filterStyle.trim();
        
        // Apply quality-specific rendering (mantém vídeo centralizado)
        // Remove estilos anteriores
        this.video.style.removeProperty('width');
        this.video.style.removeProperty('height');
        this.video.style.removeProperty('transform');
        this.video.style.removeProperty('transform-origin');
        
        // Aplica apenas image-rendering para qualidade
        if (quality === '144p' || quality === '240p') {
            this.video.style.imageRendering = 'pixelated';
        } else {
            this.video.style.imageRendering = 'auto';
        }
        
        // Resume playback
        if (!wasPaused) {
            this.video.play().catch(err => console.warn('Autoplay prevented:', err));
        }
        
        // Show notification
        this.showQualityNotification(quality);
    }
    
    showQualityNotification(quality) {
        // Remove existing notification
        const existing = document.querySelector('.quality-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = 'quality-notification';
        notification.textContent = `Qualidade: ${quality}`;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
}

// ==================== 2. LOOP BUTTON & A-B REPEAT ====================
class VideoLoopManager {
    constructor(videoElement) {
        this.video = videoElement;
        this.loopEnabled = false;
        this.loopStart = null;
        this.loopEnd = null;
        this.setupLoopControls();
    }

    setupLoopControls() {
        const controls = document.querySelector('.custom-controls');
        if (!controls) return;

        // Loop button
        const loopBtn = document.createElement('button');
        loopBtn.className = 'control-btn loop-btn';
        loopBtn.title = 'Repetir (L)';
        loopBtn.innerHTML = `<i class="fas fa-redo"></i>`;
        loopBtn.onclick = () => this.toggleLoop();

        // A-B Repeat button
        const abBtn = document.createElement('button');
        abBtn.className = 'control-btn ab-repeat-btn';
        abBtn.title = 'Repetir A-B';
        abBtn.innerHTML = `<i class="fas fa-exchange-alt"></i>`;
        abBtn.onclick = () => this.toggleABRepeat();

        controls.appendChild(loopBtn);
        controls.appendChild(abBtn);

        // Listen for video timeupdate
        this.video.addEventListener('timeupdate', () => this.checkLoop());

        // Keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if (e.key === 'l' || e.key === 'L') {
                if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                    this.toggleLoop();
                }
            }
        });
    }

    toggleLoop() {
        this.loopEnabled = !this.loopEnabled;
        this.video.loop = this.loopEnabled;
        
        const loopBtn = document.querySelector('.loop-btn');
        loopBtn.classList.toggle('active', this.loopEnabled);
        
        showNotification(this.loopEnabled ? '🔁 Repetição ativada' : '⏹️ Repetição desativada', 'info');
        
        this.saveLoopState();
    }

    toggleABRepeat() {
        if (this.loopStart === null) {
            // Set point A
            this.loopStart = this.video.currentTime;
            showNotification(`📍 Ponto A definido: ${this.formatTime(this.loopStart)}`, 'info');
        } else if (this.loopEnd === null) {
            // Set point B
            this.loopEnd = this.video.currentTime;
            if (this.loopEnd <= this.loopStart) {
                showNotification('❌ Ponto B deve ser após o ponto A', 'error');
                this.loopEnd = null;
                return;
            }
            showNotification(`📍 Ponto B definido: ${this.formatTime(this.loopEnd)} - Repetição A-B ativada!`, 'success');
            this.loopEnabled = true;
        } else {
            // Clear A-B repeat
            this.loopStart = null;
            this.loopEnd = null;
            this.loopEnabled = false;
            showNotification('⏹️ Repetição A-B desativada', 'info');
        }
        
        const abBtn = document.querySelector('.ab-repeat-btn');
        abBtn.classList.toggle('active', this.loopStart !== null);
        
        this.saveLoopState();
    }

    checkLoop() {
        if (this.loopEnabled && this.loopStart !== null && this.loopEnd !== null) {
            if (this.video.currentTime >= this.loopEnd) {
                this.video.currentTime = this.loopStart;
            }
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    async saveLoopState() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const videoId = new URLSearchParams(window.location.search).get('v');
        if (!user.id || !videoId) return;

        try {
            await fetch('php/save-loop-state.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': user.id.toString()
                },
                body: JSON.stringify({
                    video_id: videoId,
                    loop_enabled: this.loopEnabled,
                    loop_start: this.loopStart,
                    loop_end: this.loopEnd
                })
            });
        } catch (error) {
            console.error('Failed to save loop state:', error);
        }
    }
}

// ==================== 3. CONTEXT MENU ====================
class VideoContextMenu {
    constructor(videoContainer) {
        this.container = videoContainer;
        this.setupContextMenu();
    }

    setupContextMenu() {
        const menu = document.createElement('div');
        menu.className = 'video-context-menu';
        menu.style.display = 'none';
        menu.innerHTML = `
            <div class="context-menu-item" data-action="pip">
                <i class="fas fa-external-link-square-alt"></i>
                <span>Miniplayer</span>
            </div>
            <div class="context-menu-item" data-action="loop">
                <i class="fas fa-redo"></i>
                <span>Loop</span>
            </div>
            <div class="context-menu-item" data-action="copyUrl">
                <i class="fas fa-link"></i>
                <span>Copiar URL do vídeo</span>
            </div>
            <div class="context-menu-item" data-action="copyUrlTime">
                <i class="fas fa-clock"></i>
                <span>Copiar URL no momento atual</span>
            </div>
            <div class="context-menu-divider"></div>
            <div class="context-menu-item" data-action="stats">
                <i class="fas fa-chart-bar"></i>
                <span>Estatísticas para nerds</span>
            </div>
        `;

        document.body.appendChild(menu);

        // Prevent default context menu
        this.container.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showMenu(e.clientX, e.clientY);
        });

        // Hide menu on click outside
        document.addEventListener('click', () => this.hideMenu());

        // Handle menu actions
        menu.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleAction(item.dataset.action);
                this.hideMenu();
            });
        });
    }

    showMenu(x, y) {
        const menu = document.querySelector('.video-context-menu');
        menu.style.display = 'block';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';

        // Adjust if menu goes off screen
        const rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            menu.style.left = (window.innerWidth - rect.width - 10) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
            menu.style.top = (window.innerHeight - rect.height - 10) + 'px';
        }
    }

    hideMenu() {
        const menu = document.querySelector('.video-context-menu');
        if (menu) menu.style.display = 'none';
    }

    handleAction(action) {
        const video = this.container.querySelector('video');
        const videoId = new URLSearchParams(window.location.search).get('v');

        switch (action) {
            case 'pip':
                if (document.pictureInPictureElement) {
                    document.exitPictureInPicture();
                } else if (video && video.requestPictureInPicture) {
                    video.requestPictureInPicture();
                }
                break;

            case 'loop':
                video.loop = !video.loop;
                showNotification(video.loop ? '🔁 Repetição ativada' : '⏹️ Repetição desativada', 'info');
                break;

            case 'copyUrl':
                const baseUrl = window.location.origin + window.location.pathname;
                const fullUrl = `${baseUrl}?v=${videoId}`;
                navigator.clipboard.writeText(fullUrl);
                showNotification('✅ URL copiada!', 'success');
                break;

            case 'copyUrlTime':
                const timeUrl = `${window.location.origin}${window.location.pathname}?v=${videoId}&t=${Math.floor(video.currentTime)}`;
                navigator.clipboard.writeText(timeUrl);
                showNotification(`✅ URL copiada no momento ${this.formatTime(video.currentTime)}`, 'success');
                break;

            case 'stats':
                this.showStats(video);
                break;
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    showStats(video) {
        const stats = `
            Resolução: ${video.videoWidth}x${video.videoHeight}
            Taxa de quadros: ${video.getVideoPlaybackQuality ? video.getVideoPlaybackQuality().totalVideoFrames : 'N/A'}
            Quadros perdidos: ${video.getVideoPlaybackQuality ? video.getVideoPlaybackQuality().droppedVideoFrames : 'N/A'}
            Buffer: ${video.buffered.length > 0 ? video.buffered.end(0).toFixed(2) : 0}s
            Duração: ${video.duration.toFixed(2)}s
            Posição: ${video.currentTime.toFixed(2)}s
        `;
        alert(stats);
    }
}

// ==================== 4. AUTOPLAY NEXT VIDEO ====================
// ==================== OLD AUTOPLAY (DISABLED - Using custom-player.js version) ====================
/*
class AutoplayManager {
    constructor(videoElement) {
        this.video = videoElement;
        this.autoplayEnabled = localStorage.getItem('autoplay') !== 'false';
        this.countdown = 5;
        this.countdownInterval = null;
        this.setupAutoplay();
    }

    setupAutoplay() {
        this.video.addEventListener('ended', () => {
            if (this.autoplayEnabled) {
                this.startCountdown();
            }
        });

        // Add autoplay toggle button
        const controls = document.querySelector('.custom-controls');
        if (controls) {
            const autoplayBtn = document.createElement('button');
            autoplayBtn.className = 'control-btn autoplay-btn' + (this.autoplayEnabled ? ' active' : '');
            autoplayBtn.title = 'Reprodução automática';
            autoplayBtn.innerHTML = `<i class="fas fa-step-forward"></i>`;
            autoplayBtn.onclick = () => this.toggleAutoplay();
            controls.appendChild(autoplayBtn);
        }
    }

    toggleAutoplay() {
        this.autoplayEnabled = !this.autoplayEnabled;
        localStorage.setItem('autoplay', this.autoplayEnabled);
        
        const btn = document.querySelector('.autoplay-btn');
        btn.classList.toggle('active', this.autoplayEnabled);
        
        showNotification(this.autoplayEnabled ? '▶️ Reprodução automática ativada' : '⏸️ Reprodução automática desativada', 'info');
    }

    startCountdown() {
        this.countdown = 5;
        this.showCountdownOverlay();

        this.countdownInterval = setInterval(() => {
            this.countdown--;
            this.updateCountdownOverlay();

            if (this.countdown <= 0) {
                this.playNextVideo();
            }
        }, 1000);
    }

    showCountdownOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'autoplay-overlay';
        overlay.innerHTML = `
            <div class="autoplay-content">
                <h3>Próximo vídeo</h3>
                <div class="next-video-preview" id="nextVideoPreview">
                    <div class="next-video-thumbnail">
                        <img src="" alt="Próximo vídeo">
                    </div>
                    <div class="next-video-info">
                        <h4></h4>
                        <p></p>
                    </div>
                </div>
                <div class="countdown-circle">
                    <svg width="60" height="60">
                        <circle cx="30" cy="30" r="25" stroke="#fff" stroke-width="3" fill="none" opacity="0.3"></circle>
                        <circle class="countdown-progress" cx="30" cy="30" r="25" stroke="#fff" stroke-width="3" fill="none" 
                                stroke-dasharray="157" stroke-dashoffset="0"></circle>
                    </svg>
                    <span class="countdown-number">${this.countdown}</span>
                </div>
                <button class="btn-cancel-autoplay" onclick="window.autoplayManager.cancelAutoplay()">Cancelar</button>
            </div>
        `;

        document.querySelector('.video-player').appendChild(overlay);
        this.loadNextVideoPreview();
    }

    async loadNextVideoPreview() {
        const videoId = new URLSearchParams(window.location.search).get('v');
        try {
            const response = await fetch(`php/get-random-video.php?exclude=${videoId}`);
            const data = await response.json();
            
            if (data.success && data.video) {
                const next = data.video;
                const preview = document.querySelector('#nextVideoPreview');
                preview.querySelector('img').src = next.thumbnail_url || 'assets/default-thumbnail.jpg';
                preview.querySelector('h4').textContent = next.title;
                preview.querySelector('p').textContent = next.channel_name;
                this.nextVideoId = next.id;
            }
        } catch (error) {
            console.error('Failed to load next video:', error);
        }
    }

    updateCountdownOverlay() {
        const numberEl = document.querySelector('.countdown-number');
        const progressEl = document.querySelector('.countdown-progress');
        
        if (numberEl) numberEl.textContent = this.countdown;
        if (progressEl) {
            const offset = 157 - (157 * (5 - this.countdown) / 5);
            progressEl.style.strokeDashoffset = offset;
        }
    }

    cancelAutoplay() {
        clearInterval(this.countdownInterval);
        const overlay = document.querySelector('.autoplay-overlay');
        if (overlay) overlay.remove();
    }

    playNextVideo() {
        this.cancelAutoplay();
        if (this.nextVideoId) {
            window.location.href = `watch.html?v=${this.nextVideoId}`;
        }
    }
}
*/

// ==================== 5. WATCH LATER ====================
class WatchLaterManager {
    static async toggle(videoId) {
        // Verificar sessão via API
        const sessionResponse = await fetch('php/check-session.php');
        const sessionData = await sessionResponse.json();
        
        if (!sessionData.logged_in) {
            showNotification('❌ Faça login para salvar vídeos', 'error');
            setTimeout(() => window.location.href = 'login.html', 1500);
            return;
        }

        try {
            const response = await fetch('php/watch-later.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': sessionData.user.id.toString()
                },
                body: JSON.stringify({ video_id: videoId })
            });

            const data = await response.json();
            if (data.success) {
                showNotification(data.added ? '📌 Adicionado a Assistir Mais Tarde' : '✅ Removido de Assistir Mais Tarde', 'success');
                
                // Update button state
                const saveBtn = document.getElementById('saveBtn');
                if (saveBtn) {
                    saveBtn.classList.toggle('active', data.added);
                }
            } else {
                showNotification('❌ ' + (data.error || 'Erro ao salvar vídeo'), 'error');
            }
        } catch (error) {
            console.error('Failed to toggle watch later:', error);
            showNotification('❌ Erro ao salvar vídeo', 'error');
        }
    }

    static async checkStatus(videoId) {
        // Verificar sessão via API
        const sessionResponse = await fetch('php/check-session.php');
        const sessionData = await sessionResponse.json();
        
        if (!sessionData.logged_in) return;

        try {
            const response = await fetch(`php/watch-later.php?video_id=${videoId}`, {
                headers: {
                    'X-User-Id': sessionData.user.id.toString()
                }
            });
            const data = await response.json();
            
            const saveBtn = document.getElementById('saveBtn');
            if (saveBtn && data.saved) {
                saveBtn.classList.add('active');
            }
        } catch (error) {
            console.error('Failed to check watch later status:', error);
        }
    }
}

// ==================== 6. TIMELINE HEATMAP ====================
class TimelineHeatmap {
    constructor(videoElement, progressBar) {
        this.video = videoElement;
        this.progressBar = progressBar;
        this.videoId = new URLSearchParams(window.location.search).get('v');
        this.init();
    }

    async init() {
        await this.loadHeatmapData();
        this.renderHeatmap();
        this.trackViewerPosition();
    }

    async loadHeatmapData() {
        try {
            const response = await fetch(`php/get-timeline-heatmap.php?video_id=${this.videoId}`);
            this.heatmapData = await response.json();
        } catch (error) {
            console.error('Failed to load heatmap data:', error);
            this.heatmapData = [];
        }
    }

    renderHeatmap() {
        if (!this.heatmapData || this.heatmapData.length === 0) return;

        const heatmapOverlay = document.createElement('div');
        heatmapOverlay.className = 'heatmap-overlay';
        
        const maxViews = Math.max(...this.heatmapData.map(d => d.view_count));
        
        this.heatmapData.forEach(point => {
            const intensity = point.view_count / maxViews;
            const position = (point.timestamp_seconds / this.video.duration) * 100;
            
            const marker = document.createElement('div');
            marker.className = 'heatmap-marker';
            marker.style.left = `${position}%`;
            marker.style.opacity = intensity;
            marker.style.height = `${3 + (intensity * 5)}px`;
            
            heatmapOverlay.appendChild(marker);
        });

        this.progressBar.appendChild(heatmapOverlay);
    }

    trackViewerPosition() {
        let lastRecordedSecond = -1;

        this.video.addEventListener('timeupdate', () => {
            const currentSecond = Math.floor(this.video.currentTime);
            
            if (currentSecond !== lastRecordedSecond && currentSecond % 5 === 0) {
                this.recordTimelineView(currentSecond);
                lastRecordedSecond = currentSecond;
            }
        });
    }

    async recordTimelineView(timestamp) {
        try {
            await fetch('php/track-timeline-view.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    video_id: this.videoId,
                    timestamp_seconds: timestamp
                })
            });
        } catch (error) {
            console.error('Failed to track timeline view:', error);
        }
    }
}

// ==================== INITIALIZE ALL FEATURES ====================
function initializeAdvancedFeatures() {
    const video = document.getElementById('videoPlayer');
    const videoContainer = document.querySelector('.video-player');
    const progressBar = document.querySelector('.progress-bar');

    if (video) {
        // Initialize all managers
        window.qualityManager = new VideoQualityManager(video);
        window.loopManager = new VideoLoopManager(video);
        // window.autoplayManager = new AutoplayManager(video); // DISABLED - Using custom-player.js version
        
        if (videoContainer) {
            window.contextMenu = new VideoContextMenu(videoContainer);
        }
        
        if (progressBar) {
            window.timelineHeatmap = new TimelineHeatmap(video, progressBar);
        }

        // Check watch later status
        const videoId = new URLSearchParams(window.location.search).get('v');
        if (videoId) {
            WatchLaterManager.checkStatus(videoId);
            window.playlistManager.init(videoId);
        }

        console.log('✅ All advanced features initialized!');
    }
}

// Auto-initialize on watch page
if (window.location.pathname.includes('watch.html')) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAdvancedFeatures);
    } else {
        initializeAdvancedFeatures();
    }
}

// ==================== PLAYLIST MANAGER ====================
class PlaylistManager {
    constructor() {
        this.playlists = [];
        this.currentVideoId = null;
        this.userId = null;
    }

    async init(videoId) {
        this.currentVideoId = videoId;
        
        // Verificar sessão
        const sessionResponse = await fetch('php/check-session.php');
        const sessionData = await sessionResponse.json();
        
        if (sessionData.logged_in) {
            this.userId = sessionData.user.user_id;
            await this.loadUserPlaylists();
        }
    }

    async loadUserPlaylists() {
        if (!this.userId) return;
        
        try {
            let url = `php/get-user-playlists.php`;
            if (this.currentVideoId) {
                url += `?video_id=${this.currentVideoId}`;
            }
            const response = await fetch(url);
            const data = await response.json();
            if (data.success) {
                this.playlists = data.playlists || [];
            }
        } catch (error) {
            console.error('Failed to load playlists:', error);
        }
    }

    async showPlaylistModal() {
        // Verificar sessão primeiro
        const sessionResponse = await fetch('php/check-session.php');
        const sessionData = await sessionResponse.json();
        
        if (!sessionData.logged_in) {
            showNotification('❌ Faça login para salvar em playlists', 'error');
            setTimeout(() => window.location.href = 'login.html', 1500);
            return;
        }
        
        this.userId = sessionData.user.user_id;
        await this.loadUserPlaylists();

        const modal = document.createElement('div');
        modal.className = 'playlist-modal';
        modal.innerHTML = `
            <div class="playlist-modal-content">
                <div class="playlist-modal-header">
                    <h3>Salvar em...</h3>
                    <button class="close-modal-btn" onclick="this.closest('.playlist-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="playlist-list">
                    ${this.playlists.length === 0 ? 
                        '<p class="no-playlists">Você ainda não criou nenhuma playlist</p>' :
                        this.playlists.map(playlist => `
                            <label class="playlist-item">
                                <input type="checkbox" data-playlist-id="${playlist.id}" 
                                       ${playlist.has_video ? 'checked' : ''}>
                                <div class="playlist-info">
                                    <i class="fas fa-list"></i>
                                    <span>${playlist.name}</span>
                                </div>
                                <span class="playlist-count">${playlist.video_count || 0} vídeos</span>
                            </label>
                        `).join('')
                    }
                </div>
                
                <div class="playlist-modal-footer">
                    <button class="btn-create-playlist" onclick="window.playlistManager.showCreatePlaylistForm()">
                        <i class="fas fa-plus"></i> Criar nova playlist
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners for checkboxes
        modal.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const playlistId = e.target.dataset.playlistId;
                if (e.target.checked) {
                    this.addToPlaylist(playlistId);
                } else {
                    this.removeFromPlaylist(playlistId);
                }
            });
        });
    }

    showCreatePlaylistForm() {
        const existingModal = document.querySelector('.playlist-modal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.className = 'playlist-modal';
        modal.innerHTML = `
            <div class="playlist-modal-content">
                <div class="playlist-modal-header">
                    <h3>Nova playlist</h3>
                    <button class="close-modal-btn" onclick="this.closest('.playlist-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="create-playlist-form">
                    <input type="text" id="playlistName" placeholder="Nome da playlist" maxlength="100" 
                           style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; margin-bottom: 12px;">
                    
                    <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; cursor: pointer;">
                        <input type="checkbox" id="playlistPrivate">
                        <span>Privada</span>
                    </label>
                    
                    <textarea id="playlistDescription" placeholder="Descrição (opcional)" rows="3"
                              style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; resize: vertical;"></textarea>
                </div>
                
                <div class="playlist-modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.playlist-modal').remove()">
                        Cancelar
                    </button>
                    <button class="btn-primary" onclick="window.playlistManager.createPlaylist()">
                        Criar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.getElementById('playlistName').focus();
    }

    async createPlaylist() {
        const name = document.getElementById('playlistName').value.trim();
        const isPrivate = document.getElementById('playlistPrivate').checked;
        const description = document.getElementById('playlistDescription').value.trim();

        if (!name) {
            alert('Digite um nome para a playlist');
            return;
        }

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        try {
            const response = await fetch('php/create-playlist.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': user.id.toString()
                },
                body: JSON.stringify({
                    name,
                    description,
                    visibility: isPrivate ? 'private' : 'public'
                })
            });

            const data = await response.json();
            if (data.success) {
                showNotification('✅ Playlist criada!');
                await this.loadUserPlaylists(user.id);
                
                // If current video should be added
                if (this.currentVideoId) {
                    await this.addToPlaylist(data.playlist_id);
                }
                
                // Close modal and reopen playlist selector
                document.querySelector('.playlist-modal').remove();
                this.showPlaylistModal();
            } else {
                alert('Erro ao criar playlist: ' + (data.message || 'Erro desconhecido'));
            }
        } catch (error) {
            console.error('Error creating playlist:', error);
            alert('Erro ao criar playlist');
        }
    }

    async addToPlaylist(playlistId) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        try {
            const response = await fetch('php/add-to-playlist.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': user.id.toString()
                },
                body: JSON.stringify({
                    playlist_id: playlistId,
                    video_id: this.currentVideoId
                })
            });

            const data = await response.json();
            if (data.success) {
                showNotification('✅ Adicionado à playlist');
            }
        } catch (error) {
            console.error('Error adding to playlist:', error);
        }
    }

    async removeFromPlaylist(playlistId) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        try {
            const response = await fetch('php/remove-from-playlist.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': user.id.toString()
                },
                body: JSON.stringify({
                    playlist_id: playlistId,
                    video_id: this.currentVideoId
                })
            });

            const data = await response.json();
            if (data.success) {
                showNotification('🗑️ Removido da playlist');
            }
        } catch (error) {
            console.error('Error removing from playlist:', error);
        }
    }
}

// Export for global access
window.WatchLaterManager = WatchLaterManager;
window.playlistManager = new PlaylistManager();
