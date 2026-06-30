// frontend/js/dashboard.js

// Загрузка дашборда
document.addEventListener('DOMContentLoaded', async function() {
    // Проверяем авторизацию
    if (!checkAuth()) return;

    // Показываем данные пользователя
    updateUserInfo();

    // Загружаем привычки
    await loadHabits();
});
function checkLevelUp(oldLevel, newLevel) {
    if (newLevel > oldLevel) {
        // 🔥 АНИМАЦИЯ ПЕРСОНАЖА И КОНФЕТТИ
        animateCharacter('levelUp', 2500);
        setTimeout(() => showConfetti(), 300);
        setTimeout(() => showConfetti(), 700);
        
        // Показываем праздничное уведомление
        showNotification(`🎉 УРОВЕНЬ ПОВЫШЕН! Теперь вы ${newLevel} уровень!`, 'success');
        
        // Дополнительно: можно добавить CSS-анимацию "конфетти"
        const avatar = document.getElementById('characterAvatar');
        if (avatar) {
            avatar.style.transform = 'scale(1.5)';
            avatar.style.transition = 'transform 0.3s';
            setTimeout(() => {
                avatar.style.transform = 'scale(1)';
            }, 500);
        }
    }
}

// Обновить информацию о пользователе
function updateUserInfo() {
    const user = getUserData();
    const oldLevel = parseInt(localStorage.getItem('oldLevel')) || user.level;
    
    // Обновляем основные данные
    document.getElementById('usernameDisplay').textContent = user.username;
    document.getElementById('levelDisplay').textContent = user.level;
    document.getElementById('xpDisplay').textContent = user.experience;
    document.getElementById('goldDisplay').textContent = user.gold;
    
    // 🔥 ОБНОВЛЯЕМ ПРОГРЕСС-БАР
    const xpPerLevel = 100; // Сколько опыта нужно для 1 уровня
    const currentLevelXP = user.experience % xpPerLevel; // Опыт в текущем уровне
    const progressPercent = (currentLevelXP / xpPerLevel) * 100;
    
    const progressFill = document.getElementById('xpProgress');
    const progressText = document.getElementById('xpProgressText');
    
    if (progressFill) {
        progressFill.style.width = Math.min(progressPercent, 100) + '%';
        // Если опыт переполнен (бывает при быстром росте), показываем 100%
        if (progressPercent >= 100) {
            progressFill.style.width = '100%';
            progressFill.classList.add('animating');
        } else {
            progressFill.classList.remove('animating');
        }
    }
    
    if (progressText) {
        const xpNeeded = xpPerLevel - currentLevelXP;
        progressText.textContent = `${Math.round(progressPercent)}% до следующего уровня (осталось ${xpNeeded} XP)`;
    }
    
    // Обновляем аватар персонажа
    const avatarElement = document.getElementById('characterAvatar');
    if (avatarElement) {
        avatarElement.textContent = user.avatar || '😊';
    }
    checkLevelUp(oldLevel, user.level);
    localStorage.setItem('oldLevel', user.level);
}
// Загрузить привычки
async function loadHabits() {
    const habitsList = document.getElementById('habitsList');

    try {
        const habits = await getHabits();

        if (!habits || habits.length === 0) {
            habitsList.innerHTML = `
                <div class="empty-state">
                    <p>😴 У вас пока нет привычек</p>
                    <p style="font-size:14px;">Нажмите кнопку ниже, чтобы добавить первую</p>
                </div>
            `;
            return;
        }

        // Рендерим список привычек
        habitsList.innerHTML = habits.map(habit => {
            const completed = isCompletedToday(habit.completed_dates);
            return `
                <div class="habit-item" data-id="${habit.id}">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <input 
                            type="checkbox" 
                            class="habit-checkbox" 
                            ${completed ? 'checked' : ''}
                            onchange="toggleHabitHandler(${habit.id})"
                        />
                        <span class="habit-name">${habit.name}</span>
                        ${habit.description ? `<span style="color:#999;font-size:12px;">${habit.description}</span>` : ''}
                    </div>
                    <div style="display:flex;align-items:center;gap:10px;">
                        <span style="font-size:12px;color:#888;">+${habit.xp_reward} XP</span>
                        <button 
                            onclick="deleteHabitHandler(${habit.id})" 
                            style="background:none;border:none;color:#ff4757;cursor:pointer;font-size:18px;"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        showNotification('Ошибка загрузки привычек: ' + error.message, 'error');
    }
}

// Обработчик отметки привычки
async function toggleHabitHandler(habitId) {
    try {
        const habits = await getHabits();
        const habit = habits.find(h => h.id === habitId);
        if (!habit) {
            showNotification('❌ Привычка не найдена', 'error');
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        // 🔥 ВОТ ЗДЕСЬ МЫ СОЗДАЁМ ПЕРЕМЕННУЮ
        let completed_dates = habit.completed_dates || [];

        if (completed_dates.includes(today)) {
            completed_dates = completed_dates.filter(date => date !== today);
        } else {
            completed_dates.push(today);
        }

        await toggleHabit(habitId, completed_dates);
        await refreshUserData();
        await loadHabits();
        updateUserInfo();
        
        const isCompleted = completed_dates.includes(today);

        // 🔥 АНИМАЦИЯ ПЕРСОНАЖА
        if (isCompleted) {
            animateCharacter('veryHappy', 1500);
        } else {
            animateCharacter('sad', 1500);
        }

        showNotification(
            isCompleted ? '✅ Привычка выполнена! +XP' : '⏳ Привычка отменена',
            isCompleted ? 'success' : 'info'
        );
    } catch (error) {
        console.error('Ошибка отметки привычки:', error);
        showNotification('❌ Ошибка: ' + error.message, 'error');
        await loadHabits();
    }
}

// 🔥 НОВАЯ ФУНКЦИЯ: запрашиваем актуальные данные пользователя с сервера
async function refreshUserData() {
    try {
        // Если бэкенд готов — запрашиваем /api/user/
        const userData = await apiRequest('/user/', 'GET');
        
        // Обновляем localStorage
        localStorage.setItem('level', userData.level);
        localStorage.setItem('experience', userData.experience);
        localStorage.setItem('gold', userData.gold);
        localStorage.setItem('avatar', userData.avatar_skin || '😊');
        
        return userData;
    } catch (error) {
        // Если API ещё нет — используем локальные данные
        console.warn('Не удалось обновить данные с сервера, используем локальные');
        return getUserData();
    }
}

// Обработчик удаления привычки
async function deleteHabitHandler(habitId) {
    if (!confirm('Вы уверены, что хотите удалить эту привычку?')) return;

    try {
        await deleteHabit(habitId);
        await loadHabits();
        showNotification('Привычка удалена', 'success');
    } catch (error) {
        showNotification('Ошибка: ' + error.message, 'error');
    }
}

// Обработчик добавления привычки
document.getElementById('addHabitBtn')?.addEventListener('click', function() {
    const name = prompt('Введите название привычки:');
    if (!name || name.trim() === '') return;

    const description = prompt('Описание (необязательно):') || '';
    const xpReward = parseInt(prompt('Опыт за выполнение (по умолчанию 10):') || '10');

    createHabit(name.trim(), description, xpReward)
        .then(() => {
            loadHabits();
            showNotification('Привычка добавлена!', 'success');
        })
        .catch(error => {
            showNotification('Ошибка: ' + error.message, 'error');
        });
});
function animateCharacter(emotion = 'happy', duration = 1500) {
    const avatar = document.getElementById('characterAvatar');
    if (!avatar) {
        // Если нет элемента с id characterAvatar, используем обычный avatar
        const fallbackAvatar = document.querySelector('.avatar');
        if (!fallbackAvatar) return;
        // Меняем текст у обычного avatar
        const emotions = {
            happy: '😊',
            veryHappy: '🤩',
            levelUp: '🥳',
            sad: '😢',
            cool: '😎',
            default: localStorage.getItem('avatar') || '😊'
        };
        fallbackAvatar.textContent = emotions[emotion] || emotions.default;
        fallbackAvatar.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), font-size 0.3s ease';
        fallbackAvatar.style.transform = 'scale(1.8) rotate(10deg)';
        fallbackAvatar.style.fontSize = '55px';
        setTimeout(() => {
            fallbackAvatar.style.transform = 'scale(1) rotate(0deg)';
            fallbackAvatar.style.fontSize = '40px';
        }, 300);
        if (emotion !== 'default') {
            setTimeout(() => {
                const savedAvatar = localStorage.getItem('avatar') || '😊';
                fallbackAvatar.textContent = savedAvatar;
                fallbackAvatar.style.transform = 'scale(1) rotate(0deg)';
            }, duration);
        }
        return;
    }

    const emotions = {
        happy: '😊',
        veryHappy: '🤩',
        levelUp: '🥳',
        sad: '😢',
        cool: '😎',
        default: localStorage.getItem('avatar') || '😊'
    };

    avatar.textContent = emotions[emotion] || emotions.default;
    avatar.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), font-size 0.3s ease';
    avatar.style.transform = 'scale(1.8) rotate(10deg)';
    avatar.style.fontSize = '55px';

    setTimeout(() => {
        avatar.style.transform = 'scale(1) rotate(0deg)';
        avatar.style.fontSize = '40px';
    }, 300);

    if (emotion !== 'default') {
        setTimeout(() => {
            const savedAvatar = localStorage.getItem('avatar') || '😊';
            avatar.textContent = savedAvatar;
            avatar.style.transform = 'scale(1) rotate(0deg)';
        }, duration);
    }
}

function showConfetti() {
    const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd'];
    for (let i = 0; i < 30; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-piece';
        confetti.style.cssText = `
            position: fixed;
            top: -10px;
            left: ${Math.random() * 100}vw;
            width: ${Math.random() * 10 + 5}px;
            height: ${Math.random() * 10 + 5}px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
            pointer-events: none;
            z-index: 9999;
            opacity: 1;
            animation: confettiFall ${Math.random() * 2 + 2}s linear forwards;
            animation-delay: ${Math.random() * 0.5}s;
        `;
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 3000);
    }
}