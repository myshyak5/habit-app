// frontend/js/dashboard.js

// Загрузка дашборда
document.addEventListener('DOMContentLoaded', async function() {
    if (!checkAuth()) return;
    
    // Загружаем ежедневные задания
    loadDailyQuests();
    checkDailyReset();
    
    updateUserInfo();
    await loadHabits();
    
    // Отображаем задания
    renderDailyQuests();
});

// =============================================
// 📋 ЕЖЕДНЕВНЫЕ ЗАДАНИЯ
// =============================================
function getXpForLevel(level) {
    return 100 + (level - 1) * 25;
}

const DAILY_QUESTS = [
    { id: 1, name: '💪 Выполнить 3 привычки', description: 'Отметь 3 любые привычки сегодня', target: 3, rewardGold: 10, rewardXp: 20 },
    { id: 2, name: '📚 Выполнить сложную привычку', description: 'Выполни привычку с наградой 40+ XP', target: 1, rewardGold: 15, rewardXp: 30 },
    { id: 3, name: '🔥 Серия из 5 привычек', description: 'Выполни 5 привычек подряд без пропусков', target: 5, rewardGold: 20, rewardXp: 40 },
];

// Текущее состояние заданий (загружается из localStorage)
let dailyQuestsProgress = {};
let dailyQuestsCompleted = false;
let lastQuestDate = '';

// Загрузить прогресс заданий
function loadDailyQuests() {
    const saved = localStorage.getItem('dailyQuests');
    if (saved) {
        const data = JSON.parse(saved);
        dailyQuestsProgress = data.progress || {};
        dailyQuestsCompleted = data.completed || false;
        lastQuestDate = data.date || '';
    } else {
        // Инициализация
        dailyQuestsProgress = {};
        dailyQuestsCompleted = false;
        lastQuestDate = '';
    }
}

// Сохранить прогресс заданий
function saveDailyQuests() {
    localStorage.setItem('dailyQuests', JSON.stringify({
        progress: dailyQuestsProgress,
        completed: dailyQuestsCompleted,
        date: lastQuestDate
    }));
}

// Проверить, нужно ли сбросить задания (новый день)
function checkDailyReset() {
    const today = new Date().toISOString().split('T')[0];
    if (lastQuestDate !== today) {
        // Новый день — сбрасываем прогресс
        dailyQuestsProgress = {};
        dailyQuestsCompleted = false;
        lastQuestDate = today;
        saveDailyQuests();
        return true;
    }
    return false;
}

// Обновить прогресс задания
function updateQuestProgress(habitXp) {
    if (dailyQuestsCompleted) return;

    // 1. Задание "Выполнить 3 привычки"
    const quest1 = DAILY_QUESTS[0];
    if (!dailyQuestsProgress[quest1.id]) {
        dailyQuestsProgress[quest1.id] = 0;
    }
    dailyQuestsProgress[quest1.id] += 1;

    // 2. Задание "Выполнить сложную привычку"
    if (habitXp >= 40) {
        const quest2 = DAILY_QUESTS[1];
        if (!dailyQuestsProgress[quest2.id]) {
            dailyQuestsProgress[quest2.id] = 0;
        }
        dailyQuestsProgress[quest2.id] += 1;
    }

    // 3. Задание "Серия из 5 привычек"
    // Проверяем стрик (серию) — считаем, сколько дней подряд выполнено
    const quest3 = DAILY_QUESTS[2];
    if (!dailyQuestsProgress[quest3.id]) {
        dailyQuestsProgress[quest3.id] = 0;
    }
    // Логика стрика: увеличиваем только если сегодня уже выполняли
    // Простая версия: считаем общее количество выполненных за сегодня
    // (это не совсем стрик, но для MVP подойдёт)
    const totalToday = document.querySelectorAll('.habit-item .habit-checkbox:checked').length;
    dailyQuestsProgress[quest3.id] = totalToday;

    // Проверяем, выполнены ли все задания
    checkAllQuestsCompleted();
    saveDailyQuests();
}

// Проверить, все ли задания выполнены
function checkAllQuestsCompleted() {
    if (dailyQuestsCompleted) return;
    
    const allCompleted = DAILY_QUESTS.every(quest => {
        const progress = dailyQuestsProgress[quest.id] || 0;
        return progress >= quest.target;
    });
    
    if (allCompleted) {
        dailyQuestsCompleted = true;
        // Начисляем бонус за все задания
        const totalGold = DAILY_QUESTS.reduce((sum, q) => sum + q.rewardGold, 0);
        const totalXp = DAILY_QUESTS.reduce((sum, q) => sum + q.rewardXp, 0);
        
        // Начисляем награду
        const user = getUserData();
        const newGold = (user.gold || 0) + totalGold;
        const newXp = (user.experience || 0) + totalXp;
        localStorage.setItem('gold', newGold);
        localStorage.setItem('experience', newXp);
        
        showNotification(`🎉 Все ежедневные задания выполнены! +${totalGold} 💵 и +${totalXp} XP`, 'success');
        updateUserInfo();
        saveDailyQuests();
    }
}

