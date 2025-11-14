// Google Analytics 4 Integration
// Replace 'G-XXXXXXXXXX' with your actual GA4 Measurement ID

const GA4_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // TODO: Replace with actual ID

// Initialize Google Analytics 4
function initGA4() {
    // Load gtag.js script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
    document.head.appendChild(script);
    
    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', GA4_MEASUREMENT_ID, {
        send_page_view: true,
        cookie_flags: 'SameSite=None;Secure'
    });
    
    // Store gtag globally
    window.gtag = gtag;
    
    console.log('Google Analytics 4 initialized');
}

// Track custom events
function trackEvent(eventName, eventParams = {}) {
    if (typeof gtag === 'function') {
        gtag('event', eventName, eventParams);
        console.log('GA4 Event:', eventName, eventParams);
    }
}

// Video Events
function trackVideoPlay(videoId, videoTitle) {
    trackEvent('video_play', {
        video_id: videoId,
        video_title: videoTitle,
        timestamp: new Date().toISOString()
    });
}

function trackVideoProgress(videoId, videoTitle, percentage) {
    trackEvent('video_progress', {
        video_id: videoId,
        video_title: videoTitle,
        progress_percentage: percentage,
        timestamp: new Date().toISOString()
    });
}

function trackVideoComplete(videoId, videoTitle, watchTime) {
    trackEvent('video_complete', {
        video_id: videoId,
        video_title: videoTitle,
        watch_time_seconds: watchTime,
        timestamp: new Date().toISOString()
    });
}

function trackVideoPause(videoId, currentTime) {
    trackEvent('video_pause', {
        video_id: videoId,
        current_time: currentTime
    });
}

function trackVideoSeek(videoId, fromTime, toTime) {
    trackEvent('video_seek', {
        video_id: videoId,
        from_time: fromTime,
        to_time: toTime
    });
}

// Engagement Events
function trackSubscribe(channelId, channelName) {
    trackEvent('subscribe', {
        channel_id: channelId,
        channel_name: channelName,
        timestamp: new Date().toISOString()
    });
}

function trackUnsubscribe(channelId, channelName) {
    trackEvent('unsubscribe', {
        channel_id: channelId,
        channel_name: channelName,
        timestamp: new Date().toISOString()
    });
}

function trackLike(videoId, videoTitle) {
    trackEvent('like', {
        video_id: videoId,
        video_title: videoTitle,
        reaction_type: 'like'
    });
}

function trackDislike(videoId, videoTitle) {
    trackEvent('dislike', {
        video_id: videoId,
        video_title: videoTitle,
        reaction_type: 'dislike'
    });
}

// Comment Events
function trackComment(videoId, commentLength) {
    trackEvent('comment', {
        video_id: videoId,
        comment_length: commentLength,
        timestamp: new Date().toISOString()
    });
}

function trackCommentReply(videoId, parentCommentId) {
    trackEvent('comment_reply', {
        video_id: videoId,
        parent_comment_id: parentCommentId
    });
}

// Upload Events
function trackUploadStart(videoTitle) {
    trackEvent('upload_start', {
        video_title: videoTitle,
        timestamp: new Date().toISOString()
    });
}

function trackUploadComplete(videoId, videoTitle, fileSize, duration) {
    trackEvent('upload_complete', {
        video_id: videoId,
        video_title: videoTitle,
        file_size_mb: fileSize,
        duration_seconds: duration,
        timestamp: new Date().toISOString()
    });
}

function trackUploadError(errorMessage) {
    trackEvent('upload_error', {
        error_message: errorMessage,
        timestamp: new Date().toISOString()
    });
}

// Search Events
function trackSearch(searchQuery, resultsCount) {
    trackEvent('search', {
        search_term: searchQuery,
        results_count: resultsCount
    });
}

function trackSearchResultClick(searchQuery, videoId, position) {
    trackEvent('select_content', {
        content_type: 'video',
        search_term: searchQuery,
        video_id: videoId,
        position: position
    });
}

// Share Events
function trackShare(videoId, shareMethod) {
    trackEvent('share', {
        content_type: 'video',
        video_id: videoId,
        method: shareMethod // 'facebook', 'twitter', 'whatsapp', 'copy_link', etc.
    });
}

