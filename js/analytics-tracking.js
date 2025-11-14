// Analytics Tracking System

// Track thumbnail impressions using Intersection Observer
function initImpressionTracking() {
    if (!('IntersectionObserver' in window)) {
        console.log('IntersectionObserver not supported');
        return;
    }
    
    const observerOptions = {
        threshold: 0.5, // 50% visible
        rootMargin: '0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const videoCard = entry.target;
                const videoId = extractVideoId(videoCard.href);
                
                if (videoId && !videoCard.dataset.tracked) {
                    videoCard.dataset.tracked = 'true';
                    trackImpression(videoId, 'thumbnail_view', getCurrentPage());
                }
            }
        });
    }, observerOptions);
    
    // Observe all video cards
    const observeVideoCards = () => {
        document.querySelectorAll('.video-card').forEach(card => {
            if (!card.dataset.observed) {
                card.dataset.observed = 'true';
                observer.observe(card);
            }
        });
    };
    
    // Initial observation
    observeVideoCards();
    
    // Re-observe when new cards are added (mutations)
    const mutationObserver = new MutationObserver(observeVideoCards);
    const videosGrid = document.getElementById('videosGrid');
    if (videosGrid) {
        mutationObserver.observe(videosGrid, { childList: true, subtree: true });
    }
}

// Track video clicks
function initClickTracking() {
    document.addEventListener('click', (e) => {
        const videoCard = e.target.closest('.video-card');
        if (videoCard) {
            const videoId = extractVideoId(videoCard.href);
            if (videoId) {
                trackImpression(videoId, 'click', getCurrentPage());
            }
        }
    }, true); // Use capture phase
}

// Extract video ID from URL
function extractVideoId(url) {
    if (!url) return null;
    const match = url.match(/[?&]v=(\d+)/);
    return match ? match[1] : null;
}

// Get current page name
function getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('index.html') || path === '/') return 'index';
    if (path.includes('trending.html')) return 'trending';
    if (path.includes('subscriptions.html')) return 'subscriptions';
    if (path.includes('watch.html')) return 'watch';
    if (path.includes('search.html')) return 'search';
    if (path.includes('channel.html')) return 'channel';
    return 'unknown';
}

// Send impression to server
async function trackImpression(videoId, type, source) {
    try {
        await fetch('php/track-impression.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                video_id: videoId,
                type: type,
                source: source
            })
        });
    } catch (error) {
        console.error('Error tracking impression:', error);
    }
}

// Initialize tracking on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initImpressionTracking();
        initClickTracking();
    });
} else {
    initImpressionTracking();
    initClickTracking();
}