// Получить прогресс заданий для отображения
function getDailyQuestsProgress() {
    checkDailyReset();
    return DAILY_QUESTS.map(quest => ({
        ...quest,
        progress: dailyQuestsProgress[quest.id] || 0,
        completed: dailyQuestsProgress[quest.id] >= quest.target || dailyQuestsCompleted
    }));
}
function renderDailyQuests() {
    const container = document.getElementById('dailyQuestsList');
    if (!container) return;

    const quests = getDailyQuestsProgress();
    
    if (quests.length === 0) {
        container.innerHTML = '<p style="color:#999;text-align:center;font-size:14px;">Нет заданий на сегодня</p>';
        return;
    }

    const allCompleted = quests.every(q => q.completed);

    container.innerHTML = quests.map(quest => {
        const progress = quest.progress;
        const target = quest.target;
        const percent = Math.min((progress / target) * 100, 100);
        const isCompleted = quest.completed;

        return `
            <div class="daily-quest-item ${isCompleted ? 'completed' : ''}">
                <div class="quest-name">${quest.name}</div>
                <div class="quest-description">${quest.description}</div>
                <div class="quest-progress">
                    <div class="quest-progress-bar">
                        <div class="quest-progress-fill" style="width: ${percent}%;"></div>
                    </div>
                    <span style="font-size:12px;color:#666;min-width:30px;">${progress}/${target}</span>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:5px;">
                    <div class="quest-reward">+${quest.rewardGold} 💵 +${quest.rewardXp} XP</div>
                    <div class="quest-status">${isCompleted ? '✅' : '⏳'}</div>
                </div>
            </div>
        `;
    }).join('');

    if (allCompleted) {
        const totalGold = DAILY_QUESTS.reduce((sum, q) => sum + q.rewardGold, 0);
        const totalXp = DAILY_QUESTS.reduce((sum, q) => sum + q.rewardXp, 0);
        container.innerHTML += `
            <div style="text-align:center;padding:12px;background:#d4edda;border-radius:10px;margin-top:10px;color:#155724;font-weight:600;font-size:13px;">
                🎉 Все выполнено! +${totalGold} 💵 +${totalXp} XP
            </div>
        `;
    }
}
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
// =============================================
// 📋 ЗАГРУЗКА ПРИВЫЧЕК
// =============================================

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
            const xpReward = habit.xp_reward || 10;
            const goldReward = Math.floor(xpReward / 2); // Половина опыта в золоте
            
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
                        <span style="font-size:12px;color:#888;">+${goldReward} 💵</span>
                        <span style="font-size:12px;color:#888;">+${xpReward} XP</span>
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