// Navigation Events
function trackPageView(pageName, pageUrl) {
    trackEvent('page_view', {
        page_title: pageName,
        page_location: pageUrl,
        page_path: window.location.pathname
    });
}

function trackNavigation(fromPage, toPage) {
    trackEvent('navigation', {
        from_page: fromPage,
        to_page: toPage
    });
}

// User Events
function trackLogin(method) {
    trackEvent('login', {
        method: method // 'email', 'google', 'facebook', etc.
    });
}

function trackSignUp(method) {
    trackEvent('sign_up', {
        method: method
    });
}

function trackLogout() {
    trackEvent('logout', {
        timestamp: new Date().toISOString()
    });
}

// Player Events
function trackPlayerModeChange(mode) {
    trackEvent('player_mode_change', {
        mode: mode // 'theater', 'cinema', 'fullscreen', 'miniplayer'
    });
}

function trackPlaybackSpeedChange(speed) {
    trackEvent('playback_speed_change', {
        speed: speed
    });
}

function trackVolumeChange(volume) {
    trackEvent('volume_change', {
        volume_level: volume
    });
}

// Error Events
function trackError(errorType, errorMessage, errorContext) {
    trackEvent('error', {
        error_type: errorType,
        error_message: errorMessage,
        error_context: errorContext,
        timestamp: new Date().toISOString()
    });
}

// E-commerce Events (if applicable)
function trackPurchase(transactionId, value, currency = 'BRL') {
    trackEvent('purchase', {
        transaction_id: transactionId,
        value: value,
        currency: currency,
        timestamp: new Date().toISOString()
    });
}

// Custom Dimension: User Type
function setUserType(userType) {
    if (typeof gtag === 'function') {
        gtag('set', 'user_properties', {
            user_type: userType // 'creator', 'viewer', 'premium', etc.
        });
    }
}

// Custom Dimension: Video Category
function setVideoCategory(category) {
    if (typeof gtag === 'function') {
        gtag('set', 'user_properties', {
            video_category: category
        });
    }
}

// Enhanced Measurement - Scroll Tracking
let scrollTracked = {
    25: false,
    50: false,
    75: false,
    90: false
};

function trackScrollDepth() {
    const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    
    [25, 50, 75, 90].forEach(threshold => {
        if (scrollPercentage >= threshold && !scrollTracked[threshold]) {
            scrollTracked[threshold] = true;
            trackEvent('scroll', {
                percent_scrolled: threshold
            });
        }
    });
}

// Enhanced Measurement - Engagement Time
let engagementStartTime = Date.now();
let isPageVisible = true;

function trackEngagementTime() {
    if (isPageVisible) {
        const engagementTime = Math.floor((Date.now() - engagementStartTime) / 1000);
        trackEvent('user_engagement', {
            engagement_time_msec: engagementTime * 1000
        });
    }
}

// Page Visibility API
document.addEventListener('visibilitychange', () => {
    isPageVisible = !document.hidden;
    if (isPageVisible) {
        engagementStartTime = Date.now();
    } else {
        trackEngagementTime();
    }
});

// Track engagement every 30 seconds
setInterval(trackEngagementTime, 30000);

// Track scroll depth
window.addEventListener('scroll', trackScrollDepth);

// Initialize GA4 on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGA4);
} else {
    initGA4();
}

// Track initial page view
trackPageView(document.title, window.location.href);

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        trackEvent,
        trackVideoPlay,
        trackVideoProgress,
        trackVideoComplete,
        trackVideoPause,
        trackVideoSeek,
        trackSubscribe,
        trackUnsubscribe,
        trackLike,
        trackDislike,
        trackComment,
        trackCommentReply,
        trackUploadStart,
        trackUploadComplete,
        trackUploadError,
        trackSearch,
        trackSearchResultClick,
        trackShare,
        trackPageView,
        trackNavigation,
        trackLogin,
        trackSignUp,
        trackLogout,
        trackPlayerModeChange,
        trackPlaybackSpeedChange,
        trackVolumeChange,
        trackError,
        trackPurchase,
        setUserType,
        setVideoCategory
    };
}
