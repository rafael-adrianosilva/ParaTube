// ===== CUSTOMIZE CHANNEL =====

let currentUser = null;
let channelLinks = [];
let bannerFile = null;
let profileFile = null;
let watermarkFile = null;

// Check authentication
function checkAuth() {
    const user = localStorage.getItem('user');
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    try {
        currentUser = JSON.parse(user);
        return currentUser;
    } catch (error) {
        console.error('Erro ao parsear usuário:', error);
        window.location.href = 'login.html';
        return null;
    }
}

// Load current channel data
async function loadChannelData() {
    if (!currentUser) return;
    
    try {
        const response = await fetch('php/get-profile.php', {
            headers: { 'X-User-Id': currentUser.id }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const profile = data.profile;
            
            // Set basic info
            document.getElementById('channelName').value = profile.username || '';
            document.getElementById('channelHandle').value = profile.username || '';
            document.getElementById('channelDescription').value = profile.bio || '';
            
            updateCharCount('channelName', 'nameCount', 50);
            updateCharCount('channelDescription', 'descCount', 1000);
            
            // Set profile image
            if (profile.profile_image) {
                const profilePreview = document.getElementById('profilePreview');
                profilePreview.innerHTML = `<img src="${profile.profile_image}" alt="Profile">`;
                document.getElementById('removeProfileBtn').style.display = 'block';
            }
            
            // Load banner and links if available (these would come from a channel_customization table)
            loadChannelCustomization();
        }
    } catch (error) {
        console.error('Erro ao carregar dados do canal:', error);
    }
}

async function loadChannelCustomization() {
    try {
        const response = await fetch('php/get-channel-customization.php', {
            headers: { 'X-User-Id': currentUser.id }
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Set banner
            if (data.banner) {
                const bannerPreview = document.getElementById('bannerPreview');
                const bannerUrl = data.banner.startsWith('http') ? data.banner : `${data.banner}`;
                
                // Substitui todo o conteúdo, incluindo overlay com botões
                bannerPreview.innerHTML = `
                    <img src="${bannerUrl}" alt="Banner" onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="banner-placeholder" style="display: none;">
                        <i class="fas fa-image"></i>
                        <p>Erro ao carregar banner</p>
                    </div>
                    <div class="banner-overlay">
                        <button class="btn-upload-banner" onclick="document.getElementById('bannerInput').click()">
                            <i class="fas fa-upload"></i> Alterar banner
                        </button>
                        <button class="btn-remove-banner" id="removeBannerBtn">
                            <i class="fas fa-trash"></i> Remover
                        </button>
                    </div>
                `;
                setupRemoveBanner();
            }
            // Se não tem banner, mantém o HTML padrão que já está na página
            
            // Set watermark
            if (data.watermark) {
                const watermarkPreview = document.getElementById('watermarkPreview');
                const watermarkUrl = data.watermark.startsWith('http') ? data.watermark : `${data.watermark}`;
                watermarkPreview.innerHTML = `<img src="${watermarkUrl}" alt="Watermark" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'watermark-placeholder\\'><i class=\\'fas fa-droplet\\'></i><p>Erro ao carregar marca d\\'água</p></div>';">`;
                document.getElementById('removeWatermarkBtn').style.display = 'block';
            }
            
            // Set links
            if (data.links) {
                channelLinks = JSON.parse(data.links);
                displayLinks();
            }
        }
    } catch (error) {
        console.log('Nenhuma personalização encontrada:', error);
    }
}

// Character counters
function updateCharCount(inputId, countId, maxChars) {
    const input = document.getElementById(inputId);
    const counter = document.getElementById(countId);
    if (input && counter) {
        counter.textContent = `${input.value.length} / ${maxChars}`;
    }
}

document.getElementById('channelName')?.addEventListener('input', () => {
    updateCharCount('channelName', 'nameCount', 50);
});

document.getElementById('channelDescription')?.addEventListener('input', () => {
    updateCharCount('channelDescription', 'descCount', 1000);
});

// Banner upload
document.getElementById('bannerInput')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione uma imagem válida');
        return;
    }
    
    bannerFile = file;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        const bannerPreview = document.getElementById('bannerPreview');
        bannerPreview.innerHTML = `<img src="${event.target.result}" alt="Banner">`;
        bannerPreview.innerHTML += `<div class="banner-overlay">
            <button class="btn-upload-banner" onclick="document.getElementById('bannerInput').click()">
                <i class="fas fa-upload"></i> Alterar banner
            </button>
            <button class="btn-remove-banner" id="removeBannerBtn">
                <i class="fas fa-trash"></i> Remover
            </button>
        </div>`;
        setupRemoveBanner();
    };
    reader.readAsDataURL(file);
});

