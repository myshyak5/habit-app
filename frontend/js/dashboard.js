// frontend/js/dashboard.js

// Загрузка дашборда
document.addEventListener('DOMContentLoaded', async function() {
    if (!checkAuth()) return;
    updateUserInfo();
    await loadHabits();
});

function checkLevelUp(oldLevel, newLevel) {
    if (newLevel > oldLevel) {
        animateCharacter('levelUp', 2500);
        setTimeout(() => showConfetti(), 300);
        setTimeout(() => showConfetti(), 700);
        showNotification(`🎉 УРОВЕНЬ ПОВЫШЕН! Теперь вы ${newLevel} уровень!`, 'success');
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

function updateUserInfo() {
    const user = getUserData();
    const oldLevel = parseInt(localStorage.getItem('oldLevel')) || user.level;
    
    document.getElementById('usernameDisplay').textContent = user.username;
    document.getElementById('levelDisplay').textContent = user.level;
    document.getElementById('xpDisplay').textContent = user.experience;
    document.getElementById('goldDisplay').textContent = user.gold;
    
    const xpPerLevel = 100;
    const currentLevelXP = user.experience % xpPerLevel;
    const progressPercent = (currentLevelXP / xpPerLevel) * 100;
    
    const progressFill = document.getElementById('xpProgress');
    const progressText = document.getElementById('xpProgressText');
    
    if (progressFill) {
        progressFill.style.width = Math.min(progressPercent, 100) + '%';
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
    
    const avatarElement = document.getElementById('characterAvatar');
    if (avatarElement) {
        avatarElement.textContent = user.avatar || '😊';
    }
    checkLevelUp(oldLevel, user.level);
    localStorage.setItem('oldLevel', user.level);
}

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

async function toggleHabitHandler(habitId) {
    try {
        const habits = await getHabits();
        const habit = habits.find(h => h.id === habitId);
        if (!habit) {
            showNotification('❌ Привычка не найдена', 'error');
            return;
        }

        const today = new Date().toISOString().split('T')[0];
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

        if (isCompleted) {
            animateCharacter('veryHappy', 1500);
            // ✅ НАЧИСЛЯЕМ XP ТОЛЬКО ЗДЕСЬ
            showNotification(`✅ Привычка выполнена! +${habit.xp_reward} XP`, 'success');
        } else {
            animateCharacter('sad', 1500);
            showNotification('⏳ Привычка отменена', 'info');
        }
    } catch (error) {
        console.error('Ошибка отметки привычки:', error);
        showNotification('❌ Ошибка: ' + error.message, 'error');
        await loadHabits();
    }
}

async function refreshUserData() {
    try {
        const userData = await apiRequest('/user/', 'GET');
        localStorage.setItem('level', userData.level);
        localStorage.setItem('experience', userData.experience);
        localStorage.setItem('gold', userData.gold);
        localStorage.setItem('avatar', userData.avatar_skin || '😊');
        return userData;
    } catch (error) {
        console.warn('Не удалось обновить данные с сервера, используем локальные');
        return getUserData();
    }
}

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

// =============================================
// 🔥 АНИМАЦИЯ ПЕРСОНАЖА
// =============================================

function animateCharacter(emotion = 'happy', duration = 1500) {
    const avatar = document.getElementById('characterAvatar');
    if (!avatar) {
        const fallbackAvatar = document.querySelector('.avatar');
        if (!fallbackAvatar) return;
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

// =============================================
// 🪟 МОДАЛЬНОЕ ОКНО ДЛЯ ДОБАВЛЕНИЯ ПРИВЫЧКИ
// =============================================

let selectedDifficultyXp = 20;

function selectDifficulty(level, xp, btn) {
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedDifficultyXp = xp;
    document.getElementById('habitXp').value = xp;
}

function openHabitModal() {
    document.getElementById('addHabitModal').style.display = 'flex';
    document.getElementById('addHabitForm').reset();
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
    const defaultBtn = document.querySelector('.diff-btn.easy');
    if (defaultBtn) {
        defaultBtn.classList.add('selected');
        selectedDifficultyXp = 20;
        document.getElementById('habitXp').value = 20;
    }
}

function closeHabitModal() {
    document.getElementById('addHabitModal').style.display = 'none';
}

// 🔥 Обработчик отправки формы (НОВЫЙ)
document.getElementById('addHabitForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('habitName').value.trim();
    if (!name) {
        showNotification('❌ Введите название привычки', 'error');
        return;
    }
    
    const description = document.getElementById('habitDescription').value.trim();
    const xpReward = parseInt(document.getElementById('habitXp').value) || 20;
    
    try {
        await createHabit(name, description, xpReward);
        await loadHabits();
        closeHabitModal();
        // ✅ УБИРАЕМ НАЧИСЛЕНИЕ XP
        showNotification(`✅ Привычка "${name}" создана!`, 'success');
    } catch (error) {
        showNotification('❌ Ошибка: ' + error.message, 'error');
    }
});

// 🔥 Обработчик кнопки "Добавить привычку" (ТОЛЬКО ОДИН!)
document.getElementById('addHabitBtn')?.addEventListener('click', function() {
    openHabitModal();
});

// Закрытие модального окна при клике на фон
document.getElementById('addHabitModal')?.addEventListener('click', function(e) {
    if (e.target === this) {
        closeHabitModal();
    }
});