document.addEventListener('DOMContentLoaded', async function() {
    if (!checkAuth()) return;
    
    await refreshUserData();
    updateUserInfo();
    await loadDailyQuests();
    await loadHabits();
});

let animationTimer = null;
let dailyQuestsData = [];
let dailyQuestsCompleted = false;
let bonusData = null;
let habitsCache = null;

async function loadDailyQuests() {
    try {
        const response = await apiRequest('/daily-quests/', 'GET');
        dailyQuestsData = response.quests_info || [];
        dailyQuestsCompleted = response.all_completed || false;
        bonusData = response.bonus || null;
        renderDailyQuests();
    } catch (error) {
        console.warn('Ежедневные задания недоступны:', error);
        renderDailyQuestsEmpty();
    }
}

function renderDailyQuests() {
    const container = document.getElementById('dailyQuestsList');
    if (!container) return;

    if (!dailyQuestsData || dailyQuestsData.length === 0) {
        renderDailyQuestsEmpty();
        return;
    }

    const allCompleted = dailyQuestsData.every(q => q.completed);

    container.innerHTML = dailyQuestsData.map(quest => {
        const progress = quest.progress || 0;
        const target = quest.target || 1;
        const percent = Math.min((progress / target) * 100, 100);
        const isCompleted = quest.completed || false;

        return `
            <div class="daily-quest-item ${isCompleted ? 'completed' : ''}">
                <div class="quest-name">${quest.name}</div>
                <div class="quest-description">${quest.description}</div>
                <div class="quest-progress">
                    <div class="quest-progress-bar">
                        <div class="quest-progress-fill" style="width: ${percent}%;"></div>
                    </div>
                    <span class="quest-progress-text">${progress}/${target}</span>
                </div>
                <div class="quest-reward-wrapper">
                    <div class="quest-reward">+${quest.reward_gold} 💰 +${quest.reward_xp} XP</div>
                    <div class="quest-status">${isCompleted ? '✅' : '⏳'}</div>
                </div>
            </div>
        `;
    }).join('');

    if (allCompleted && dailyQuestsData.length > 0) {
        const bonusGold = bonusData?.gold || 25;
        const bonusXp = bonusData?.xp || 50;
        const allRewarded = bonusData?.all_rewarded || false;
        
        container.innerHTML += `
            <div class="quest-bonus">
                Все задания выполнены!
                <br>
                <span class="quest-bonus-text">
                    +${bonusGold} 💰 +${bonusXp} XP ${allRewarded ? '✅' : ''}
                </span>
            </div>
        `;
    }
}

function renderDailyQuestsEmpty() {
    const container = document.getElementById('dailyQuestsList');
    if (!container) return;
    
    container.innerHTML = `
        <div class="quest-empty">📋 Ежедневные задания будут доступны позже</div>
    `;
}

