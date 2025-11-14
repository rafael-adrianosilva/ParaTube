// ===== GET VIDEO ID FROM URL =====
const urlParams = new URLSearchParams(window.location.search);
const videoId = urlParams.get('v');

let allComments = [];
let currentSortMode = 'top'; // 'top' or 'recent'
let currentVideo = null; // Store video data for checking creator

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
        
        currentVideo = video; // Store video data
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
    
    const parentId = commentInput.dataset.parentId || null;
    
    try {
        const response = await fetch('php/add-comment.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                videoId: videoId,
                comment: commentText,
                parentId: parentId ? parseInt(parentId) : null
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            commentInput.value = '';
            delete commentInput.dataset.parentId; // Clear parent ID
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
    const isVideoCreator = currentVideo && currentUser.id && currentUser.id === currentVideo.channelId;
    
    // Separate parent comments from replies
    const parentComments = comments.filter(c => !c.parent_id);
    const repliesMap = {};
    
    comments.filter(c => c.parent_id).forEach(reply => {
        if (!repliesMap[reply.parent_id]) repliesMap[reply.parent_id] = [];
        repliesMap[reply.parent_id].push(reply);
    });
    
    commentsList.innerHTML = parentComments.map(comment => {
        const timeAgo = comment.created_at ? formatTimeAgo(comment.created_at) : comment.date;
        const authorId = comment.user_id || comment.authorId || 1;
        const authorAvatar = comment.author_avatar || '';
        const isCommentAuthor = currentUser.id && currentUser.id === authorId;
        const replies = repliesMap[comment.id] || [];
        
        let commentHTML = `
        <div class="comment ${comment.is_pinned ? 'pinned-comment' : ''}" data-comment-id="${comment.id}">
            ${comment.is_pinned ? '<div class="pinned-badge"><i class="fas fa-thumbtack"></i> Fixado por ' + (currentVideo?.channel || 'criador') + '</div>' : ''}
            <a href="channel.html?id=${authorId}" class="comment-avatar">
                ${authorAvatar ? `<img src="${authorAvatar}" alt="${comment.author}">` : '<i class="fas fa-user-circle"></i>'}
            </a>
            <div class="comment-content">
                <div class="comment-header">
                    <a href="channel.html?id=${authorId}" class="comment-author">${comment.author}</a>
                    ${comment.is_hearted ? '<i class="fas fa-heart creator-heart" title="❤️ do criador"></i>' : ''}
                    <span class="comment-date">${timeAgo}${comment.edited_at ? ' (editado)' : ''}</span>
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
                    <button class="reply-comment-btn" data-id="${comment.id}" data-author="${comment.author}">
                        Responder
                    </button>
                    ${isVideoCreator ? `
                    <button class="pin-comment-btn ${comment.is_pinned ? 'active' : ''}" data-id="${comment.id}" title="${comment.is_pinned ? 'Desafixar' : 'Fixar'} comentário">
                        <i class="fas fa-thumbtack"></i>
                        ${comment.is_pinned ? 'Desafixar' : 'Fixar'}
                    </button>
                    <button class="heart-comment-btn ${comment.is_hearted ? 'active' : ''}" data-id="${comment.id}" title="${comment.is_hearted ? 'Remover' : 'Adicionar'} ❤️">
                        <i class="${comment.is_hearted ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                    ` : ''}
                    ${isCommentAuthor ? `
                    <button class="delete-comment-btn" data-id="${comment.id}">
                        <i class="fas fa-trash"></i>
                        Apagar
                    </button>
                    ` : `
                    ${!isVideoCreator ? `
                    <button class="report-comment-btn" data-id="${comment.id}">
                        <i class="fas fa-flag"></i>
                        Denunciar
                    </button>
                    ` : ''}
                    `}
                </div>
            </div>
        </div>`;
        
        // Add replies
        if (replies.length > 0) {
            commentHTML += '<div class="comment-replies">';
            replies.forEach(reply => {
                const replyTimeAgo = reply.created_at ? formatTimeAgo(reply.created_at) : reply.date;
                const replyAuthorId = reply.user_id || reply.authorId || 1;
                const replyAuthorAvatar = reply.author_avatar || '';
                const isReplyAuthor = currentUser.id && currentUser.id === replyAuthorId;
                
                commentHTML += `
                <div class="comment comment-reply" data-comment-id="${reply.id}">
                    <a href="channel.html?id=${replyAuthorId}" class="comment-avatar">
                        ${replyAuthorAvatar ? `<img src="${replyAuthorAvatar}" alt="${reply.author}">` : '<i class="fas fa-user-circle"></i>'}
                    </a>
                    <div class="comment-content">
                        <div class="comment-header">
                            <a href="channel.html?id=${replyAuthorId}" class="comment-author">${reply.author}</a>
                            ${reply.is_hearted ? '<i class="fas fa-heart creator-heart" title="❤️ do criador"></i>' : ''}
                            <span class="comment-date">${replyTimeAgo}${reply.edited_at ? ' (editado)' : ''}</span>
                        </div>
                        <div class="comment-text">${reply.text}</div>
                        <div class="comment-actions-bar">
                            <button class="like-comment-btn" data-id="${reply.id}">
                                <i class="far fa-thumbs-up"></i>
                                <span class="like-count">${reply.likes || 0}</span>
                            </button>
                            <button class="dislike-comment-btn" data-id="${reply.id}">
                                <i class="far fa-thumbs-down"></i>
                            </button>
                            ${isVideoCreator ? `
                            <button class="heart-comment-btn ${reply.is_hearted ? 'active' : ''}" data-id="${reply.id}" title="${reply.is_hearted ? 'Remover' : 'Adicionar'} ❤️">
                                <i class="${reply.is_hearted ? 'fas' : 'far'} fa-heart"></i>
                            </button>
                            ` : ''}
                            ${isReplyAuthor ? `
                            <button class="delete-comment-btn" data-id="${reply.id}">
                                <i class="fas fa-trash"></i>
                                Apagar
                            </button>
                            ` : ''}
                        </div>
                    </div>
                </div>`;
            });
            commentHTML += '</div>';
        }
        
        return commentHTML;
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
            const author = btn.dataset.author;
            const commentInput = document.getElementById('commentInput');
            
            // Set focus and add @mention
            commentInput.focus();
            commentInput.value = `@${author} `;
            commentInput.dataset.parentId = commentId; // Store parent ID for reply
        });
    });
    
    // Pin buttons (only for video creator)
    document.querySelectorAll('.pin-comment-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const commentId = btn.dataset.id;
            
            try {
                const response = await fetch('php/pin-comment.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ comment_id: parseInt(commentId) })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Reload comments to show updated state
                    loadComments();
                } else {
                    alert(result.message || 'Erro ao fixar comentário');
                }
            } catch (error) {
                console.error('Error pinning comment:', error);
                alert('Erro ao fixar comentário!');
            }
        });
    });
    
    // Heart buttons (only for video creator)
    document.querySelectorAll('.heart-comment-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const commentId = btn.dataset.id;
            
            try {
                const response = await fetch('php/heart-comment.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ comment_id: parseInt(commentId) })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Toggle heart visual state
                    const icon = btn.querySelector('i');
                    btn.classList.toggle('active');
                    if (result.is_hearted) {
                        icon.className = 'fas fa-heart';
                    } else {
                        icon.className = 'far fa-heart';
                    }
                } else {
                    alert(result.message || 'Erro ao dar coração');
                }
            } catch (error) {
                console.error('Error hearting comment:', error);
                alert('Erro ao dar coração!');
            }
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
        const response = await fetch(`php/get-related-videos.php?video_id=${videoId}`);
        const data = await response.json();
        
        if (data.success && data.videos && Array.isArray(data.videos)) {
            displayRelatedVideos(data.videos);
        } else {
            console.warn('No related videos found, loading samples');
            loadSampleRelatedVideos();
        }
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
    
    relatedVideos.innerHTML = videos.map(video => {
        const thumbnail = video.thumbnail_url || video.thumbnail || 
                         `https://via.placeholder.com/168x94/667eea/ffffff?text=${encodeURIComponent(video.title.substring(0, 20))}`;
        
        return `
            <a href="watch.html?v=${video.id}" class="related-video">
                <div class="related-thumbnail">
                    <img src="${thumbnail}" 
                         alt="${video.title}"
                         onerror="this.src='https://via.placeholder.com/168x94/667eea/ffffff?text=Video'">
                    ${video.duration ? `<span class="video-duration">${video.duration}</span>` : ''}
                </div>
                <div class="related-info">
                    <h4>${video.title}</h4>
                    <div class="channel-name">${video.channel_name || video.channel}</div>
                    <div class="video-stats">${formatViews(video.views)} visualizações</div>
                </div>
            </a>
        `;
    }).join('');
}

function formatViews(views) {
    if (typeof views === 'string') return views;
    const num = parseInt(views) || 0;
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
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

// ===== ADD TO HISTORY =====
async function addToHistory(videoId) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.id) return;

    try {
        await fetch('php/add-to-history.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': user.id.toString()
            },
            body: JSON.stringify({ video_id: videoId })
        });
    } catch (error) {
        console.error('Erro ao adicionar ao histórico:', error);
    }
}

