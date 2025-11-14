// ===== AUTOMATIC REVENUE SYSTEM - ParaTube =====

let currentUser = null;
let revenueData = null;
let revenueChart = null;
let sourceChart = null;

// Carregar dados ao iniciar
document.addEventListener('DOMContentLoaded', async () => {
    // Aguardar 300ms para main.js carregar sessão
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Verificar sessão
    try {
        const response = await fetch('php/check-session.php');
        const data = await response.json();
        
        console.log('Check session response:', data);
        
        if (!data.logged_in) {
            console.log('Usuário não logado');
            showLoginRequired();
            // Redirecionar após 3 segundos
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
            return;
        }
        
        currentUser = data.user;
        console.log('Usuário logado:', currentUser);
        await loadAutomaticRevenue();
    } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        showError('Erro ao carregar dados da sessão. Verifique se o servidor está rodando.');
    }
});

function showLoginRequired() {
    const container = document.getElementById('revenueTableContainer');
    if (container) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-sign-in-alt" style="font-size: 64px; color: #667eea;"></i>
                <h3>Login Necessário</h3>
                <p>Você precisa estar logado para acessar a página de receitas.</p>
                <p style="font-size: 12px; color: #999; margin-top: 10px;">Redirecionando para login em 3 segundos...</p>
                <a href="login.html" class="btn-submit" style="width: auto; margin-top: 20px; text-decoration: none;">
                    <i class="fas fa-sign-in-alt"></i> Ir para Login Agora
                </a>
            </div>
        `;
    }
    
    // Esconder stat cards
    document.querySelectorAll('.stat-card').forEach(card => {
        card.style.opacity = '0.3';
        card.style.pointerEvents = 'none';
    });
}

async function loadAutomaticRevenue() {
    try {
        showLoading();
        
        const response = await fetch('php/get-automatic-revenue.php');
        const data = await response.json();
        
        if (!data.success) {
            showError(data.error || 'Erro ao carregar receita');
            return;
        }
        
        revenueData = data;
        updateStats(data.stats);
        renderVideosTable(data.videos);
        updateCharts(data);
        
        hideLoading();
    } catch (error) {
        console.error('Erro ao carregar receita automática:', error);
        showError('Erro ao carregar dados de receita');
        hideLoading();
    }
}

function updateStats(stats) {
    // Total Revenue
    document.getElementById('totalRevenue').textContent = formatCurrency(stats.total_revenue);
    document.getElementById('daysWithRevenue').innerHTML = `
        <i class="fas fa-video"></i> ${stats.total_videos} vídeos • 
        <i class="fas fa-eye"></i> ${formatNumber(stats.total_views)} views
    `;
    
    // Estimated Monthly (Average Daily)
    document.getElementById('avgDailyRevenue').textContent = formatCurrency(stats.estimated_monthly / 30);
    document.querySelector('#avgDailyRevenue').parentElement.nextElementSibling.innerHTML = 
        `<i class="fas fa-calendar-alt"></i> Estimativa mensal: R$ ${formatCurrency(stats.estimated_monthly)}`;
    
    // Average RPM
    document.getElementById('avgRPM').textContent = formatCurrency(stats.avg_rpm);
    
    // Average Revenue per Video (using CPM slot)
    document.getElementById('avgCPM').textContent = formatCurrency(stats.avg_revenue_per_video);
    document.querySelector('#avgCPM').parentElement.nextElementSibling.textContent = 'Por vídeo';
    
    // Update card title for CPM
    const cpmCard = document.querySelector('#avgCPM').closest('.stat-card');
    cpmCard.querySelector('h3').textContent = 'Receita Média por Vídeo';
}

function renderVideosTable(videos) {
    const container = document.getElementById('revenueTableContainer');
    
    if (!videos || videos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-video-slash"></i>
                <h3>Nenhum vídeo publicado</h3>
                <p>Publique vídeos para começar a gerar receita automaticamente!</p>
            </div>
        `;
        return;
    }
    
    const table = `
        <table>
            <thead>
                <tr>
                    <th>Vídeo</th>
                    <th>Visualizações</th>
                    <th>RPM</th>
                    <th>Receita Gerada</th>
                    <th>Data de Publicação</th>
                </tr>
            </thead>
            <tbody>
                ${videos.map(video => `
                    <tr>
                        <td>
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <img src="${video.thumbnail || 'assets/default-thumbnail.jpg'}" 
                                     alt="${video.title}" 
                                     style="width: 80px; height: 45px; object-fit: cover; border-radius: 8px;">
                                <div style="max-width: 300px;">
                                    <div style="font-weight: 600; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                        ${video.title}
                                    </div>
                                    <div style="font-size: 12px; color: #666;">
                                        ${video.duration || '0:00'}
                                        ${video.views > 10000 ? '<span style="color: #ff6b35; margin-left: 8px;"><i class="fas fa-fire"></i> Viral</span>' : ''}
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td>
                            <strong>${formatNumber(video.views)}</strong>
                        </td>
                        <td>
                            <span class="currency-symbol">R$</span> ${formatCurrency(video.rpm)}
                        </td>
                        <td>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span class="currency-symbol" style="font-size: 18px;">R$</span>
                                <strong style="font-size: 18px; color: #4CAF50;">${formatCurrency(video.revenue)}</strong>
                            </div>
                        </td>
                        <td>${formatDate(video.created_at)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div style="margin-top: 20px; padding: 20px; background: linear-gradient(135deg, #f8f9ff, #faf5ff); border-radius: 12px; border-left: 4px solid #667eea;">
            <h4 style="margin: 0 0 10px 0; color: #667eea;">
                <i class="fas fa-info-circle"></i> Como funciona a receita automática?
            </h4>
            <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.6;">
                A receita é calculada automaticamente com base nas visualizações dos seus vídeos. 
                <strong>RPM (Revenue Per Mille)</strong> = Receita por 1.000 visualizações. 
                Vídeos com mais de 10.000 views ganham um <strong>bônus de 20%</strong>! 🎉
            </p>
        </div>
    `;
    
    container.innerHTML = table;
}

function updateCharts(data) {
    updateRevenueChart(data);
    updateSourceChart(data);
}

function updateRevenueChart(data) {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    
    // Agrupar vídeos por data
    const revenueByDate = {};
    data.videos.forEach(video => {
        const date = new Date(video.created_at).toLocaleDateString('pt-BR');
        if (!revenueByDate[date]) {
            revenueByDate[date] = 0;
        }
        revenueByDate[date] += video.revenue;
    });
    
    const dates = Object.keys(revenueByDate).sort();
    const revenues = dates.map(date => revenueByDate[date]);
    
    // Calcular receita acumulada
    const cumulativeRevenue = [];
    let sum = 0;
    revenues.forEach(rev => {
        sum += rev;
        cumulativeRevenue.push(sum);
    });
    
    if (revenueChart) {
        revenueChart.destroy();
    }
    
    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Receita Acumulada',
                data: cumulativeRevenue,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'R$ ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function updateSourceChart(data) {
    const ctx = document.getElementById('sourceChart').getContext('2d');
    
    // Categorizar vídeos por desempenho
    let viral = 0, alto = 0, medio = 0, baixo = 0;
    
    data.videos.forEach(video => {
        if (video.views > 10000) viral += video.revenue;
        else if (video.views > 5000) alto += video.revenue;
        else if (video.views > 1000) medio += video.revenue;
        else baixo += video.revenue;
    });
    
    if (sourceChart) {
        sourceChart.destroy();
    }
    
    sourceChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Viral (>10k)', 'Alto (>5k)', 'Médio (>1k)', 'Baixo'],
            datasets: [{
                data: [viral, alto, medio, baixo],
                backgroundColor: [
                    '#ff6b35',
                    '#4CAF50',
                    '#2196F3',
                    '#9E9E9E'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = 'R$ ' + formatCurrency(context.parsed);
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return label + ': ' + value + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

// ===== UTILITY FUNCTIONS =====

function formatCurrency(value) {
    return Number(value).toFixed(2).replace('.', ',');
}

function formatNumber(value) {
    return Number(value).toLocaleString('pt-BR');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
    });
}

function showLoading() {
    const container = document.getElementById('revenueTableContainer');
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-spinner fa-spin" style="font-size: 48px;"></i>
            <h3>Calculando receita...</h3>
            <p>Analisando visualizações dos seus vídeos</p>
        </div>
    `;
}

function hideLoading() {
    // Loading is hidden when table is rendered
}

function showError(message) {
    const container = document.getElementById('revenueTableContainer');
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-exclamation-circle" style="color: #f44336;"></i>
            <h3>Erro ao carregar dados</h3>
            <p>${message}</p>
            <button onclick="loadAutomaticRevenue()" class="btn-submit" style="width: auto; margin-top: 20px;">
                <i class="fas fa-redo"></i> Tentar Novamente
            </button>
        </div>
    `;
}