function checkLevelUp(oldLevel, newLevel, goldReward = 0) {
    if (newLevel > oldLevel) {
        animateCharacter('levelUp', 2500);
        setTimeout(() => showConfetti(), 300);
        setTimeout(() => showConfetti(), 700);
        let message = `🎉 Уровень повышен до ${newLevel}!`;
        if (goldReward > 0) {
            message += ` +${goldReward} 💰`;
        }
        showNotification(message, 'success');
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

async function loadHabits() {
    const habitsList = document.getElementById('habitsList');

    try {
        let habits;
        if (habitsCache) {
            habits = habitsCache;
        } else {
            habits = await getHabits();
            habitsCache = habits;
        }

        if (!habits || habits.length === 0) {
            habitsList.innerHTML = `
                <div class="empty-state">
                    <p>😴 У вас пока нет привычек</p>
                    <p style="font-size:14px;">Нажмите кнопку выше, чтобы добавить первую</p>
                </div>
            `;
            return;
        }

        habitsList.innerHTML = habits.map(habit => {
            const completed = habit.is_completed_today;
            return `
                <div class="habit-item" data-id="${habit.id}">
                    <div class="habit-info">
                        <input 
                            type="checkbox" 
                            class="habit-checkbox" 
                            ${completed ? 'checked' : ''}
                            onchange="toggleHabitHandler(${habit.id})"
                        />
                        <span class="habit-name">${habit.name}</span>
                        ${habit.description ? `<span class="habit-description">${habit.description}</span>` : ''}
                    </div>
                    <div class="habit-rewards">
                        <span class="habit-reward">+${habit.gold_reward} 💰</span>
                        <span class="habit-reward">+${habit.xp_reward} XP</span>
                        <button 
                            onclick="deleteHabitHandler(${habit.id})" 
                            class="habit-delete-btn"
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
    
    const progressPercent = user.xp_progress || 0;
    const xpForNextLevel = user.xp_for_next_level || 100;
    const xpRemaining = user.xp_remaining || 0;
    const xpOnLevel = xpForNextLevel - xpRemaining;
    
    const progressFill = document.getElementById('xpProgress');
    const percentSpan = document.querySelector('.progress-percent');
    if (progressFill) {
        progressFill.style.width = Math.min(progressPercent, 100) + '%';
        if (percentSpan) {
            percentSpan.textContent = Math.round(progressPercent) + '%';
        }
    }
    
    const tooltipCurrent = document.getElementById('tooltipCurrentXP');
    if (tooltipCurrent) {
        tooltipCurrent.textContent = Math.round(xpOnLevel);
    }
    const tooltipTotal = document.getElementById('tooltipTotalXP');
    if (tooltipTotal) {
        tooltipTotal.textContent = xpForNextLevel;
    }
    const progressText = document.getElementById('xpProgressText');
    if (progressText) {
        progressText.textContent = `До уровня ${user.level + 1} осталось ${Math.round(xpRemaining)} XP`;
    }
    
    document.getElementById('characterAvatar').textContent = user.avatar || '😊';
    localStorage.setItem('oldLevel', user.level);
}

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
        const isCurrentlyCompleted = completed_dates.includes(today);
        
        if (isCurrentlyCompleted) {
            completed_dates = completed_dates.filter(date => date !== today);
        } else {
            completed_dates.push(today);
        }

        const response = await toggleHabit(habitId, completed_dates);
        const checkbox = document.querySelector(`.habit-item[data-id="${habitId}"] .habit-checkbox`);
        if (checkbox) {
            checkbox.checked = !isCurrentlyCompleted;
        }
        habitsCache = null;
        await updateUserResources();
        updateUserInfo();
        loadDailyQuests();

        if (response.level_up && response.level_up.new_level > response.level_up.old_level) {
            checkLevelUp(
                response.level_up.old_level,
                response.level_up.new_level,
                response.level_up.gold_reward,
                response.level_up.xp_reward
            );
        }
        
        if (!isCurrentlyCompleted) {
            animateCharacter('veryHappy', 800);
            showNotification(`✅ Привычка выполнена! +${habit.xp_reward} XP, +${habit.gold_reward} 💰`, 'success');
        } else {
            animateCharacter('sad', 800);
            showNotification('⏳ Привычка отменена', 'info');
        }
    } catch (error) {
        showNotification('❌ ' + handleApiError(error, 'Ошибка при отметке привычки'), 'error');
        await loadHabits();
    }
}

async function deleteHabitHandler(habitId) {
    if (!confirm('🗑️ Вы уверены, что хотите удалить эту привычку?')) return;

    try {
        await deleteHabit(habitId);
        habitsCache = null;
        await updateUserResources();
        updateUserInfo();
        await loadDailyQuests();
        showNotification('✅ Привычка удалена!', 'success');
    } catch (error) {
        showNotification('❌ ' + handleApiError(error, 'Ошибка при удалении привычки'), 'error');
    }
}

function animateCharacter(emotion = 'happy', duration = 800) {
    const avatar = document.getElementById('characterAvatar');
    if (!avatar) return;

    if (animationTimer) {
        clearTimeout(animationTimer);
        animationTimer = null;
    }

    const emotions = {
        veryHappy: '🤩',
        levelUp: '🥳',
        sad: '😢',
        default: localStorage.getItem('avatar') || '😊'
    };
    avatar.textContent = emotions[emotion] || emotions.default;
    avatar.style.transition = 'transform 0.3s ease';
    avatar.style.transform = 'rotate(-10deg) scale(1.1)';
    setTimeout(() => {
        avatar.style.transform = 'rotate(10deg) scale(1.1)';
    }, 200);
    setTimeout(() => {
        avatar.style.transform = 'rotate(0deg) scale(1)';
    }, 500);

    if (emotion !== 'default') {
        animationTimer = setTimeout(() => {
            const savedAvatar = localStorage.getItem('avatar') || '😊';
            avatar.textContent = savedAvatar;
            avatar.style.transform = 'scale(1) rotate(0deg)';
            animationTimer = null;
        }, duration);
    }
}

function showConfetti() {
    const symbols = ['✦', '✧', '⭐', '✨', '❄️', '💫'];
    const colors = ['#ffd93d', '#ff6b6b', '#48dbfb', '#ff9ff3', '#54a0ff', '#feca57'];
    
    for (let i = 0; i < 20; i++) {
        const el = document.createElement('div');
        el.className = 'confetti-piece';
        el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        el.style.left = Math.random() * 100 + 'vw';
        el.style.fontSize = Math.random() * 18 + 18 + 'px';
        el.style.color = colors[Math.floor(Math.random() * colors.length)];
        el.style.animation = `confettiFall ${Math.random() * 2 + 1.5}s linear forwards`;
        el.style.animationDelay = Math.random() * 0.5 + 's';
        el.style.opacity = '0';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 3500);
    }
}

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
        habitsCache = null;
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