// ===== VIDEO PROGRESS TRACKING =====
let progressSaveInterval = null;

async function loadVideoProgress() {
    try {
        const response = await fetch(`php/get-progress.php?video_id=${videoId}`);
        const data = await response.json();
        
        if (data.progress_time > 0 && !data.completed) {
            const video = document.querySelector('#videoPlayer video');
            if (video) {
                video.currentTime = data.progress_time;
            }
        }
    } catch (error) {
        console.error('Erro ao carregar progresso:', error);
    }
}

async function saveVideoProgress() {
    const video = document.querySelector('#videoPlayer video');
    if (!video || !videoId) return;
    
    try {
        await fetch('php/save-progress.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                video_id: parseInt(videoId),
                progress_time: video.currentTime,
                duration: video.duration
            })
        });
    } catch (error) {
        console.error('Erro ao salvar progresso:', error);
    }
}

function startProgressTracking() {
    const video = document.querySelector('#videoPlayer video');
    if (!video) return;
    
    // Load saved progress
    loadVideoProgress();
    
    // Add to history when video starts playing
    let addedToHistory = false;
    
    // Save progress every 5 seconds while playing
    video.addEventListener('play', () => {
        if (progressSaveInterval) clearInterval(progressSaveInterval);
        progressSaveInterval = setInterval(saveVideoProgress, 5000);
        
        // Add to history on first play
        if (!addedToHistory && videoId) {
            addedToHistory = true;
            addToHistory(videoId);
            
            // Check for achievements after watching
            setTimeout(() => {
                if (typeof window.checkAchievements === 'function') {
                    window.checkAchievements();
                }
            }, 2000);
        }
    });
    
    video.addEventListener('pause', () => {
        if (progressSaveInterval) {
            clearInterval(progressSaveInterval);
            progressSaveInterval = null;
        }
        saveVideoProgress(); // Save on pause
    });
    
    // Save progress before page unload
    window.addEventListener('beforeunload', () => {
        if (video && !video.paused) {
            saveVideoProgress();
        }
    });
    
    // Save when video ends
    video.addEventListener('ended', saveVideoProgress);
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

// ===== SAVE BUTTON (REMOVED - NOW HANDLED BY WATCH LATER) =====
// Save button now triggers Watch Later functionality via inline onclick

// ===== INITIALIZE PAGE =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 Watch page loaded');
    
    // Initialize progress tracking
    startProgressTracking();
    
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
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
});

