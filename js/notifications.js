// Notification System
let notificationInterval = null;

// Initialize notifications
function initNotifications() {
    loadNotifications();
    
    // Auto-refresh every 30 seconds
    if (notificationInterval) {
        clearInterval(notificationInterval);
    }
    notificationInterval = setInterval(loadNotifications, 30000);
    
    // Click bell to toggle dropdown
    const bellBtn = document.getElementById('notificationsBtn');
    if (bellBtn) {
        bellBtn.addEventListener('click', toggleNotificationDropdown);
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('notificationDropdown');
        const bellBtn = document.getElementById('notificationsBtn');
        if (dropdown && !bellBtn?.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
}

// Load notifications from API
async function loadNotifications() {
    try {
        const response = await fetch('php/get-notifications.php');
        const data = await response.json();
        
        if (data.success) {
            updateNotificationBadge(data.unread_count);
            updateNotificationDropdown(data.notifications);
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

// Update notification badge count
function updateNotificationBadge(count) {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Toggle notification dropdown
function toggleNotificationDropdown() {
    console.log('Toggling notification dropdown...');
    let dropdown = document.getElementById('notificationDropdown');
    
    // Create dropdown if doesn't exist
    if (!dropdown) {
        console.log('Creating notification dropdown...');
        dropdown = document.createElement('div');
        dropdown.id = 'notificationDropdown';
        dropdown.className = 'notification-dropdown';
        dropdown.innerHTML = `
            <div class="notification-header">
                <h3>Notificações</h3>
                <button class="mark-all-read" id="markAllReadBtn">
                    <i class="fas fa-check-double"></i> Marcar tudo como lido
                </button>
            </div>
            <div class="notification-list" id="notificationList">
                <div class="notification-loading">
                    <i class="fas fa-spinner fa-spin"></i> Carregando...
                </div>
            </div>
        `;
        document.body.appendChild(dropdown);
        console.log('Dropdown appended to body');
        
        // Position dropdown below bell button
        const bellBtn = document.getElementById('notificationsBtn');
        if (bellBtn) {
            const rect = bellBtn.getBoundingClientRect();
            dropdown.style.top = (rect.bottom + 8) + 'px';
            dropdown.style.right = (window.innerWidth - rect.right) + 'px';
            console.log('Dropdown positioned at:', dropdown.style.top, dropdown.style.right);
        }
        
        // Add mark all as read handler
        document.getElementById('markAllReadBtn')?.addEventListener('click', markAllAsRead);
    }
    
    dropdown.classList.toggle('show');
    console.log('Dropdown show class:', dropdown.classList.contains('show'));
    
    // Load notifications when opening
    if (dropdown.classList.contains('show')) {
        loadNotifications();
    }
}

// Update notification dropdown content
function updateNotificationDropdown(notifications) {
    const list = document.getElementById('notificationList');
    if (!list) return;
    
    if (notifications.length === 0) {
        list.innerHTML = `
            <div class="notification-empty">
                <i class="fas fa-bell-slash"></i>
                <p>Nenhuma notificação</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = notifications.map(notif => `
        <a href="${notif.link || '#'}" class="notification-item ${notif.is_read ? 'read' : 'unread'}" 
           data-id="${notif.id}" onclick="markNotificationRead(${notif.id}, event)">
            <div class="notification-icon">
                <i class="fas ${notif.icon || 'fa-info-circle'}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${notif.title}</div>
                <div class="notification-message">${notif.message}</div>
                <div class="notification-time">${formatTimeAgo(notif.created_at)}</div>
            </div>
            ${notif.is_read ? '' : '<div class="notification-dot"></div>'}
        </a>
    `).join('');
}

// Mark single notification as read
async function markNotificationRead(id, event) {
    try {
        await fetch('php/mark-notification-read.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notification_id: id })
        });
        
        // Update UI
        const item = document.querySelector(`[data-id="${id}"]`);
        if (item) {
            item.classList.remove('unread');
            item.classList.add('read');
            const dot = item.querySelector('.notification-dot');
            if (dot) dot.remove();
        }
        
        // Refresh badge count
        loadNotifications();
        
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

// Mark all notifications as read
async function markAllAsRead() {
    try {
        await fetch('php/mark-notification-read.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mark_all: true })
        });
        
        // Update UI
        document.querySelectorAll('.notification-item.unread').forEach(item => {
            item.classList.remove('unread');
            item.classList.add('read');
            const dot = item.querySelector('.notification-dot');
            if (dot) dot.remove();
        });
        
        // Hide badge
        updateNotificationBadge(0);
        
    } catch (error) {
        console.error('Error marking all as read:', error);
    }
}

// Format time ago
function formatTimeAgo(timestamp) {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now - then) / 1000);
    
    if (seconds < 60) return 'Agora';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' min atrás';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' h atrás';
    if (seconds < 604800) return Math.floor(seconds / 86400) + ' d atrás';
    if (seconds < 2592000) return Math.floor(seconds / 604800) + ' sem atrás';
    if (seconds < 31536000) return Math.floor(seconds / 2592000) + ' meses atrás';
    return Math.floor(seconds / 31536000) + ' anos atrás';
}

// Initialize on page load if logged in
if (document.getElementById('notificationsBtn')) {
    // Check if user is logged in (using localStorage.user)
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            if (user && user.id) {
                console.log('User logged in, initializing notifications for user:', user.id);
                initNotifications();
            } else {
                console.log('No valid user ID found');
            }
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    } else {
        console.log('No user in localStorage, notifications disabled');
        // If not logged in, show message when clicking
        const btn = document.getElementById('notificationsBtn');
        btn.addEventListener('click', () => {
            alert('Você precisa estar logado para ver notificações.');
        });
    }
}
