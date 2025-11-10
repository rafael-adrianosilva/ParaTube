// ===== GET VIDEO ID FROM URL =====
const urlParams = new URLSearchParams(window.location.search);
const videoId = urlParams.get('v');

let allComments = [];
let currentSortMode = 'top'; // 'top' or 'recent'

// ===== LOAD VIDEO =====
async function loadVideo() {
    if (!videoId) {
        window.location.href = 'index.html';
        return;
    }
    
    try {
        const response = await fetch(`php/get-video.php?id=${videoId}`);
        const video = await response.json();
        
        if (video.error) {
            alert('Vídeo não encontrado');
            window.location.href = 'index.html';
            return;
        }
        
        displayVideo(video);
        
        // Update subscribe button state
        isSubscribed = video.isSubscribed || false;
        if (isSubscribed) {
            subscribeBtn.textContent = 'INSCRITO';
            subscribeBtn.classList.add('subscribed');
        } else {
            subscribeBtn.textContent = 'INSCREVER-SE';
            subscribeBtn.classList.remove('subscribed');
        }
        
        loadComments();
        loadRelatedVideos();
        incrementViews();
        
    } catch (error) {
        console.error('Erro ao carregar vídeo:', error);
        loadSampleVideo();
    }
}

function loadSampleVideo() {
    const now = new Date();
    const sampleVideo = {
        id: videoId,
        title: 'Tutorial Completo de JavaScript',
        channel: 'CodeMaster',
        channelId: 1,
        subscribers: '1.2M',
        views: 125000,
        created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        likes: 12500,
        dislikes: 250,
        description: `Neste tutorial completo, você vai aprender JavaScript do básico ao avançado.

📚 Conteúdo do vídeo:
• Introdução ao JavaScript
• Variáveis e tipos de dados
• Funções e arrow functions
• Arrays e objetos
• DOM manipulation
• Async/Await e Promises

🔗 Links úteis:
• Documentação: https://developer.mozilla.org
• Repositório: https://github.com/exemplo

👍 Se gostou, deixe seu like e se inscreva no canal!`,
        videoUrl: 'uploads/sample-video.mp4'
    };
    
    displayVideo(sampleVideo);
    loadSampleComments();
    loadSampleRelatedVideos();
}

// ===== TIME FORMATTING =====
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

function displayVideo(video) {
    document.getElementById('videoTitle').textContent = video.title;
    document.getElementById('videoViews').textContent = `${formatNumber(video.views)} visualizações`;
    
    const date = video.created_at ? formatTimeAgo(video.created_at) : (video.date || 'há pouco');
    document.getElementById('videoDate').textContent = date;
    
    document.getElementById('likeCount').textContent = formatNumber(video.likes);
    document.getElementById('dislikeCount').textContent = formatNumber(video.dislikes);
    
    const channelNameElement = document.getElementById('channelName');
    channelNameElement.textContent = video.channel;
    
    // Set channel link and store channel ID
    const channelLink = document.getElementById('channelLink');
    const channelId = video.user_id || video.channelId || 1;
    channelLink.href = `channel.html?id=${channelId}`;
    
    // CRITICAL FIX: Store channel ID in data attribute for subscribe button
    channelNameElement.setAttribute('data-channel-id', channelId);
    
    // Set channel avatar if exists
    if (video.channel_avatar) {
        const avatarContainer = document.getElementById('channelAvatarContainer');
        if (avatarContainer) {
            avatarContainer.innerHTML = `<img src="${video.channel_avatar}" alt="${video.channel}">`;
        }
    }
    
    document.getElementById('channelSubs').textContent = `${video.subscribers} inscritos`;
    
    // Update description box
    document.getElementById('descriptionViews').textContent = `${formatNumber(video.views)} visualizações`;
    document.getElementById('descriptionDate').textContent = date;
    document.getElementById('descriptionContent').innerHTML = video.description.replace(/\n/g, '<br>');
    
    const videoPlayer = document.getElementById('videoPlayer');
    videoPlayer.src = video.videoUrl || '';
}

// ===== DESCRIPTION TOGGLE =====
const descriptionBox = document.getElementById('videoDescriptionBox');
const descriptionToggle = document.getElementById('descriptionToggle');

descriptionToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isExpanded = descriptionBox.classList.toggle('expanded');
    descriptionToggle.textContent = isExpanded ? 'mostrar menos' : 'mostrar mais';
});

