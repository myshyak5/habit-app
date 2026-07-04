let activityChart = null;
let selectedAvatar = '😊';
let allSkins = [];

document.addEventListener('DOMContentLoaded', async function() {
    if (!checkAuth()) return;
    
    const avatar = localStorage.getItem('avatar') || '😊';
    const username = localStorage.getItem('username') || 'Пользователь';
    
    document.getElementById('profileAvatar').textContent = avatar;
    document.getElementById('profileUsername').textContent = username;
    
    await refreshUserData();

    const user = getUserData();
    selectedAvatar = user.avatar || '😊';

    await loadAllSkins();
    updateProfile(user);
    highlightSelectedAvatar(selectedAvatar);
    await loadOwnedSkinsIntoSelector();
    await loadProfileStats();
    await loadChartData();
});

async function loadAllSkins() {
    try {
        const response = await apiRequest('/skins/', 'GET');
        allSkins = response.map(skin => ({
            id: skin.id,
            emoji: skin.emoji,
            name: skin.name,
            price: skin.price
        }));
    } catch (error) {
        showNotification('❌ ' + handleApiError(error, 'Не удалось загрузить скины'), 'error');
    }
}

function updateProfile(user) {
    document.getElementById('profileUsername').textContent = user.username;
    document.getElementById('profileLevel').textContent = user.level;
    document.getElementById('profileXP').textContent = user.experience;
    document.getElementById('profileGold').textContent = user.gold;
    document.getElementById('profileAvatar').textContent = user.avatar || '😊';
    updateAvatarOnDashboard(user.avatar || '😊');
}

function updateAvatarOnDashboard(emoji) {
    const avatarElement = document.getElementById('characterAvatar');
    if (avatarElement) {
        avatarElement.textContent = emoji;
    }
}

function highlightSelectedAvatar(avatar) {
    const options = document.querySelectorAll('.avatar-option');
    options.forEach(option => {
        option.classList.toggle('selected', option.dataset.avatar === avatar);
    });
}

document.querySelectorAll('.avatar-option:not(.owned-skin)').forEach(option => {
    option.addEventListener('click', function() {
        selectedAvatar = this.dataset.avatar;
        highlightSelectedAvatar(selectedAvatar);
        document.getElementById('profileAvatar').textContent = selectedAvatar;
    });
});

async function loadOwnedSkinsIntoSelector() {
    const container = document.getElementById('avatarSelector');
    if (!container) {
        console.warn('⚠️ Контейнер avatarSelector не найден');
        return;
    }

    container.querySelectorAll('.owned-skin').forEach(el => el.remove());
    
    try {
        const user = await apiRequest('/user/', 'GET');
        const ownedSkinIds = user.owned_skins || [];
        const currentAvatar = user.avatar_skin || '😊';
        const ownedSkins = allSkins.filter(skin => ownedSkinIds.includes(skin.id));
        
        ownedSkins.forEach(skin => {
            const option = document.createElement('div');
            option.className = `avatar-option owned-skin ${skin.emoji === currentAvatar ? 'selected' : ''}`;
            option.dataset.avatar = skin.emoji;
            option.dataset.skinId = skin.id;
            option.textContent = skin.emoji;
            option.title = `${skin.name} (куплен)`;
            
            option.addEventListener('click', function() {
                selectedAvatar = this.dataset.avatar;
                highlightSelectedAvatar(selectedAvatar);
                document.getElementById('profileAvatar').textContent = selectedAvatar;
            });
            
            container.appendChild(option);
        });
        highlightSelectedAvatar(currentAvatar);
    } catch (error) {
        showNotification('❌ ' + handleApiError(error, 'Не удалось загрузить купленные скины'), 'error');
    }
}

document.getElementById('saveAvatarBtn')?.addEventListener('click', async function() {
    try {
        await apiRequest('/user/update-avatar/', 'POST', {
            avatar_skin: selectedAvatar
        });
        await refreshUserData();
        const user = getUserData();
        updateProfile(user);
        highlightSelectedAvatar(selectedAvatar);
        await loadOwnedSkinsIntoSelector();
        showNotification('✅ Аватар сохранён!', 'success');
    } catch (error) {
        console.error('Ошибка сохранения аватара:', error);
        showNotification('❌ Ошибка сохранения аватара', 'error');
    }
});

document.getElementById('deleteAccountBtn')?.addEventListener('click', async function() {
    const confirmDelete = confirm(
        '⚠️ ВНИМАНИЕ! Вы собираетесь удалить свой аккаунт.\n\n' +
        'Это действие НЕОБРАТИМО.\n' +
        'Будут удалены:\n' +
        '• Все ваши привычки\n' +
        '• Вся статистика и опыт\n' +
        '• Все купленные скины\n' +
        '• Ваш профиль\n\n' +
        'Вы уверены, что хотите продолжить?'
    );
    
    if (!confirmDelete) return;
    const password = prompt(
        '🔐 Введите ваш пароль для подтверждения удаления аккаунта:'
    );
    
    if (password === null) return;
    
    if (!password || password.trim() === '') {
        showNotification('❌ Пароль не может быть пустым', 'error');
        return;
    }
    
    try {
        const response = await apiRequest('/user/delete/', 'POST', {
            password: password
        });
        
        if (response.status === 'success') {
            showNotification('✅ Аккаунт успешно удалён', 'success');
            localStorage.clear();
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    } catch (error) {
        console.error('Ошибка удаления аккаунта:', error);

        if (error.message.includes('пароль') || error.message.includes('password')) {
            showNotification('❌ Неверный пароль. Попробуйте снова.', 'error');
        } else {
            showNotification('❌ Ошибка удаления аккаунта: ' + error.message, 'error');
        }
    }
});

async function loadProfileStats() {
    try {
        const user = getUserData();
        document.getElementById('profileCompleted').textContent = user.total_completed || 0;
    } catch (error) {
        document.getElementById('profileCompleted').textContent = '0';
    }
}

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
                <div class="chart-error">
                    <p>📊 Не удалось загрузить данные</p>
                    <p class="chart-error-text">${error.message}</p>
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
                <div class="chart-empty">
                    <p class="chart-empty-icon">📊</p>
                    <p>Нет выполненных привычек за последнюю неделю</p>
                    <p class="chart-empty-text">Начните выполнять привычки, чтобы увидеть график!</p>
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
                    backgroundColor: 'rgba(118, 75, 162, 0.8)',
                    borderColor: 'rgba(118, 75, 162, 1)',
                    borderWidth: 2,
                    borderRadius: {
                        topLeft: 8,
                        topRight: 8,
                        bottomLeft: 0,
                        bottomRight: 0
                    },
                    barPercentage: 0.6,
                    categoryPercentage: 0.9,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
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