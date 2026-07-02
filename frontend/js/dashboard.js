// frontend/js/dashboard.js

// Загрузка дашборда
document.addEventListener('DOMContentLoaded', async function() {
    if (!checkAuth()) return;
    
    await refreshUserData();
    updateUserInfo();
    
    // 🔥 ЗАГРУЖАЕМ ЕЖЕДНЕВНЫЕ ЗАДАНИЯ С БЭКЕНДА
    await loadDailyQuests();
    
    await loadHabits();
});

// frontend/js/dashboard.js

// =============================================
// 📋 ЕЖЕДНЕВНЫЕ ЗАДАНИЯ (ТОЛЬКО БЭКЕНД)
// =============================================

const DAILY_QUESTS = [
    { id: 1, name: '💪 Выполнить 3 привычки', description: 'Отметь 3 любые привычки сегодня', target: 3, rewardGold: 10, rewardXp: 20 },
    { id: 2, name: '📚 Выполнить сложную привычку', description: 'Выполни привычку с наградой 40+ XP', target: 1, rewardGold: 15, rewardXp: 30 },
    { id: 3, name: '🔥 Серия из 5 привычек', description: 'Выполни 5 привычек подряд без пропусков', target: 5, rewardGold: 20, rewardXp: 40 },
];

let dailyQuestsProgress = {};
let dailyQuestsCompleted = false;

// =============================================
// 📥 ЗАГРУЗКА ПРОГРЕССА С БЭКЕНДА
// =============================================

async function loadDailyQuests() {
    try {
        const response = await apiRequest('/daily-quests/', 'GET');
        
        dailyQuestsProgress = {
            [DAILY_QUESTS[0].id]: response.quest_1_progress || 0,
            [DAILY_QUESTS[1].id]: response.quest_2_progress || 0,
            [DAILY_QUESTS[2].id]: response.quest_3_progress || 0,
        };
        dailyQuestsCompleted = response.all_completed || false;
        
        renderDailyQuests();
    } catch (error) {
        // ❌ НЕ СОЗДАЁМ ЛОКАЛЬНЫЕ ЗАДАНИЯ
        console.warn('⚠️ Ежедневные задания недоступны (бэкенд не готов):', error);
        dailyQuestsProgress = {};
        dailyQuestsCompleted = false;
        // Показываем пустой блок
        renderDailyQuestsEmpty();
    }
}

// =============================================
// 📤 ОБНОВЛЕНИЕ ПРОГРЕССА НА БЭКЕНДЕ
// =============================================

async function updateQuestProgress(habitXp, isCompleted = true) {
    try {
        const response = await apiRequest('/daily-quests/update/', 'POST', {
            habit_xp: habitXp,
            is_completed: isCompleted
        });
        
        dailyQuestsProgress = {
            [DAILY_QUESTS[0].id]: response.quest_1_progress || 0,
            [DAILY_QUESTS[1].id]: response.quest_2_progress || 0,
            [DAILY_QUESTS[2].id]: response.quest_3_progress || 0,
        };
        dailyQuestsCompleted = response.all_completed || false;
        
        renderDailyQuests();
        
        if (response.rewarded && response.all_completed) {
            showNotification('🎉 Все ежедневные задания выполнены!', 'success');
            await refreshUserData();
            updateUserInfo();
        }
        
        return response;
    } catch (error) {
        // ❌ НЕ СОЗДАЁМ ЛОКАЛЬНЫЕ ЗАДАНИЯ
        console.warn('⚠️ Не удалось обновить прогресс заданий:', error);
        // Просто игнорируем — задания не появятся локально
    }
}

// =============================================
// 🎨 ОТРИСОВКА ЕЖЕДНЕВНЫХ ЗАДАНИЙ
// =============================================