descriptionBox?.addEventListener('click', () => {
    if (!descriptionBox.classList.contains('expanded')) {
        descriptionBox.classList.add('expanded');
        descriptionToggle.textContent = 'mostrar menos';
    }
});

// ===== LIKE/DISLIKE =====
const likeBtn = document.getElementById('likeBtn');
const dislikeBtn = document.getElementById('dislikeBtn');

let userReaction = localStorage.getItem(`reaction_${videoId}`);
if (userReaction === 'like') {
    likeBtn.classList.add('active');
} else if (userReaction === 'dislike') {
    dislikeBtn.classList.add('active');
}

likeBtn.addEventListener('click', async () => {
    if (likeBtn.classList.contains('active')) {
        likeBtn.classList.remove('active');
        localStorage.removeItem(`reaction_${videoId}`);
        await updateReaction('none');
    } else {
        likeBtn.classList.add('active');
        dislikeBtn.classList.remove('active');
        localStorage.setItem(`reaction_${videoId}`, 'like');
        await updateReaction('like');
    }
});

dislikeBtn.addEventListener('click', async () => {
    if (dislikeBtn.classList.contains('active')) {
        dislikeBtn.classList.remove('active');
        localStorage.removeItem(`reaction_${videoId}`);
        await updateReaction('none');
    } else {
        dislikeBtn.classList.add('active');
        likeBtn.classList.remove('active');
        localStorage.setItem(`reaction_${videoId}`, 'dislike');
        await updateReaction('dislike');
    }
});

async function updateReaction(reaction) {
    try {
        const response = await fetch('php/update-reaction.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                videoId: videoId,
                reaction: reaction
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Update the displayed counts
            document.getElementById('likeCount').textContent = formatNumber(result.likes);
            document.getElementById('dislikeCount').textContent = formatNumber(result.dislikes);
        }
    } catch (error) {
        console.error('Erro ao atualizar reação:', error);
    }
}

// ===== SUBSCRIBE =====
const subscribeBtn = document.getElementById('subscribeBtn');
let isSubscribed = false;

subscribeBtn.addEventListener('click', async () => {
    console.log('🔔 Subscribe button clicked');
    
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
        alert('Você precisa fazer login para se inscrever!');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        // Get channel ID from the video data
        const channelNameElement = document.getElementById('channelName');
        const channelId = parseInt(channelNameElement.getAttribute('data-channel-id'));
        
        console.log('📺 Channel ID:', channelId);
        
        if (!channelId || isNaN(channelId)) {
            console.error('❌ Invalid channel ID');
            alert('Erro: ID do canal inválido');
            return;
        }
        
        // Disable button during request
        subscribeBtn.disabled = true;
        
        const response = await fetch('php/subscribe.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                channelId: channelId
            })
        });
        
        const result = await response.json();
        console.log('📡 Subscribe response:', result);
        
        if (result.success) {
            isSubscribed = result.subscribed;
            
            if (isSubscribed) {
                subscribeBtn.textContent = 'INSCRITO';
                subscribeBtn.classList.add('subscribed');
                console.log('✅ Subscribed successfully');
            } else {
                subscribeBtn.textContent = 'INSCREVER-SE';
                subscribeBtn.classList.remove('subscribed');
                console.log('✅ Unsubscribed successfully');
            }

            // Reload subscriptions sidebar if the function exists
            if (typeof loadSubscriptionsSidebar === 'function') {
                console.log('🔄 Reloading subscriptions sidebar...');
                loadSubscriptionsSidebar();
            }
        } else {
            console.error('❌ Subscription error:', result.message);
            alert(result.message || 'Erro ao processar inscrição');
        }
    } catch (error) {
        console.error('❌ Error subscribing:', error);
        alert('Erro ao processar inscrição: ' + error.message);
    } finally {
        // Re-enable button
        subscribeBtn.disabled = false;
    }
});

// ===== COMMENTS =====
const commentInput = document.getElementById('commentInput');
const commentForm = document.getElementById('commentForm');
const commentActions = commentForm.querySelector('.comment-actions');
const cancelComment = document.getElementById('cancelComment');

commentInput.addEventListener('focus', () => {
    commentActions.style.display = 'flex';
});

cancelComment.addEventListener('click', () => {
    commentInput.value = '';
    commentActions.style.display = 'none';
    commentInput.blur();
});

commentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const commentText = commentInput.value.trim();
    if (!commentText) return;
    
    try {
        const response = await fetch('php/add-comment.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                videoId: videoId,
                comment: commentText
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            commentInput.value = '';
            commentActions.style.display = 'none';
            loadComments();
        }
        
    } catch (error) {
        console.error('Erro ao adicionar comentário:', error);
        // Add comment locally
        addCommentToList({
            id: Date.now(),
            author: 'Você',
            date: 'agora',
            text: commentText,
            likes: 0
        });
        commentInput.value = '';
        commentActions.style.display = 'none';
    }
});

async function loadComments() {
    try {
        const response = await fetch(`php/get-comments.php?videoId=${videoId}`);
        const comments = await response.json();
        
        allComments = comments;
        document.getElementById('commentCount').textContent = comments.length;
        sortAndDisplayComments();
        
    } catch (error) {
        console.error('Erro ao carregar comentários:', error);
        loadSampleComments();
    }
}

function loadSampleComments() {
    const sampleComments = [
        {
            id: 1,
            author: 'João Silva',
            date: '2 dias atrás',
            text: 'Excelente tutorial! Muito bem explicado, consegui entender tudo.',
            likes: 145
        },
        {
            id: 2,
            author: 'Maria Santos',
            date: '1 dia atrás',
            text: 'Parabéns pelo conteúdo! Esperando a próxima aula 👏',
            likes: 89
        },
        {
            id: 3,
            author: 'Pedro Costa',
            date: '3 horas atrás',
            text: 'Obrigado por compartilhar seu conhecimento. Ajudou muito!',
            likes: 23
        }
    ];
    
    allComments = sampleComments;
    document.getElementById('commentCount').textContent = sampleComments.length;
    sortAndDisplayComments();
}

// Sort and display comments
function sortAndDisplayComments() {
    let sortedComments = [...allComments];
    
    if (currentSortMode === 'top') {
        // Sort by likes (descending)
        sortedComments.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else if (currentSortMode === 'recent') {
        // Sort by date (most recent first)
        sortedComments.sort((a, b) => {
            const dateA = new Date(a.created_at || a.date);
            const dateB = new Date(b.created_at || b.date);
            return dateB - dateA;
        });
    }
    
    displayComments(sortedComments);
}

// Sort dropdown toggle
const sortCommentsBtn = document.getElementById('sortCommentsBtn');
const sortDropdown = document.getElementById('sortDropdown');

sortCommentsBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = sortDropdown.style.display === 'block';
    sortDropdown.style.display = isVisible ? 'none' : 'block';
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!sortDropdown?.contains(e.target) && e.target !== sortCommentsBtn) {
        sortDropdown.style.display = 'none';
    }
});

// Sort option selection
document.querySelectorAll('.sort-option').forEach(option => {
    option.addEventListener('click', () => {
        const sortMode = option.dataset.sort;
        currentSortMode = sortMode;
        
        // Update active state
        document.querySelectorAll('.sort-option').forEach(opt => {
            opt.classList.remove('active');
        });
        option.classList.add('active');
        
        // Sort and display
        sortAndDisplayComments();
        
        // Close dropdown
        sortDropdown.style.display = 'none';
    });
});

function displayComments(comments) {
    const commentsList = document.getElementById('commentsList');
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    commentsList.innerHTML = comments.map(comment => {
        // Use created_at if available, otherwise use date
        const timeAgo = comment.created_at ? formatTimeAgo(comment.created_at) : comment.date;
        const authorId = comment.user_id || comment.authorId || 1;
        const authorAvatar = comment.author_avatar || '';
        const isAuthor = currentUser.id && currentUser.id === authorId;
        
        return `
        <div class="comment" data-comment-id="${comment.id}">
            <a href="channel.html?id=${authorId}" class="comment-avatar">
                ${authorAvatar ? `<img src="${authorAvatar}" alt="${comment.author}">` : '<i class="fas fa-user-circle"></i>'}
            </a>
            <div class="comment-content">
                <div class="comment-header">
                    <a href="channel.html?id=${authorId}" class="comment-author">${comment.author}</a>
                    <span class="comment-date">${timeAgo}</span>
                </div>
                <div class="comment-text">${comment.text}</div>
                <div class="comment-actions-bar">
                    <button class="like-comment-btn" data-id="${comment.id}">
                        <i class="far fa-thumbs-up"></i>
                        <span class="like-count">${comment.likes || 0}</span>
                    </button>
                    <button class="dislike-comment-btn" data-id="${comment.id}">
                        <i class="far fa-thumbs-down"></i>
                    </button>
                    <button class="reply-comment-btn" data-id="${comment.id}">
                        Responder
                    </button>
                    ${isAuthor ? `
                    <button class="delete-comment-btn" data-id="${comment.id}">
                        <i class="fas fa-trash"></i>
                        Apagar
                    </button>
                    ` : `
                    <button class="report-comment-btn" data-id="${comment.id}">
                        <i class="fas fa-flag"></i>
                        Denunciar
                    </button>
                    `}
                </div>
            </div>
        </div>
        `;
    }).join('');
    
    // Add event listeners
    setupCommentInteractions();
}