function setupRemoveBanner() {
    document.getElementById('removeBannerBtn')?.addEventListener('click', function(e) {
        e.stopPropagation();
        bannerFile = null;
        const bannerPreview = document.getElementById('bannerPreview');
        bannerPreview.innerHTML = `
            <div class="banner-placeholder">
                <i class="fas fa-image"></i>
                <p>Nenhum banner definido</p>
            </div>
            <div class="banner-overlay">
                <button class="btn-upload-banner" onclick="document.getElementById('bannerInput').click()">
                    <i class="fas fa-upload"></i> Enviar banner
                </button>
            </div>
        `;
    });
}

// Profile image upload
document.getElementById('profileInput')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione uma imagem válida');
        return;
    }
    
    profileFile = file;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        document.getElementById('profilePreview').innerHTML = `<img src="${event.target.result}" alt="Profile">`;
        document.getElementById('removeProfileBtn').style.display = 'block';
    };
    reader.readAsDataURL(file);
});

document.getElementById('removeProfileBtn')?.addEventListener('click', function() {
    profileFile = null;
    document.getElementById('profilePreview').innerHTML = '<i class="fas fa-user-circle"></i>';
    this.style.display = 'none';
});

// Watermark upload
document.getElementById('watermarkInput')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione uma imagem válida');
        return;
    }
    
    if (file.size > 1024 * 1024) {
        alert('A imagem deve ter no máximo 1 MB');
        return;
    }
    
    watermarkFile = file;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        document.getElementById('watermarkPreview').innerHTML = `<img src="${event.target.result}" alt="Watermark">`;
        document.getElementById('removeWatermarkBtn').style.display = 'block';
    };
    reader.readAsDataURL(file);
});

document.getElementById('removeWatermarkBtn')?.addEventListener('click', function() {
    watermarkFile = null;
    document.getElementById('watermarkPreview').innerHTML = `
        <div class="watermark-placeholder">
            <i class="fas fa-droplet"></i>
            <p>Nenhuma marca d'água</p>
        </div>
    `;
    this.style.display = 'none';
});

// Links management
document.getElementById('addLinkBtn')?.addEventListener('click', function() {
    document.getElementById('linkTitle').value = '';
    document.getElementById('linkUrl').value = '';
    document.getElementById('linkModal').classList.add('active');
});

document.getElementById('saveLinkBtn')?.addEventListener('click', function() {
    const title = document.getElementById('linkTitle').value.trim();
    const url = document.getElementById('linkUrl').value.trim();
    
    if (!title || !url) {
        alert('Preencha todos os campos');
        return;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        alert('URL inválida. Deve começar com http:// ou https://');
        return;
    }
    
    channelLinks.push({ title, url });
    displayLinks();
    document.getElementById('linkModal').classList.remove('active');
});

function displayLinks() {
    const container = document.getElementById('linksContainer');
    
    if (channelLinks.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); font-size: 14px;">Nenhum link adicionado</p>';
        return;
    }
    
    container.innerHTML = channelLinks.map((link, index) => `
        <div class="link-item">
            <i class="fas fa-link"></i>
            <div class="link-info">
                <div class="link-title">${link.title}</div>
                <div class="link-url">${link.url}</div>
            </div>
            <div class="link-actions">
                <button onclick="removeLink(${index})" title="Remover">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function removeLink(index) {
    channelLinks.splice(index, 1);
    displayLinks();
}

// Save all changes
document.getElementById('saveChangesBtn')?.addEventListener('click', async function() {
    const channelName = document.getElementById('channelName').value.trim();
    const channelHandle = document.getElementById('channelHandle').value.trim();
    const channelDescription = document.getElementById('channelDescription').value.trim();
    
    if (!channelName) {
        alert('O nome do canal é obrigatório');
        return;
    }
    
    const formData = new FormData();
    formData.append('username', channelName);
    formData.append('bio', channelDescription);
    
    if (profileFile) {
        formData.append('profile_image', profileFile);
    }
    
    if (bannerFile) {
        formData.append('banner', bannerFile);
    }
    
    if (watermarkFile) {
        formData.append('watermark', watermarkFile);
    }
    
    formData.append('links', JSON.stringify(channelLinks));
    
    try {
        const response = await fetch('php/update-channel-customization.php', {
            method: 'POST',
            headers: { 'X-User-Id': currentUser.id },
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Canal atualizado com sucesso!');
            
            // Update localStorage user data
            currentUser.username = channelName;
            localStorage.setItem('user', JSON.stringify(currentUser));
            
            window.location.href = 'my-channel.html';
        } else {
            alert('Erro ao atualizar canal: ' + result.message);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao atualizar canal');
    }
});

// Theme toggle
const themeToggle = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

themeToggle?.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggle.querySelector('i').className = newTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
});

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    currentUser = checkAuth();
    if (currentUser) {
        loadChannelData();
    }
});
