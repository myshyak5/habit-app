// frontend/js/profile.js

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

// Загрузка статистики (количество выполненных привычек)
async function loadProfileStats() {
    try {
        const habits = await getHabits();
        const totalCompleted = habits.reduce((sum, habit) => {
            return sum + (habit.completed_dates || []).length;
        }, 0);
        document.getElementById('profileCompleted').textContent = totalCompleted;
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
        document.getElementById('profileCompleted').textContent = '?';
    }
}

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
        // Отправляем на сервер
        await apiRequest('/user/update_avatar/', 'PATCH', {
            avatar_skin: selectedAvatar
        });
        
        // Сохраняем в localStorage
        localStorage.setItem('avatar', selectedAvatar);
        
        // Обновляем отображение
        const user = getUserData();
        user.avatar = selectedAvatar;
        updateProfile(user);
        
        showNotification('✅ Аватар сохранён!', 'success');
    } catch (error) {
        // Если API нет — сохраняем локально
        localStorage.setItem('avatar', selectedAvatar);
        showNotification('✅ Аватар сохранён локально!', 'success');
        console.warn('Серверный API для смены аватара не найден, сохранено в localStorage');
    }
});