// ===== KEYBOARD SHORTCUTS =====
function setupKeyboardShortcuts() {
    const videoPlayer = document.getElementById('videoPlayer');
    
    if (!videoPlayer) {
        console.error('❌ Video player não encontrado para atalhos de teclado');
        return;
    }
    
    document.addEventListener('keydown', (e) => {
        // Ignorar se estiver digitando em input/textarea
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        switch(e.key.toLowerCase()) {
            case ' ': // Space = Play/Pause
            case 'k':
                e.preventDefault();
                if (videoPlayer.paused) {
                    videoPlayer.play();
                    console.log('▶️ Play (atalho: Espaço/K)');
                } else {
                    videoPlayer.pause();
                    console.log('⏸️ Pause (atalho: Espaço/K)');
                }
                break;
                
            case 'arrowleft': // Seta esquerda = -5s
                e.preventDefault();
                videoPlayer.currentTime = Math.max(0, videoPlayer.currentTime - 5);
                console.log('⏪ -5s (atalho: ←)');
                showTimeIndicator(-5);
                break;
                
            case 'arrowright': // Seta direita = +5s
                e.preventDefault();
                videoPlayer.currentTime = Math.min(videoPlayer.duration, videoPlayer.currentTime + 5);
                console.log('⏩ +5s (atalho: →)');
                showTimeIndicator(+5);
                break;
                
            case 'j': // J = -10s
                e.preventDefault();
                videoPlayer.currentTime = Math.max(0, videoPlayer.currentTime - 10);
                console.log('⏪ -10s (atalho: J)');
                showTimeIndicator(-10);
                break;
                
            case 'l': // L = +10s
                e.preventDefault();
                videoPlayer.currentTime = Math.min(videoPlayer.duration, videoPlayer.currentTime + 10);
                console.log('⏩ +10s (atalho: L)');
                showTimeIndicator(+10);
                break;
                
            case 'f': // F = Fullscreen
                e.preventDefault();
                if (!document.fullscreenElement) {
                    videoPlayer.requestFullscreen();
                    console.log('🖥️ Fullscreen ON (atalho: F)');
                } else {
                    document.exitFullscreen();
                    console.log('🖥️ Fullscreen OFF (atalho: F)');
                }
                break;
                
            case 'm': // M = Mute
                e.preventDefault();
                videoPlayer.muted = !videoPlayer.muted;
                console.log(videoPlayer.muted ? '🔇 Mudo ON (atalho: M)' : '🔊 Mudo OFF (atalho: M)');
                break;
                
            case 'arrowup': // Seta cima = +10% volume
                e.preventDefault();
                videoPlayer.volume = Math.min(1, videoPlayer.volume + 0.1);
                console.log('🔊 Volume:', Math.round(videoPlayer.volume * 100) + '%');
                showVolumeIndicator(videoPlayer.volume);
                break;
                
            case 'arrowdown': // Seta baixo = -10% volume
                e.preventDefault();
                videoPlayer.volume = Math.max(0, videoPlayer.volume - 0.1);
                console.log('🔉 Volume:', Math.round(videoPlayer.volume * 100) + '%');
                showVolumeIndicator(videoPlayer.volume);
                break;
                
            case '<': // < = Diminuir velocidade
            case ',':
                e.preventDefault();
                const slower = Math.max(0.25, videoPlayer.playbackRate - 0.25);
                videoPlayer.playbackRate = slower;
                console.log('🐢 Velocidade:', slower + 'x');
                showSpeedIndicator(slower);
                break;
                
            case '>': // > = Aumentar velocidade
            case '.':
                e.preventDefault();
                const faster = Math.min(2, videoPlayer.playbackRate + 0.25);
                videoPlayer.playbackRate = faster;
                console.log('🐇 Velocidade:', faster + 'x');
                showSpeedIndicator(faster);
                break;
                
            case '0':
            case 'home': // 0 ou Home = Início do vídeo
                e.preventDefault();
                videoPlayer.currentTime = 0;
                console.log('⏮️ Início (atalho: 0/Home)');
                break;
                
            case 'end': // End = Fim do vídeo
                e.preventDefault();
                videoPlayer.currentTime = videoPlayer.duration;
                console.log('⏭️ Fim (atalho: End)');
                break;
                
            case '?': // ? = Mostrar atalhos
                e.preventDefault();
                showKeyboardShortcutsHelp();
                break;
        }
    });
    
    console.log('⌨️ Atalhos de teclado ativados! Pressione ? para ver a lista');
}