function updateUserInfo() {
    const user = getUserData();
    const oldLevel = parseInt(localStorage.getItem('oldLevel')) || user.level;
    
    document.getElementById('usernameDisplay').textContent = user.username;
    document.getElementById('levelDisplay').textContent = user.level;
    document.getElementById('xpDisplay').textContent = user.experience;
    document.getElementById('goldDisplay').textContent = user.gold;
    
    const xpPerLevel = getXpForLevel(user.level);
    const currentLevelXP = user.experience % xpPerLevel;
    const progressPercent = (currentLevelXP / xpPerLevel) * 100;
    
    const progressFill = document.getElementById('xpProgress');
    const progressText = document.getElementById('xpProgressText');
    const percentSpan = document.querySelector('.progress-percent');
    
    if (progressFill) {
        const percent = Math.min(progressPercent, 100);
        progressFill.style.width = percent + '%';
        if (percentSpan) {
            percentSpan.textContent = Math.round(percent) + '%';
        }
        if (progressPercent >= 100) {
            progressFill.classList.add('animating');
        } else {
            progressFill.classList.remove('animating');
        }
    }
    
    // 🔥 ОБНОВЛЯЕМ ПОДСКАЗКУ
    const tooltipCurrent = document.getElementById('tooltipCurrentXP');
    const tooltipTotal = document.getElementById('tooltipTotalXP');
    if (tooltipCurrent) {
        tooltipCurrent.textContent = currentLevelXP;
    }
    if (tooltipTotal) {
        tooltipTotal.textContent = xpPerLevel;
    }
    
    if (progressText) {
        const xpNeeded = xpPerLevel - currentLevelXP;
        progressText.textContent = `До следующего уровня необходимо ${xpNeeded} XP`;
    }
    
    const avatarElement = document.getElementById('characterAvatar');
    if (avatarElement) {
        avatarElement.textContent = user.avatar || '😊';
    }
    checkLevelUp(oldLevel, user.level);
    localStorage.setItem('oldLevel', user.level);
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

        // 🔥 АНИМАЦИЯ И УВЕДОМЛЕНИЕ
        if (isCompleted) {
            animateCharacter('veryHappy', 1500);
            
            // ✅ ОБЪЯВЛЯЕМ ПЕРЕМЕННУЮ ЗДЕСЬ
            const xpReward = habit.xp_reward || 10;
            const goldReward = Math.floor(xpReward / 2);
            
            showNotification(`✅ Привычка выполнена! +${xpReward} XP, +${goldReward} 💵`, 'success');
            
            updateQuestProgress(habit.xp_reward);
            renderDailyQuests();
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
    if (!confirm('🗑️ Вы уверены, что хотите удалить эту привычку?')) return;

    try {
        const habits = await getHabits();
        const habit = habits.find(h => h.id === habitId);
        
        if (!habit) {
            showNotification('❌ Привычка не найдена', 'error');
            return;
        }

        const completedCount = (habit.completed_dates || []).length;
        const xpReward = habit.xp_reward || 10;
        const totalXp = completedCount * xpReward;
        const totalGold = completedCount * Math.floor(xpReward / 2);

        await deleteHabit(habitId);

        if (totalXp > 0 || totalGold > 0) {
            const user = getUserData();
            
            // Списываем опыт
            const newXp = Math.max(0, user.experience - totalXp);
            localStorage.setItem('experience', newXp);
            
            // Списываем золото
            const newGold = Math.max(0, user.gold - totalGold);
            localStorage.setItem('gold', newGold);
            
            // Пересчитываем уровень
            let newLevel = 1;
            let remainingXp = newXp;
            while (true) {
                const xpNeeded = getXpForLevel(newLevel);
                if (remainingXp < xpNeeded) break;
                remainingXp -= xpNeeded;
                newLevel++;
            }
            localStorage.setItem('level', Math.max(1, newLevel));
            
            await refreshUserData();
            updateUserInfo();
            showNotification(`🗑️ Привычка удалена! Снято ${totalXp} XP и ${totalGold} 💵`, 'info');
        } else {
            showNotification('✅ Привычка удалена!', 'success');
        }
        
        await loadHabits();
        
    } catch (error) {
        console.error('Ошибка удаления:', error);
        showNotification('❌ Ошибка: ' + error.message, 'error');
    }
}

// =============================================
// 🔥 АНИМАЦИЯ ПЕРСОНАЖА
// =============================================
// =============================================
// 🎉 КОНФЕТТИ
// =============================================

function showConfetti() {
    const symbols = ['✦', '✧', '⭐', '✨', '❄️', '💫'];
    const colors = ['#ffd93d', '#ff6b6b', '#48dbfb', '#ff9ff3', '#54a0ff', '#feca57'];
    
    for (let i = 0; i < 20; i++) {
        const el = document.createElement('div');
        el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        el.style.cssText = `
            position: fixed;
            top: -20px;
            left: ${Math.random() * 100}vw;
            font-size: ${Math.random() * 18 + 18}px;
            color: ${colors[Math.floor(Math.random() * colors.length)]};
            pointer-events: none;
            z-index: 9999;
            animation: confettiFall ${Math.random() * 2 + 1.5}s linear forwards;
            animation-delay: ${Math.random() * 0.5}s;
            opacity: 0;
        `;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 3500);
    }
}
let animationTimer = null;  // ← ГЛОБАЛЬНЫЙ ТАЙМЕР

function animateCharacter(emotion = 'happy', duration = 1500) {
    const avatar = document.getElementById('characterAvatar');
    if (!avatar) return;

    // 🔥 ОЧИЩАЕМ ПРЕДЫДУЩИЙ ТАЙМЕР
    if (animationTimer) {
        clearTimeout(animationTimer);
        animationTimer = null;
    }

    const emotions = {
        happy: '😊',
        veryHappy: '🤩',
        levelUp: '🥳',
        sad: '😢',
        cool: '😎',
        default: localStorage.getItem('avatar') || '😊'
    };

    // Сброс предыдущей анимации
    avatar.style.transition = 'none';
    avatar.style.transform = 'scale(1)';
    avatar.style.fontSize = '40px';
    
    // Принудительный рефлоу
    void avatar.offsetHeight;

    // Применяем новую эмоцию
    avatar.textContent = emotions[emotion] || emotions.default;
    avatar.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), font-size 0.4s ease';
    avatar.style.transform = 'scale(1.1) rotate(5deg)';
    avatar.style.fontSize = '45px';

    // Возврат в нормальное состояние (через 400 мс)
    setTimeout(() => {
        avatar.style.transition = 'transform 0.3s ease, font-size 0.3s ease';
        avatar.style.transform = 'scale(1) rotate(0deg)';
        avatar.style.fontSize = '40px';
    }, 400);

    // Возврат к сохранённому аватару (через duration)
    if (emotion !== 'default') {
        animationTimer = setTimeout(() => {
            const savedAvatar = localStorage.getItem('avatar') || '😊';
            avatar.textContent = savedAvatar;
            avatar.style.transform = 'scale(1) rotate(0deg)';
            avatar.style.fontSize = '40px';
            animationTimer = null;
        }, duration);
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