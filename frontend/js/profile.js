// frontend/js/profile.js

// Переменная для хранения экземпляра графика
let activityChart = null;

// Текущий выбранный аватар
let selectedAvatar = '😊';

// Загрузка страницы
document.addEventListener('DOMContentLoaded', async function() {
    if (!checkAuth()) return;
    
    const user = getUserData();
    selectedAvatar = user.avatar || '😊';
    
    updateProfile(user);
    highlightSelectedAvatar(selectedAvatar);
    await loadProfileStats();
    await loadChartData();
});

// =============================================
// 📊 ПРОФИЛЬ
// =============================================

function updateProfile(user) {
    document.getElementById('profileUsername').textContent = user.username;
    document.getElementById('profileLevel').textContent = user.level;
    document.getElementById('profileXP').textContent = user.experience;
    document.getElementById('profileGold').textContent = user.gold;
    document.getElementById('profileAvatar').textContent = user.avatar || '😊';
    
    // 🔥 ОБНОВЛЯЕМ АВАТАР НА ДАШБОРДЕ
    updateAvatarOnDashboard(user.avatar || '😊');
    
    // Прогресс-бар
    const xpPerLevel = 100;
    const currentLevelXP = user.experience % xpPerLevel;
    const progressPercent = (currentLevelXP / xpPerLevel) * 100;
    
    const progressFill = document.getElementById('profileProgress');
    const progressText = document.getElementById('profileProgressText');
    
    if (progressFill) {
        progressFill.style.width = Math.min(progressPercent, 100) + '%';
    }
    if (progressText) {
        const xpNeeded = xpPerLevel - currentLevelXP;
        progressText.textContent = `${Math.round(progressPercent)}% до следующего уровня (осталось ${xpNeeded} XP)`;
    }
}

// 🔥 ОБНОВЛЕНИЕ АВАТАРА НА ДАШБОРДЕ
function updateAvatarOnDashboard(emoji) {
    const avatarElement = document.getElementById('characterAvatar');
    if (avatarElement) {
        avatarElement.textContent = emoji;
    }
}

// =============================================
// 📊 СТАТИСТИКА
// =============================================

async function loadProfileStats() {
    try {
        const habits = await getHabits();
        const totalCompleted = habits.reduce((sum, habit) => {
            return sum + (habit.completed_dates || []).length;
        }, 0);
        document.getElementById('profileCompleted').textContent = totalCompleted;
        return habits;
    } catch (error) {
        console.warn('Не удалось загрузить статистику с сервера:', error.message);
        document.getElementById('profileCompleted').textContent = '0';
        document.getElementById('profileCompleted').style.color = '#999';
        return [];
    }
}

// =============================================
// 📈 ГРАФИК
// =============================================

async function loadChartData() {
    try {
        const habits = await getHabits();
        const today = new Date();
        const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        const weekData = new Array(7).fill(0);
        
        habits.forEach(habit => {
            const completedDates = habit.completed_dates || [];
            completedDates.forEach(dateStr => {
                const date = new Date(dateStr);
                const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24));
                if (diffDays >= 0 && diffDays < 7) {
                    const dayIndex = (date.getDay() + 6) % 7;
                    weekData[dayIndex]++;
                }
            });
        });
        
        createChart(dayNames, weekData);
    } catch (error) {
        console.error('Ошибка загрузки данных для графика:', error);
        const canvas = document.getElementById('activityChart');
        if (canvas) {
            canvas.parentElement.innerHTML = `
                <div style="text-align:center;color:#999;padding:20px;">
                    <p>📊 Не удалось загрузить данные для графика</p>
                    <p style="font-size:12px;">${error.message}</p>
                </div>
            `;
        }
    }
}

function createChart(labels, data) {
    const ctx = document.getElementById('activityChart');
    if (!ctx) return;
    
    if (activityChart) {
        activityChart.destroy();
        activityChart = null;
    }

    const hasData = data.some(value => value > 0);
    
    if (!hasData) {
        const parent = ctx.parentElement;
        if (parent) {
            parent.innerHTML = `
                <div style="text-align:center;color:#999;padding:30px 20px;">
                    <p style="font-size:24px;">📊</p>
                    <p>Нет выполненных привычек за последнюю неделю</p>
                    <p style="font-size:12px;">Начните выполнять привычки, чтобы увидеть график!</p>
                </div>
            `;
        }
        return;
    }

    try {
        const maxValue = Math.max(...data);

        activityChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Выполнено привычек',
                    data: data,
                    backgroundColor: data.map(value => 
                        value === maxValue && maxValue > 0 ? '#764ba2' : '#667eea'
                    ),
                    borderColor: data.map(value => 
                        value === maxValue && maxValue > 0 ? '#764ba2' : '#667eea'
                    ),
                    borderWidth: 2,
                    borderRadius: {
                        topLeft: 8,
                        topRight: 8,
                        bottomLeft: 0,
                        bottomRight: 0
                    },
                    barPercentage: 0.7,
                    categoryPercentage: 0.8,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        titleColor: '#333',
                        bodyColor: '#667eea',
                        borderColor: '#667eea',
                        borderWidth: 2,
                        cornerRadius: 8,
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.y} привычек`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { 
                            stepSize: 1,
                            color: '#888',
                            font: { size: 12 }
                        },
                        grid: { 
                            color: 'rgba(102, 126, 234, 0.1)',
                            drawBorder: false
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: '#555',
                            font: { size: 13, weight: '600' }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Ошибка создания графика:', error);
    }
}

// =============================================
// 🎨 АВАТАР В ПРОФИЛЕ
// =============================================

function highlightSelectedAvatar(avatar) {
    const options = document.querySelectorAll('.avatar-option');
    options.forEach(option => {
        option.classList.toggle('selected', option.dataset.avatar === avatar);
    });
}

document.querySelectorAll('.avatar-option').forEach(option => {
    option.addEventListener('click', function() {
        selectedAvatar = this.dataset.avatar;
        highlightSelectedAvatar(selectedAvatar);
        document.getElementById('profileAvatar').textContent = selectedAvatar;
    });
});

// Сохранение аватара
document.getElementById('saveAvatarBtn')?.addEventListener('click', async function() {
    try {
        await apiRequest('/user/update_avatar/', 'PATCH', {
            avatar_skin: selectedAvatar
        });
        
        localStorage.setItem('avatar', selectedAvatar);
        const user = getUserData();
        user.avatar = selectedAvatar;
        updateProfile(user);
        
        showNotification('✅ Аватар сохранён на сервере!', 'success');
    } catch (error) {
        localStorage.setItem('avatar', selectedAvatar);
        const user = getUserData();
        user.avatar = selectedAvatar;
        updateProfile(user);
        showNotification('✅ Аватар сохранён локально!', 'success');
        console.warn('Серверный API для смены аватара не найден, сохранено в localStorage');
    }
});