// Indicador visual de tempo
function showTimeIndicator(seconds) {
    const indicator = document.createElement('div');
    indicator.className = 'time-indicator';
    indicator.textContent = (seconds > 0 ? '+' : '') + seconds + 's';
    indicator.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        font-size: 24px;
        font-weight: bold;
        z-index: 10000;
        pointer-events: none;
        animation: fadeInOut 0.8s ease-in-out;
    `;
    document.body.appendChild(indicator);
    setTimeout(() => indicator.remove(), 800);
}

// Indicador visual de volume
function showVolumeIndicator(volume) {
    const indicator = document.createElement('div');
    indicator.className = 'volume-indicator';
    const percentage = Math.round(volume * 100);
    indicator.innerHTML = `🔊 ${percentage}%`;
    indicator.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        font-size: 24px;
        font-weight: bold;
        z-index: 10000;
        pointer-events: none;
        animation: fadeInOut 0.8s ease-in-out;
    `;
    document.body.appendChild(indicator);
    setTimeout(() => indicator.remove(), 800);
}

// Indicador visual de velocidade
function showSpeedIndicator(speed) {
    const indicator = document.createElement('div');
    indicator.className = 'speed-indicator';
    indicator.innerHTML = `⚡ ${speed}x`;
    indicator.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        font-size: 24px;
        font-weight: bold;
        z-index: 10000;
        pointer-events: none;
        animation: fadeInOut 0.8s ease-in-out;
    `;
    document.body.appendChild(indicator);
    setTimeout(() => indicator.remove(), 800);
}

// Modal de ajuda de atalhos
function showKeyboardShortcutsHelp() {
    const modal = document.createElement('div');
    modal.className = 'shortcuts-modal';
    modal.innerHTML = `
        <div class="shortcuts-modal-content">
            <div class="shortcuts-header">
                <h2>⌨️ Atalhos de Teclado</h2>
                <button class="close-shortcuts" onclick="this.closest('.shortcuts-modal').remove()">×</button>
            </div>
            <div class="shortcuts-list">
                <div class="shortcut-item">
                    <span class="key">Espaço / K</span>
                    <span class="action">Play / Pause</span>
                </div>
                <div class="shortcut-item">
                    <span class="key">← / →</span>
                    <span class="action">-5s / +5s</span>
                </div>
                <div class="shortcut-item">
                    <span class="key">J / L</span>
                    <span class="action">-10s / +10s</span>
                </div>
                <div class="shortcut-item">
                    <span class="key">F</span>
                    <span class="action">Tela Cheia</span>
                </div>
                <div class="shortcut-item">
                    <span class="key">M</span>
                    <span class="action">Silenciar</span>
                </div>
                <div class="shortcut-item">
                    <span class="key">↑ / ↓</span>
                    <span class="action">Volume +10% / -10%</span>
                </div>
                <div class="shortcut-item">
                    <span class="key">&lt; / &gt;</span>
                    <span class="action">Velocidade -0.25x / +0.25x</span>
                </div>
                <div class="shortcut-item">
                    <span class="key">0 / Home</span>
                    <span class="action">Início do vídeo</span>
                </div>
                <div class="shortcut-item">
                    <span class="key">End</span>
                    <span class="action">Fim do vídeo</span>
                </div>
                <div class="shortcut-item">
                    <span class="key">?</span>
                    <span class="action">Mostrar este menu</span>
                </div>
            </div>
        </div>
    `;
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    document.body.appendChild(modal);
    
    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// CSS para animações
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    }
    
    .shortcuts-modal-content {
        background: var(--bg-primary);
        border-radius: 12px;
        padding: 0;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow: auto;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }
    
    .shortcuts-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid var(--border-color);
    }
    
    .shortcuts-header h2 {
        margin: 0;
        color: var(--text-primary);
        font-size: 20px;
    }
    
    .close-shortcuts {
        background: none;
        border: none;
        font-size: 32px;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s;
    }
    
    .close-shortcuts:hover {
        background: var(--bg-secondary);
        color: var(--text-primary);
    }
    
    .shortcuts-list {
        padding: 20px;
    }
    
    .shortcut-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid var(--border-color);
    }
    
    .shortcut-item:last-child {
        border-bottom: none;
    }
    
    .shortcut-item .key {
        background: var(--bg-secondary);
        padding: 6px 12px;
        border-radius: 6px;
        font-family: 'Courier New', monospace;
        font-weight: bold;
        color: var(--text-primary);
        border: 1px solid var(--border-color);
    }
    
    .shortcut-item .action {
        color: var(--text-secondary);
        font-size: 14px;
    }
`;
document.head.appendChild(style);

// ===== MINI PLAYER ON SCROLL =====
let miniPlayerActive = false;
let miniPlayerElement = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

function createMiniPlayer() {
    if (miniPlayerElement) return miniPlayerElement;
    
    const video = document.querySelector('#videoPlayer video');
    if (!video) return null;
    
    const miniPlayer = document.createElement('div');
    miniPlayer.id = 'miniPlayer';
    miniPlayer.className = 'mini-player';
    miniPlayer.innerHTML = `
        <div class="mini-player-video-container"></div>
        <button class="mini-player-close" title="Fechar mini player">
            <i class="fas fa-times"></i>
        </button>
        <button class="mini-player-expand" title="Voltar ao player">
            <i class="fas fa-expand"></i>
        </button>
    `;
    
    document.body.appendChild(miniPlayer);
    miniPlayerElement = miniPlayer;
    
    // Move video to mini player
    const videoContainer = miniPlayer.querySelector('.mini-player-video-container');
    const originalParent = video.parentElement;
    miniPlayer.dataset.originalParent = originalParent.id || 'videoPlayer';
    videoContainer.appendChild(video);
    
    // Close button
    miniPlayer.querySelector('.mini-player-close').addEventListener('click', () => {
        video.pause();
        closeMiniPlayer();
    });
    
    // Expand button
    miniPlayer.querySelector('.mini-player-expand').addEventListener('click', () => {
        closeMiniPlayer();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    // Make draggable
    setupMiniPlayerDrag(miniPlayer);
    
    return miniPlayer;
}

function setupMiniPlayerDrag(miniPlayer) {
    miniPlayer.addEventListener('mousedown', (e) => {
        if (e.target.closest('.mini-player-close') || e.target.closest('.mini-player-expand')) return;
        
        isDragging = true;
        const rect = miniPlayer.getBoundingClientRect();
        dragOffset.x = e.clientX - rect.left;
        dragOffset.y = e.clientY - rect.top;
        
        miniPlayer.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging || !miniPlayerElement) return;
        
        let x = e.clientX - dragOffset.x;
        let y = e.clientY - dragOffset.y;
        
        // Keep within viewport bounds
        const rect = miniPlayerElement.getBoundingClientRect();
        x = Math.max(0, Math.min(x, window.innerWidth - rect.width));
        y = Math.max(0, Math.min(y, window.innerHeight - rect.height));
        
        miniPlayerElement.style.left = x + 'px';
        miniPlayerElement.style.top = y + 'px';
        miniPlayerElement.style.right = 'auto';
        miniPlayerElement.style.bottom = 'auto';
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging && miniPlayerElement) {
            miniPlayerElement.style.cursor = 'grab';
            isDragging = false;
        }
    });
}

function closeMiniPlayer() {
    if (!miniPlayerElement) return;
    
    const video = miniPlayerElement.querySelector('video');
    const originalParentId = miniPlayerElement.dataset.originalParent;
    const originalParent = document.getElementById(originalParentId);
    
    if (video && originalParent) {
        originalParent.appendChild(video);
    }
    
    miniPlayerElement.remove();
    miniPlayerElement = null;
    miniPlayerActive = false;
}

function handleScroll() {
    const videoSection = document.querySelector('#videoPlayer');
    if (!videoSection) return;
    
    const video = videoSection.querySelector('video');
    if (!video) return;
    
    const rect = videoSection.getBoundingClientRect();
    const isVideoOutOfView = rect.bottom < 0;
    
    // Only activate mini player if video is playing and scrolled out of view
    if (isVideoOutOfView && !video.paused && !miniPlayerActive) {
        miniPlayerActive = true;
        createMiniPlayer();
    } else if (!isVideoOutOfView && miniPlayerActive) {
        closeMiniPlayer();
    }
}

// Listen to scroll events
let scrollTimeout;
window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(handleScroll, 50);
});

