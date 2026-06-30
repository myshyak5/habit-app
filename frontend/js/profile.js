// frontend/js/profile.js

// Переменная для хранения экземпляра графика
let activityChart = null;

// Текущий выбранный аватар
let selectedAvatar = '😊';

// Загрузка страницы
document.addEventListener('DOMContentLoaded', async function() {
    if (!checkAuth()) return;
    
    // Загружаем данные пользователя
    const user = getUserData();
    selectedAvatar = user.avatar || '😊';
    
    // Отображаем данные
    updateProfile(user);
    
    // Подсвечиваем выбранный аватар
    highlightSelectedAvatar(selectedAvatar);
    
    // Загружаем статистику
    await loadProfileStats();
    
    // 🔥 ЗАГРУЖАЕМ ГРАФИК
    await loadChartData();
});

// Обновление профиля
function updateProfile(user) {
    document.getElementById('profileUsername').textContent = user.username;
    document.getElementById('profileLevel').textContent = user.level;
    document.getElementById('profileXP').textContent = user.experience;
    document.getElementById('profileGold').textContent = user.gold;
    document.getElementById('profileAvatar').textContent = user.avatar || '😊';
    
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

// Загрузка статистики
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
// 🔥 ГРАФИК АКТИВНОСТИ (CHART.JS)
// =============================================

async function loadChartData() {
    try {
        // Получаем привычки
        const habits = await getHabits();
        
        // Создаём объект для подсчёта выполненных привычек по дням
        const today = new Date();
        const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        const weekData = new Array(7).fill(0);
        
        // Проходим по всем привычкам
        habits.forEach(habit => {
            const completedDates = habit.completed_dates || [];
            completedDates.forEach(dateStr => {
                const date = new Date(dateStr);
                // Проверяем, что дата входит в последние 7 дней
                const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24));
                if (diffDays >= 0 && diffDays < 7) {
                    // Индекс дня: 0 = понедельник, 6 = воскресенье
                    const dayIndex = (date.getDay() + 6) % 7;
                    weekData[dayIndex]++;
                }
            });
        });
        
        // Создаём график
        createChart(dayNames, weekData);
        
    } catch (error) {
        console.error('Ошибка загрузки данных для графика:', error);
        // Показываем заглушку
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
    
    // Если график уже существует — уничтожаем его
    if (activityChart) {
        activityChart.destroy();
    }
    
    const colors = [
        'rgba(102, 126, 234, 0.7)',
        'rgba(102, 126, 234, 0.7)',
        'rgba(102, 126, 234, 0.7)',
        'rgba(102, 126, 234, 0.7)',
        'rgba(102, 126, 234, 0.7)',
        'rgba(102, 126, 234, 0.7)',
        'rgba(102, 126, 234, 0.7)'
    ];
    
    // Подсвечиваем максимальное значение
    const maxValue = Math.max(...data);
    if (maxValue > 0) {
        const maxIndex = data.indexOf(maxValue);
        colors[maxIndex] = 'rgba(118, 75, 162, 0.9)';
    }
    
    activityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Выполнено привычек',
                data: data,
                backgroundColor: colors,
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2,
                borderRadius: 8,
                barPercentage: 0.7,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
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
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    }
                }
            }
        }
    });
}

// =============================================
// АВАТАР
// =============================================

// Подсветка выбранного аватара
function highlightSelectedAvatar(avatar) {
    const options = document.querySelectorAll('.avatar-option');
    options.forEach(option => {
        option.classList.toggle('selected', option.dataset.avatar === avatar);
    });
}

// Обработчик клика по аватару
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