// Setup comment interaction listeners
function setupCommentInteractions() {
    // Like buttons
    document.querySelectorAll('.like-comment-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const commentId = btn.dataset.id;
            const likeCount = btn.querySelector('.like-count');
            const currentCount = parseInt(likeCount.textContent) || 0;
            
            // Toggle like
            const isLiked = btn.classList.toggle('active');
            likeCount.textContent = isLiked ? currentCount + 1 : currentCount - 1;
            
            // Send to server (implement later)
            console.log('Like comment:', commentId, isLiked);
        });
    });
    
    // Dislike buttons
    document.querySelectorAll('.dislike-comment-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const commentId = btn.dataset.id;
            btn.classList.toggle('active');
            console.log('Dislike comment:', commentId);
        });
    });
    
    // Reply buttons
    document.querySelectorAll('.reply-comment-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const commentId = btn.dataset.id;
            alert('Funcionalidade de responder será implementada em breve!');
            console.log('Reply to comment:', commentId);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-comment-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const commentId = btn.dataset.id;
            
            if (!confirm('Tem certeza que deseja apagar este comentário?')) {
                return;
            }
            
            try {
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                const response = await fetch('php/delete-comment.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-User-Id': currentUser.id?.toString() || ''
                    },
                    body: JSON.stringify({ comment_id: parseInt(commentId) })
                });
                
                if (response.ok) {
                    // Remove from array and re-display
                    allComments = allComments.filter(c => c.id !== parseInt(commentId));
                    document.getElementById('commentCount').textContent = allComments.length;
                    sortAndDisplayComments();
                } else {
                    alert('Erro ao apagar comentário!');
                }
            } catch (error) {
                console.error('Error deleting comment:', error);
                alert('Erro ao apagar comentário!');
            }
        });
    });
    
    // Report buttons
    document.querySelectorAll('.report-comment-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const commentId = btn.dataset.id;
            
            if (confirm('Deseja denunciar este comentário por conteúdo inapropriado?')) {
                alert('Comentário denunciado! Nossa equipe irá revisar.');
                console.log('Report comment:', commentId);
                // Implement server-side reporting later
            }
        });
    });
}

function addCommentToList(comment) {
    const commentsList = document.getElementById('commentsList');
    const commentCount = document.getElementById('commentCount');
    
    // New comments are "agora" (now)
    const timeAgo = comment.created_at ? formatTimeAgo(comment.created_at) : 'agora';
    
    const commentHTML = `
        <div class="comment">
            <div class="comment-avatar">
                <i class="fas fa-user-circle"></i>
            </div>
            <div class="comment-content">
                <div class="comment-header">
                    <span class="comment-author">${comment.author}</span>
                    <span class="comment-date">${timeAgo}</span>
                </div>
                <div class="comment-text">${comment.text}</div>
                <div class="comment-actions-bar">
                    <button class="like-comment" data-id="${comment.id}">
                        <i class="far fa-thumbs-up"></i>
                        <span>${comment.likes || 0}</span>
                    </button>
                    <button class="dislike-comment">
                        <i class="far fa-thumbs-down"></i>
                    </button>
                    <button class="reply-comment">
                        Responder
                    </button>
                </div>
            </div>
        </div>
    `;
    
    commentsList.insertAdjacentHTML('afterbegin', commentHTML);
    commentCount.textContent = parseInt(commentCount.textContent) + 1;
}