function renderDailyQuests() {
    const container = document.getElementById('dailyQuestsList');
    if (!container) return;

    // Если нет данных — показываем пустой блок
    if (Object.keys(dailyQuestsProgress).length === 0) {
        renderDailyQuestsEmpty();
        return;
    }

    const quests = DAILY_QUESTS.map(quest => ({
        ...quest,
        progress: dailyQuestsProgress[quest.id] || 0,
        completed: dailyQuestsCompleted || dailyQuestsProgress[quest.id] >= quest.target
    }));

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

// =============================================
// 🎨 ПУСТОЙ БЛОК (КОГДА БЭКЕНД НЕ ДОСТУПЕН)
// =============================================

function renderDailyQuestsEmpty() {
    const container = document.getElementById('dailyQuestsList');
    if (!container) return;
    
    container.innerHTML = `
        <div style="text-align:center;color:#999;padding:10px;font-size:13px;">
            📋 Ежедневные задания будут доступны позже
        </div>
    `;
}

// =============================================
// 🔥 ПРОВЕРКА ПОВЫШЕНИЯ УРОВНЯ
// =============================================

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
            const goldReward = Math.floor(xpReward / 2);
            
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

// =============================================
// 📊 ОБНОВЛЕНИЕ ИНФОРМАЦИИ О ПОЛЬЗОВАТЕЛЕ
// =============================================

function updateUserInfo() {
    const user = getUserData();
    const oldLevel = parseInt(localStorage.getItem('oldLevel')) || user.level;
    
    // ---- 1. БАЗОВЫЕ ДАННЫЕ ----
    document.getElementById('usernameDisplay').textContent = user.username;
    document.getElementById('levelDisplay').textContent = user.level;
    document.getElementById('xpDisplay').textContent = user.experience;
    document.getElementById('goldDisplay').textContent = user.gold;
    
    // ---- 2. ПРОГРЕСС-БАР (БЕРЁМ ГОТОВЫЕ ДАННЫЕ С СЕРВЕРА) ----
    const progressPercent = user.xp_progress || 0;
    const xpForNextLevel = user.xp_for_next_level || 100;
    const xpRemaining = user.xp_remaining || 0;
    const xpOnLevel = user.experience - (xpForNextLevel - xpRemaining);
    
    // ---- 3. ОБНОВЛЯЕМ ПРОГРЕСС-БАР ----
    const progressFill = document.getElementById('xpProgress');
    const percentSpan = document.querySelector('.progress-percent');
    if (progressFill) {
        progressFill.style.width = Math.min(progressPercent, 100) + '%';
        if (percentSpan) {
            percentSpan.textContent = Math.round(progressPercent) + '%';
        }
    }
    
    // ---- 4. ОБНОВЛЯЕМ ПОДСКАЗКУ ----
    const tooltipCurrent = document.getElementById('tooltipCurrentXP');
    const tooltipTotal = document.getElementById('tooltipTotalXP');
    if (tooltipCurrent) {
        tooltipCurrent.textContent = Math.round(xpOnLevel);
    }
    if (tooltipTotal) {
        tooltipTotal.textContent = xpForNextLevel;
    }
    
    // ---- 5. ОБНОВЛЯЕМ ТЕКСТ ----
    const progressText = document.getElementById('xpProgressText');
    if (progressText) {
        progressText.textContent = `До уровня ${user.level + 1} осталось ${Math.round(xpRemaining)} XP`;
    }
    
    // ---- 6. АВАТАРКА ----
    const avatarElement = document.getElementById('characterAvatar');
    if (avatarElement) {
        avatarElement.textContent = user.avatar || '😊';
    }
    
    // ---- 7. ПРОВЕРКА УРОВНЯ ----
    checkLevelUp(oldLevel, user.level);
    localStorage.setItem('oldLevel', user.level);
}

// =============================================
// 🔄 ОБНОВЛЕНИЕ ДАННЫХ С СЕРВЕРА
// =============================================

async function refreshUserData() {
    try {
        const userData = await apiRequest('/user/', 'GET');
        
        // 🔥 СОХРАНЯЕМ ВСЕ ДАННЫЕ С СЕРВЕРА
        localStorage.setItem('level', userData.level);
        localStorage.setItem('experience', userData.experience);
        localStorage.setItem('gold', userData.gold);
        localStorage.setItem('avatar', userData.avatar_skin || '😊');
        
        // 🔥 СОХРАНЯЕМ ДАННЫЕ ДЛЯ ПРОГРЕСС-БАРА
        localStorage.setItem('xp_progress', userData.xp_progress);
        localStorage.setItem('xp_for_next_level', userData.xp_for_next_level);
        localStorage.setItem('xp_remaining', userData.xp_remaining);
        
        return userData;
    } catch (error) {
        console.warn('Не удалось обновить данные с сервера, используем локальные');
        return getUserData();
    }
}

// =============================================
// 📦 ПОЛУЧЕНИЕ ДАННЫХ ИЗ LOCALSTORAGE
// =============================================

function getUserData() {
    return {
        username: localStorage.getItem('username') || 'Пользователь',
        level: parseInt(localStorage.getItem('level')) || 1,
        experience: parseInt(localStorage.getItem('experience')) || 0,
        gold: parseInt(localStorage.getItem('gold')) || 0,
        avatar: localStorage.getItem('avatar') || '😊',
        userId: parseInt(localStorage.getItem('user_id')) || null,
        xp_progress: parseFloat(localStorage.getItem('xp_progress')) || 0,
        xp_for_next_level: parseInt(localStorage.getItem('xp_for_next_level')) || 100,
        xp_remaining: parseInt(localStorage.getItem('xp_remaining')) || 0,
    };
}

// =============================================
// 🎯 ОБРАБОТЧИКИ ПРИВЫЧЕК
// =============================================

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
            const xpReward = habit.xp_reward || 10;
            const goldReward = Math.floor(xpReward / 2);
            showNotification(`✅ Привычка выполнена! +${xpReward} XP, +${goldReward} 💵`, 'success');
            
            // ❌ НЕ ВЫЗЫВАЕМ updateQuestProgress, ПОКА НЕТ БЭКЕНДА
            // await updateQuestProgress(habit.xp_reward, true);
            // renderDailyQuests();
        } else {
            animateCharacter('sad', 1500);
            showNotification('⏳ Привычка отменена', 'info');
            
            // ❌ НЕ ВЫЗЫВАЕМ updateQuestProgress, ПОКА НЕТ БЭКЕНДА
            // await updateQuestProgress(habit.xp_reward, false);
            // renderDailyQuests();
        }
    } catch (error) {
        console.error('Ошибка отметки привычки:', error);
        showNotification('❌ Ошибка: ' + error.message, 'error');
        await loadHabits();
    }
}