// Add mini player CSS
const miniPlayerStyle = document.createElement('style');
miniPlayerStyle.textContent = `
    .mini-player {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 400px;
        height: 225px;
        background: #000;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        z-index: 10000;
        cursor: grab;
        transition: box-shadow 0.2s;
    }
    
    .mini-player:hover {
        box-shadow: 0 12px 48px rgba(0, 0, 0, 0.7);
    }
    
    .mini-player-video-container {
        width: 100%;
        height: 100%;
    }
    
    .mini-player video {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
    
    .mini-player-close,
    .mini-player-expand {
        position: absolute;
        top: 8px;
        background: rgba(0, 0, 0, 0.7);
        border: none;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        transition: all 0.2s;
        z-index: 1;
    }
    
    .mini-player-close {
        right: 8px;
    }
    
    .mini-player-expand {
        right: 48px;
    }
    
    .mini-player-close:hover,
    .mini-player-expand:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.1);
    }
    
    @media (max-width: 768px) {
        .mini-player {
            width: 280px;
            height: 157px;
            bottom: 10px;
            right: 10px;
        }
    }
`;
document.head.appendChild(miniPlayerStyle);


// ==================== CINEMA MODE ====================
let cinemaMode = false;

// Initialize cinema mode
function initCinemaMode() {
    const cinemaBtn = document.getElementById('cinemaBtn');
    if (!cinemaBtn) return;
    
    // Load saved preference
    const savedMode = localStorage.getItem('cinemaMode');
    if (savedMode === 'true') {
        enableCinemaMode();
    }
    
    // Cinema button click
    cinemaBtn.addEventListener('click', toggleCinemaMode);
    
    // Keyboard shortcut: 'C' key
    document.addEventListener('keydown', (e) => {
        // Ignore if typing in input/textarea
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        if (e.key === 'c' || e.key === 'C') {
            e.preventDefault();
            toggleCinemaMode();
        }
    });
}