// ===== RELATED VIDEOS =====
async function loadRelatedVideos() {
    try {
        const response = await fetch(`php/get-related-videos.php?videoId=${videoId}`);
        const videos = await response.json();
        displayRelatedVideos(videos);
    } catch (error) {
        console.error('Erro ao carregar vídeos relacionados:', error);
        loadSampleRelatedVideos();
    }
}

function loadSampleRelatedVideos() {
    const sampleVideos = [
        {
            id: 2,
            title: 'JavaScript Avançado - Classes e Objetos',
            channel: 'CodeMaster',
            views: '850K',
            date: '3 dias atrás',
            thumbnail: 'https://via.placeholder.com/168x94/667eea/ffffff?text=JS+Classes'
        },
        {
            id: 3,
            title: 'Async/Await em JavaScript',
            channel: 'CodeMaster',
            views: '620K',
            date: '1 semana atrás',
            thumbnail: 'https://via.placeholder.com/168x94/764ba2/ffffff?text=Async'
        },
        {
            id: 4,
            title: 'Manipulando o DOM com JavaScript',
            channel: 'Web Masters',
            views: '1.1M',
            date: '5 dias atrás',
            thumbnail: 'https://via.placeholder.com/168x94/f093fb/ffffff?text=DOM'
        },
        {
            id: 5,
            title: 'Fetch API - Consumindo APIs REST',
            channel: 'API Tutorials',
            views: '750K',
            date: '2 dias atrás',
            thumbnail: 'https://via.placeholder.com/168x94/4facfe/ffffff?text=Fetch+API'
        }
    ];
    
    displayRelatedVideos(sampleVideos);
}

function displayRelatedVideos(videos) {
    const relatedVideos = document.getElementById('relatedVideos');
    
    relatedVideos.innerHTML = videos.map(video => `
        <a href="watch.html?v=${video.id}" class="related-video">
            <div class="related-thumbnail">
                <img src="${video.thumbnail}" alt="${video.title}">
            </div>
            <div class="related-info">
                <h4>${video.title}</h4>
                <div class="channel-name">${video.channel}</div>
                <div class="video-stats">${video.views} visualizações • ${video.date}</div>
            </div>
        </a>
    `).join('');
}

// ===== INCREMENT VIEWS =====
async function incrementViews() {
    try {
        await fetch('php/increment-views.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                videoId: videoId
            })
        });
    } catch (error) {
        console.error('Erro ao incrementar visualizações:', error);
    }
}

// ===== UTILITY FUNCTIONS =====
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// ===== SHARE BUTTON =====
document.getElementById('shareBtn')?.addEventListener('click', () => {
    const videoUrl = window.location.href;
    
    // Try to use native share API if available
    if (navigator.share) {
        navigator.share({
            title: document.getElementById('videoTitle').textContent,
            url: videoUrl
        }).catch(err => console.log('Erro ao compartilhar:', err));
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(videoUrl).then(() => {
            alert('Link copiado para a área de transferência!');
        }).catch(err => {
            console.error('Erro ao copiar:', err);
            // Show a simple prompt with the URL
            prompt('Copie o link:', videoUrl);
        });
    }
});

// ===== SAVE BUTTON =====
document.getElementById('saveBtn')?.addEventListener('click', () => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!currentUser.id) {
        alert('Faça login para salvar vídeos!');
        window.location.href = 'login.html';
        return;
    }
    
    // For now, just show a message
    // Later this will open a playlist modal
    alert('Recurso de salvar em playlist será implementado em breve!');
});

// ===== INITIALIZE PAGE =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 Watch page loaded');
    
    // Close sidebar automatically for better video viewing experience
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    const menuBtn = document.getElementById('menuBtn');
    
    if (sidebar) {
        // Remove active class and add closed class
        sidebar.classList.remove('active');
        sidebar.classList.add('closed');
        console.log('✅ Sidebar fechada automaticamente para melhor visualização');
    }
    
    if (mainContent) {
        mainContent.classList.add('full-width');
    }
    
    // Menu button toggle
    if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', () => {
            const isClosed = sidebar.classList.contains('closed');
            
            if (isClosed) {
                sidebar.classList.remove('closed');
                sidebar.classList.add('active');
                mainContent?.classList.remove('full-width');
            } else {
                sidebar.classList.remove('active');
                sidebar.classList.add('closed');
                mainContent?.classList.add('full-width');
            }
            
            console.log('🔄 Sidebar toggled:', isClosed ? 'opened' : 'closed');
        });
    }
    
    // Load video
    loadVideo();
});

