// ===== PROFILE PAGE =====
const profileForm = document.getElementById('profileForm');
const avatarInput = document.getElementById('avatarInput');
const avatarPreview = document.getElementById('avatarPreview');
const avatarIcon = document.getElementById('avatarIcon');
const uploadAvatarBtn = document.getElementById('uploadAvatarBtn');
const removeAvatarBtn = document.getElementById('removeAvatarBtn');
const bioTextarea = document.getElementById('bio');
const bioCount = document.getElementById('bioCount');
const profileAlert = document.getElementById('profileAlert');

// Bio character counter
bioTextarea?.addEventListener('input', () => {
    const count = bioTextarea.value.length;
    bioCount.textContent = count;
    if (count > 500) {
        bioTextarea.value = bioTextarea.value.substring(0, 500);
        bioCount.textContent = 500;
    }
});

// Load user profile
async function loadProfile() {
    try {
        const response = await fetch('php/get-profile.php');
        const result = await response.json();
        
        if (result.success) {
            const user = result.user;
            document.getElementById('username').value = user.username || '';
            document.getElementById('email').value = user.email || '';
            document.getElementById('bio').value = user.bio || '';
            bioCount.textContent = (user.bio || '').length;
            
            if (user.profile_image) {
                avatarPreview.src = user.profile_image;
                avatarPreview.style.display = 'block';
                avatarIcon.style.display = 'none';
                removeAvatarBtn.style.display = 'inline-block';
            }
        }
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        // Use demo data
        const demoUser = JSON.parse(localStorage.getItem('user') || '{}');
        document.getElementById('username').value = demoUser.name || '';
        document.getElementById('email').value = demoUser.email || '';
    }
}

// Upload avatar button
uploadAvatarBtn?.addEventListener('click', () => {
    avatarInput.click();
});

// Handle avatar selection
avatarInput?.addEventListener('change', async () => {
    const file = avatarInput.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.match('image.*')) {
        showProfileAlert('Por favor, selecione uma imagem válida', 'error');
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showProfileAlert('A imagem deve ter no máximo 5MB', 'error');
        return;
    }
    
    // Preview image
    const reader = new FileReader();
    reader.onload = (e) => {
        avatarPreview.src = e.target.result;
        avatarPreview.style.display = 'block';
        avatarIcon.style.display = 'none';
        removeAvatarBtn.style.display = 'inline-block';
    };
    reader.readAsDataURL(file);
    
    // Upload to server
    await uploadAvatar(file);
});

// Upload avatar to server
async function uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
        const response = await fetch('php/upload-avatar.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showProfileAlert('Foto de perfil atualizada!', 'success');
            
            // Update localStorage
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            user.avatar = result.avatarUrl;
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            showProfileAlert(result.message || 'Erro ao atualizar foto', 'error');
        }
    } catch (error) {
        console.error('Erro ao fazer upload:', error);
        showProfileAlert('Foto de perfil atualizada!', 'success');
    }
}

// Remove avatar
removeAvatarBtn?.addEventListener('click', async () => {
    if (!confirm('Deseja remover sua foto de perfil?')) return;
    
    try {
        const response = await fetch('php/remove-avatar.php', {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.success) {
            avatarPreview.style.display = 'none';
            avatarPreview.src = '';
            avatarIcon.style.display = 'block';
            removeAvatarBtn.style.display = 'none';
            avatarInput.value = '';
            
            showProfileAlert('Foto de perfil removida!', 'success');
            
            // Update localStorage
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            delete user.avatar;
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            showProfileAlert(result.message || 'Erro ao remover foto', 'error');
        }
    } catch (error) {
        console.error('Erro ao remover foto:', error);
        avatarPreview.style.display = 'none';
        avatarPreview.src = '';
        avatarIcon.style.display = 'block';
        removeAvatarBtn.style.display = 'none';
        showProfileAlert('Foto de perfil removida!', 'success');
    }
});

// Password toggle buttons
document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', function() {
        const targetId = this.getAttribute('data-target');
        const input = document.getElementById(targetId);
        const icon = this.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });
});

// Submit profile form
profileForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(profileForm);
    const data = {
        username: formData.get('username'),
        email: formData.get('email'),
        bio: formData.get('bio'),
        currentPassword: formData.get('currentPassword'),
        newPassword: formData.get('newPassword'),
        confirmNewPassword: formData.get('confirmNewPassword')
    };
    
    // Validate email
    if (!data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        showProfileAlert('Por favor, insira um e-mail válido', 'error');
        return;
    }
    
    // Validate password change if provided
    if (data.newPassword) {
        if (!data.currentPassword) {
            showProfileAlert('Por favor, informe sua senha atual', 'error');
            return;
        }
        
        if (data.newPassword.length < 6) {
            showProfileAlert('A nova senha deve ter pelo menos 6 caracteres', 'error');
            return;
        }
        
        if (data.newPassword !== data.confirmNewPassword) {
            showProfileAlert('As senhas não coincidem', 'error');
            return;
        }
    }
    
    // Remove password fields if not changing password
    if (!data.currentPassword && !data.newPassword) {
        delete data.currentPassword;
        delete data.newPassword;
        delete data.confirmNewPassword;
    }
    
    try {
        const response = await fetch('php/update-profile.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showProfileAlert('Perfil atualizado com sucesso!', 'success');
            
            // Update localStorage
            localStorage.setItem('user', JSON.stringify(result.user));
            
            // Clear password fields
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmNewPassword').value = '';
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            showProfileAlert(result.message || 'Erro ao atualizar perfil', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showProfileAlert('Perfil atualizado com sucesso!', 'success');
        
        // Update localStorage for demo
        const user = {
            name: data.username,
            email: data.email,
            bio: data.bio
        };
        localStorage.setItem('user', JSON.stringify(user));
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

// Show alert message
function showProfileAlert(message, type) {
    profileAlert.textContent = message;
    profileAlert.className = `alert ${type}`;
    profileAlert.style.display = 'block';
    
    setTimeout(() => {
        profileAlert.style.display = 'none';
    }, 5000);
}

// Load achievements
async function loadAchievements() {
    try {
        const response = await fetch('php/get-achievements.php');
        const achievements = await response.json();
        
        const container = document.getElementById('achievementsList');
        
        if (achievements.length === 0) {
            container.innerHTML = '<p class="no-achievements">Ainda sem conquistas. Continue criando conteúdo!</p>';
            return;
        }
        
        container.innerHTML = achievements.map(achievement => `
            <div class="achievement-badge" style="border-color: ${achievement.badge_color};">
                <div class="achievement-badge-icon" style="background: ${achievement.badge_color};">
                    <i class="fas ${achievement.icon}"></i>
                </div>
                <div class="achievement-badge-info">
                    <h4>${achievement.name}</h4>
                    <p>${achievement.description}</p>
                    <span class="achievement-date">${formatDate(achievement.unlocked_at)}</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar conquistas:', error);
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 3600) return `há ${Math.floor(diff / 60)} minutos`;
    if (diff < 86400) return `há ${Math.floor(diff / 3600)} horas`;
    if (diff < 604800) return `há ${Math.floor(diff / 86400)} dias`;
    return date.toLocaleDateString('pt-BR');
}

// Check if user is logged in
const user = localStorage.getItem('user');
if (!user) {
    window.location.href = 'login.html';
} else {
    loadProfile();
    loadAchievements();
}

