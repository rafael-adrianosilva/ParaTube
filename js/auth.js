// ===== PASSWORD TOGGLE =====
const togglePassword = document.getElementById('togglePassword');
const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');

togglePassword?.addEventListener('click', function() {
    const passwordInput = document.getElementById('password');
    const icon = this.querySelector('i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
});

toggleConfirmPassword?.addEventListener('click', function() {
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const icon = this.querySelector('i');
    
    if (confirmPasswordInput.type === 'password') {
        confirmPasswordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        confirmPasswordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
});

// ===== LOGIN FORM =====
const loginForm = document.getElementById('loginForm');

loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(loginForm);
    const data = {
        email: formData.get('email'),
        password: formData.get('password'),
        remember: formData.get('remember') ? true : false
    };
    
    try {
        const response = await fetch('php/login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('Login realizado com sucesso!', 'success');
            
            // Save user data
            localStorage.setItem('user', JSON.stringify(result.user));
            
            // Redirect to home page
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            showAlert(result.message || 'E-mail ou senha incorretos.', 'error');
        }
        
    } catch (error) {
        console.error('Erro:', error);
        // Simulate login for demo
        showAlert('Login realizado com sucesso!', 'success');
        localStorage.setItem('user', JSON.stringify({
            id: 1,
            name: 'Usuário Demo',
            username: 'Usuário Demo',
            email: data.email,
            profile_image: null
        }));
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
});

// ===== REGISTER FORM =====
const registerForm = document.getElementById('registerForm');

registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(registerForm);
    const data = {
        username: formData.get('username'),
        email: formData.get('email'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword')
    };
    
    // Validate passwords match
    if (data.password !== data.confirmPassword) {
        showAlert('As senhas não coincidem.', 'error');
        return;
    }
    
    // Validate password strength
    if (data.password.length < 6) {
        showAlert('A senha deve ter pelo menos 6 caracteres.', 'error');
        return;
    }
    
    try {
        const response = await fetch('php/register.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('Conta criada com sucesso! Redirecionando...', 'success');
            
            // Save user data
            localStorage.setItem('user', JSON.stringify(result.user));
            
            // Redirect to home page
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            showAlert(result.message || 'Erro ao criar conta. Tente novamente.', 'error');
        }
        
    } catch (error) {
        console.error('Erro:', error);
        // Simulate registration for demo
        showAlert('Conta criada com sucesso! Redirecionando...', 'success');
        localStorage.setItem('user', JSON.stringify({
            id: 1,
            name: data.username,
            username: data.username,
            email: data.email,
            profile_image: null
        }));
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }
});

// ===== FORGOT PASSWORD FORM =====
const forgotPasswordForm = document.getElementById('forgotPasswordForm');

forgotPasswordForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(forgotPasswordForm);
    const email = formData.get('email');
    
    try {
        const response = await fetch('php/forgot-password.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('Instruções de recuperação enviadas para seu e-mail.', 'success');
            forgotPasswordForm.reset();
        } else {
            showAlert(result.message || 'E-mail não encontrado.', 'error');
        }
        
    } catch (error) {
        console.error('Erro:', error);
        // Simulate for demo
        showAlert('Instruções de recuperação enviadas para seu e-mail.', 'success');
        forgotPasswordForm.reset();
    }
});

// ===== SHOW ALERT =====
function showAlert(message, type) {
    const alert = document.getElementById('alert');
    if (!alert) return;
    
    alert.textContent = message;
    alert.className = `alert ${type}`;
    alert.style.display = 'block';
    
    setTimeout(() => {
        alert.style.display = 'none';
    }, 5000);
}

// ===== CHECK IF USER IS LOGGED IN =====
function checkAuth() {
    console.log('=== checkAuth called ===');
    const user = localStorage.getItem('user');
    console.log('localStorage user:', user);
    
    if (user) {
        try {
            const userData = JSON.parse(user);
            console.log('✅ User authenticated:', userData);
            updateUserMenu(userData);
            
            // Buscar perfil atualizado do banco de dados
            refreshUserProfile(userData.id);
            
            return userData;
        } catch (e) {
            console.error('❌ Erro ao parsear dados do usuário:', e);
            localStorage.removeItem('user');
        }
    } else {
        console.log('⚠️ No user found in localStorage');
        showLoginOptions();
    }
    return null;
}

