/**
 * ========================================
 * ACHIEVEMENTS SYSTEM
 * ParaTube Gamification
 * ========================================
 */

class AchievementsSystem {
    constructor() {
        this.achievements = [];
        this.userAchievements = [];
        this.unlockedCount = 0;
        this.newUnlockedCount = 0;
        this.init();
    }

    async init() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.id) return;

        await this.loadAchievements();
        await this.checkForNewAchievements();
        this.setupAchievementsButton();
    }

    async loadAchievements() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.id) return;

        try {
            const response = await fetch('php/get-achievements.php', {
                headers: { 'X-User-Id': user.id.toString() }
            });
            const data = await response.json();
            
            if (data.success) {
                this.achievements = data.achievements;
                this.userAchievements = data.user_achievements;
                this.calculateUnlocked();
            }
        } catch (error) {
            console.error('Failed to load achievements:', error);
        }
    }

    calculateUnlocked() {
        this.unlockedCount = this.userAchievements.filter(a => !a.notified).length;
        this.newUnlockedCount = this.userAchievements.filter(a => {
            const unlockDate = new Date(a.unlocked_at);
            const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            return unlockDate > dayAgo && !a.notified;
        }).length;
    }

    setupAchievementsButton() {
        const badge = document.getElementById('achievementMenuBadge');
        
        // Show badge if there are new achievements
        if (badge && this.newUnlockedCount > 0) {
            badge.textContent = this.newUnlockedCount;
            badge.style.display = 'inline-block';
        }
    }

    showAchievementsModal() {
        const modal = document.createElement('div');
        modal.className = 'achievements-modal';
        modal.innerHTML = `
            <div class="achievements-modal-content">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2>
                        <i class="fas fa-trophy" style="color: #FFD700;"></i>
                        Conquistas
                    </h2>
                    <button class="close-modal-btn" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #aaa;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div style="margin-bottom: 20px; padding: 15px; background: rgba(255, 215, 0, 0.1); border-radius: 8px; border-left: 4px solid #FFD700;">
                    <strong>${this.userAchievements.length}/${this.achievements.length}</strong> conquistas desbloqueadas
                    <div style="width: 100%; height: 6px; background: rgba(255, 255, 255, 0.1); border-radius: 3px; margin-top: 8px;">
                        <div style="width: ${(this.userAchievements.length / this.achievements.length) * 100}%; height: 100%; background: linear-gradient(90deg, #FFD700, #FFA500); border-radius: 3px;"></div>
                    </div>
                </div>
                
                <div class="achievements-grid" id="achievementsGrid">
                    ${this.renderAchievements()}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close button
        modal.querySelector('.close-modal-btn').onclick = () => modal.remove();
        
        // Click outside to close
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };

        // Mark new achievements as notified
        this.markAsNotified();
    }

    renderAchievements() {
        return this.achievements.map(achievement => {
            const unlocked = this.userAchievements.find(ua => ua.achievement_id === achievement.id);
            const isNew = unlocked && !unlocked.notified;
            
            return `
                <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
                    <div class="achievement-icon" style="color: ${unlocked ? achievement.badge_color : '#666'};">
                        <i class="fas ${achievement.icon}"></i>
                    </div>
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-description">${achievement.description}</div>
                    ${unlocked ? `
                        <div class="achievement-progress" style="color: ${achievement.badge_color};">
                            ✓ Desbloqueado
                            ${isNew ? ' <span style="color: #ff0000;">● NOVO!</span>' : ''}
                        </div>
                        <div style="font-size: 10px; color: #888; margin-top: 5px;">
                            ${this.formatDate(unlocked.unlocked_at)}
                        </div>
                    ` : `
                        <div class="achievement-progress">
                            ${this.getProgressText(achievement)}
                        </div>
                    `}
                </div>
            `;
        }).join('');
    }

    getProgressText(achievement) {
        // This would require fetching user stats
        // For now, just show requirement
        return `${achievement.requirement_value} ${this.getRequirementLabel(achievement.requirement_type)}`;
    }

    getRequirementLabel(type) {
        const labels = {
            'views': 'visualizações',
            'uploads': 'vídeos',
            'subscribers': 'inscritos',
            'comments': 'comentários',
            'likes': 'curtidas',
            'watch_history': 'vídeos assistidos',
            'membership_days': 'dias'
        };
        return labels[type] || type;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Hoje';
        if (diffDays === 1) return 'Ontem';
        if (diffDays < 7) return `Há ${diffDays} dias`;
        if (diffDays < 30) return `Há ${Math.floor(diffDays / 7)} semanas`;
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    async markAsNotified() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.id) return;

        try {
            await fetch('php/mark-achievements-notified.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': user.id.toString()
                }
            });
            
            // Update local state
            this.newUnlockedCount = 0;
            const badge = document.getElementById('achievementMenuBadge');
            if (badge) badge.style.display = 'none';
        } catch (error) {
            console.error('Failed to mark achievements as notified:', error);
        }
    }

    async checkForNewAchievements() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.id) return;

        try {
            const response = await fetch('php/check-achievements.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': user.id.toString()
                }
            });
            
            const data = await response.json();
            console.log('🏆 Check achievements response:', data);
            
            if (data.success && data.new_achievements && data.new_achievements.length > 0) {
                console.log(`🎉 ${data.new_achievements.length} nova(s) conquista(s) desbloqueada(s)!`);
                
                // Show notification for new achievements
                data.new_achievements.forEach(achievement => {
                    this.showAchievementUnlockNotification(achievement);
                });
                
                // Reload achievements
                await this.loadAchievements();
                this.setupAchievementsButton();
            }
        } catch (error) {
            console.error('Failed to check achievements:', error);
        }
    }

    showAchievementUnlockNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-unlock-notification';
        notification.innerHTML = `
            <div class="achievement-unlock-content">
                <div class="achievement-unlock-icon">
                    <i class="fas ${achievement.icon}" style="color: ${achievement.badge_color};"></i>
                </div>
                <div class="achievement-unlock-text">
                    <div style="font-weight: bold; margin-bottom: 5px;">🏆 Conquista Desbloqueada!</div>
                    <div style="font-size: 14px;">${achievement.name}</div>
                    <div style="font-size: 12px; color: #aaa; margin-top: 3px;">${achievement.description}</div>
                </div>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, rgba(255, 215, 0, 0.95), rgba(255, 165, 0, 0.95));
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 8px 30px rgba(255, 215, 0, 0.5);
            z-index: 10000;
            animation: slideInRight 0.5s, pulse 2s infinite;
            min-width: 300px;
            color: #000;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.5s';
            setTimeout(() => notification.remove(), 500);
        }, 5000);
    }
}

// Initialize achievements system
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.achievementsSystem = new AchievementsSystem();
    });
} else {
    window.achievementsSystem = new AchievementsSystem();
}

window.AchievementsSystem = AchievementsSystem;

// Global function to check achievements (can be called from anywhere)
window.checkAchievements = function() {
    console.log('🔍 Checking for new achievements...');
    if (window.achievementsSystem) {
        window.achievementsSystem.checkForNewAchievements();
    } else {
        console.warn('⚠️ Achievements system not initialized yet');
    }
};