function toggleCinemaMode() {
    if (cinemaMode) {
        disableCinemaMode();
    } else {
        enableCinemaMode();
    }
}

function enableCinemaMode() {
    cinemaMode = true;
    document.body.classList.add('cinema-mode');
    
    const cinemaBtn = document.getElementById('cinemaBtn');
    if (cinemaBtn) {
        cinemaBtn.innerHTML = '<i class="fas fa-compress"></i><span>Sair do Cinema</span>';
        cinemaBtn.classList.add('active');
    }
    
    // Save preference
    localStorage.setItem('cinemaMode', 'true');
    
    // Show notification
    showCinemaNotification('Modo Cinema ativado • Pressione C ou ESC para sair');
}

function disableCinemaMode() {
    cinemaMode = false;
    document.body.classList.remove('cinema-mode');
    
    const cinemaBtn = document.getElementById('cinemaBtn');
    if (cinemaBtn) {
        cinemaBtn.innerHTML = '<i class="fas fa-expand"></i><span>Modo Cinema</span>';
        cinemaBtn.classList.remove('active');
    }
    
    // Save preference
    localStorage.setItem('cinemaMode', 'false');
}

// ESC key to exit cinema mode
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cinemaMode) {
        disableCinemaMode();
    }
});

function showCinemaNotification(message) {
    // Remove existing notification
    const existing = document.querySelector('.cinema-notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = 'cinema-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Fade in
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialize cinema mode on page load
initCinemaMode();


// ==================== VIDEO HEATMAP TRACKING ====================
let lastSeekTime = 0;
let lastPlaybackTime = 0;

function initHeatmapTracking() {
    const videoPlayer = document.getElementById('videoPlayer');
    if (!videoPlayer || !videoId) return;
    
    // Track seeking events
    videoPlayer.addEventListener('seeking', () => {
        const seekFrom = lastPlaybackTime;
        const seekTo = videoPlayer.currentTime;
        
        // Determine event type
        let eventType = 'seek_to';
        const diff = seekTo - seekFrom;
        
        if (diff > 5) {
            eventType = 'skip_from'; // Skipped forward from seekFrom position
        } else if (diff < -5) {
            eventType = 'rewind_to'; // Rewound to seekTo position
        } else if (Math.abs(diff) < 2) {
            eventType = 'replay'; // Replaying same spot
        }
        
        // Log the event (both positions)
        if (eventType === 'skip_from') {
            logSeekEvent(Math.floor(seekFrom), 'skip_from');
        }
        logSeekEvent(Math.floor(seekTo), eventType === 'skip_from' ? 'seek_to' : eventType);
        
        lastSeekTime = Date.now();
    });
    
    // Track current playback position
    videoPlayer.addEventListener('timeupdate', () => {
        lastPlaybackTime = videoPlayer.currentTime;
    });
}

// Log seek event to server
async function logSeekEvent(timestamp, eventType) {
    // Throttle: Don't log if last seek was less than 2 seconds ago
    if (Date.now() - lastSeekTime < 2000 && eventType !== 'skip_from') {
        return;
    }
    
    try {
        await fetch('php/log-seek.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                video_id: videoId,
                timestamp: timestamp,
                event_type: eventType
            })
        });
    } catch (error) {
        console.error('Error logging seek event:', error);
    }
}

// Initialize heatmap tracking when video loads
if (videoId) {
    initHeatmapTracking();
}