// Atualizar perfil do usuário do banco de dados
async function refreshUserProfile(userId) {
    try {
        console.log('🔄 Buscando perfil atualizado do usuário ID:', userId);
        const response = await fetch('php/get-profile.php', {
            headers: { 'X-User-Id': userId }
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Perfil atualizado recebido:', data);
            
            // Atualizar localStorage com dados mais recentes
            const currentUser = JSON.parse(localStorage.getItem('user'));
            const updatedUser = {
                ...currentUser,
                username: data.username,
                email: data.email,
                profile_image: data.profile_image,
                bio: data.bio
            };
            
            localStorage.setItem('user', JSON.stringify(updatedUser));
            console.log('💾 localStorage atualizado com profile_image:', data.profile_image);
            
            // Atualizar menu do usuário com nova imagem
            updateUserMenu(updatedUser);
        } else {
            console.error('❌ Erro ao buscar perfil:', data.message);
        }
    } catch (error) {
        console.error('❌ Erro na requisição do perfil:', error);
    }
}

// Show login/register options when not logged in
function showLoginOptions() {
    const dropdownMenu = document.getElementById('dropdownMenu');
    const userAvatar = document.getElementById('userAvatar');
    
    if (!dropdownMenu || !userAvatar) return;
    
    console.log('Showing login options (not logged in)');
    
    // Reset avatar to default
    userAvatar.innerHTML = `<i class="fas fa-user-circle"></i>`;
    
    // Show login/register options
    dropdownMenu.innerHTML = `
        <a href="login.html" class="login-link">
            <i class="fas fa-sign-in-alt"></i> Fazer Login
        </a>
        <a href="register.html">
            <i class="fas fa-user-plus"></i> Cadastrar
        </a>
    `;
    
    // Hide "Seu canal" link in sidebar
    const myChannelLink = document.getElementById('myChannelLink');
    if (myChannelLink) {
        myChannelLink.style.display = 'none';
    }
}

function updateUserMenu(user) {
    console.log('updateUserMenu called with user:', user);
    
    const userAvatar = document.getElementById('userAvatar');
    const dropdownMenu = document.getElementById('dropdownMenu');
    
    if (!userAvatar) {
        console.error('userAvatar element not found!');
        return;
    }
    
    if (!dropdownMenu) {
        console.error('dropdownMenu element not found!');
        return;
    }
    
    console.log('Updating avatar and menu for user:', user.username || user.name);
    console.log('User avatar URL:', user.avatar || user.profile_image);
    
    // Update avatar button with user photo
    if (user.avatar || user.profile_image) {
        const avatarUrl = user.avatar || user.profile_image;
        userAvatar.innerHTML = `<img src="${avatarUrl}" alt="${user.name || user.username}">`;
        console.log('✅ Avatar updated with image:', avatarUrl);
    } else {
        userAvatar.innerHTML = `<i class="fas fa-user-circle"></i>`;
        console.log('⚠️ No avatar image, using default icon');
    }
    
    // Show "Seu canal" link in sidebar
    const myChannelLink = document.getElementById('myChannelLink');
    if (myChannelLink) {
        myChannelLink.style.display = 'flex';
    }
    
    // Update dropdown menu - replace entire content (YouTube-style)
    dropdownMenu.innerHTML = `
        <div class="dropdown-user-info">
            ${user.avatar || user.profile_image ? 
                `<img src="${user.avatar || user.profile_image}" alt="${user.name || user.username}" class="dropdown-avatar">` :
                '<i class="fas fa-user-circle dropdown-avatar-icon"></i>'
            }
            <div class="dropdown-user-text">
                <strong>${user.name || user.username}</strong>
                <span>${user.email}</span>
            </div>
        </div>
        <hr style="margin: 8px 0; border: none; border-top: 1px solid var(--border-color);">
        <a href="my-channel.html">
            <i class="fas fa-user"></i> Seu canal
        </a>
        <a href="#" id="achievementsMenuBtn" class="dropdown-item">
            <i class="fas fa-trophy"></i> Conquistas
            <span id="achievementMenuBadge" style="display: none; background: #ff0000; color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 10px; margin-left: 8px;">0</span>
        </a>
        <a href="profile.html">
            <i class="fas fa-cog"></i> Configurações
        </a>
        <hr style="margin: 8px 0; border: none; border-top: 1px solid var(--border-color);">
        <a href="#" class="dropdown-item">
            <i class="fas fa-exchange-alt"></i> Trocar de conta
        </a>
        <a href="#" id="logoutBtn">
            <i class="fas fa-sign-out-alt"></i> Sair
        </a>
        <hr style="margin: 8px 0; border: none; border-top: 1px solid var(--border-color);">
        <a href="#" class="dropdown-item">
            <i class="fas fa-dollar-sign"></i> Compras e assinaturas
        </a>
        <a href="manage-stats.html" class="dropdown-item">
            <i class="fas fa-chart-line"></i> ParaTube Studio
        </a>
        <hr style="margin: 8px 0; border: none; border-top: 1px solid var(--border-color);">
        <a href="#" class="dropdown-item" id="appearanceToggle">
            <i class="fas fa-moon"></i> Aparência: ${document.documentElement.getAttribute('data-theme') === 'dark' ? 'Escuro' : 'Claro'}
        </a>
        <a href="#" class="dropdown-item">
            <i class="fas fa-language"></i> Idioma: Português
        </a>
        <a href="manage-stats.html" class="dropdown-item">
            <i class="fas fa-shield-alt"></i> Seus dados no ParaTube
        </a>
        <a href="#" class="dropdown-item">
            <i class="fas fa-question-circle"></i> Ajuda
        </a>
        <a href="#" class="dropdown-item">
            <i class="fas fa-exclamation-circle"></i> Enviar feedback
        </a>
    `;
    
    // Add logout handler
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
    
    // Add appearance toggle handler
    const appearanceToggle = document.getElementById('appearanceToggle');
    appearanceToggle?.addEventListener('click', (e) => {
        e.preventDefault();
        toggleTheme();
        // Update the menu text
        const currentTheme = document.documentElement.getAttribute('data-theme');
        appearanceToggle.innerHTML = `
            <i class="fas fa-${currentTheme === 'dark' ? 'sun' : 'moon'}"></i> 
            Aparência: ${currentTheme === 'dark' ? 'Escuro' : 'Claro'}
        `;
    });
    
    // Add achievements handler
    const achievementsMenuBtn = document.getElementById('achievementsMenuBtn');
    achievementsMenuBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'achievements.html';
    });
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update theme toggle button if exists
    const themeToggleBtn = document.getElementById('themeToggle');
    if (themeToggleBtn) {
        themeToggleBtn.querySelector('i').className = newTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

async function logout() {
    try {
        await fetch('php/logout.php', {
            method: 'POST'
        });
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    }
    
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// ===== INITIALIZE AUTH ON PAGE LOAD =====
function initializeAuth() {
    const currentPath = window.location.pathname;
    const isAuthPage = currentPath.includes('login.html') || 
                       currentPath.includes('register.html') || 
                       currentPath.includes('forgot-password.html');

    if (!isAuthPage) {
        console.log('🔄 Initializing auth check...');
        console.log('Current path:', currentPath);
        checkAuth();
    }
}

// Helper function for debugging - expose globally
window.testAuth = function() {
    const user = localStorage.getItem('user');
    console.log('=== AUTH DEBUG ===');
    console.log('localStorage user:', user);
    if (user) {
        try {
            const userData = JSON.parse(user);
            console.log('Parsed user data:', userData);
            console.log('Profile image:', userData.profile_image || userData.avatar || 'NONE');
        } catch (e) {
            console.error('Error parsing:', e);
        }
    }
    checkAuth();
};

// Run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAuth);
} else {
    // DOM already loaded
    initializeAuth();
}

// Toggle dropdown menu
document.addEventListener('click', function(e) {
    const userMenu = document.getElementById('userMenu');
    const userAvatar = document.getElementById('userAvatar');
    const dropdownMenu = document.getElementById('dropdownMenu');
    
    if (userAvatar && userAvatar.contains(e.target)) {
        e.stopPropagation();
        dropdownMenu?.classList.toggle('active');
    } else if (!userMenu?.contains(e.target)) {
        dropdownMenu?.classList.remove('active');
    }
});