async function deleteHabitHandler(habitId) {
    if (!confirm('🗑️ Вы уверены, что хотите удалить эту привычку?')) return;

    try {
        await deleteHabit(habitId);
        
        await refreshUserData();
        await loadHabits();
        updateUserInfo();
        
        // 🔥 ПЕРЕЗАГРУЖАЕМ ЕЖЕДНЕВНЫЕ ЗАДАНИЯ С БЭКЕНДА
        await loadDailyQuests();
        
        showNotification('✅ Привычка удалена!', 'success');
        
    } catch (error) {
        console.error('Ошибка удаления:', error);
        showNotification('❌ Ошибка: ' + error.message, 'error');
    }
}

// =============================================
// 🔥 АНИМАЦИИ
// =============================================

let animationTimer = null;

function animateCharacter(emotion = 'happy', duration = 1500) {
    const avatar = document.getElementById('characterAvatar');
    if (!avatar) return;

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

    avatar.style.transition = 'none';
    avatar.style.transform = 'scale(1)';
    avatar.style.fontSize = '40px';
    void avatar.offsetHeight;

    avatar.textContent = emotions[emotion] || emotions.default;
    avatar.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), font-size 0.4s ease';
    avatar.style.transform = 'scale(1.1) rotate(5deg)';
    avatar.style.fontSize = '45px';

    setTimeout(() => {
        avatar.style.transition = 'transform 0.3s ease, font-size 0.3s ease';
        avatar.style.transform = 'scale(1) rotate(0deg)';
        avatar.style.fontSize = '40px';
    }, 400);

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

// =============================================
// 🪟 МОДАЛЬНОЕ ОКНО
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
        showNotification(`✅ Привычка "${name}" создана!`, 'success');
    } catch (error) {
        showNotification('❌ Ошибка: ' + error.message, 'error');
    }
});

document.getElementById('addHabitBtn')?.addEventListener('click', function() {
    openHabitModal();
});

document.getElementById('addHabitModal')?.addEventListener('click', function(e) {
    if (e.target === this) {
        closeHabitModal();
    }
});