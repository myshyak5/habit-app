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

// Обновить информацию о пользователе
function updateUserInfo() {
    const user = getUserData();
    document.getElementById('usernameDisplay').textContent = user.username;
    document.getElementById('levelDisplay').textContent = user.level;
    document.getElementById('xpDisplay').textContent = user.experience;
    document.getElementById('goldDisplay').textContent = user.gold;
    
    const xpProgress = user.experience % 100;
    document.getElementById('xpProgress').style.width = xpProgress + '%';
    document.getElementById('xpProgressText').textContent = `${xpProgress}% до следующего уровня`;
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
        // Сначала получаем текущие привычки, чтобы обновить список дат
        const habits = await getHabits();
        const habit = habits.find(h => h.id === habitId);
        
        if (!habit) return;

        const today = new Date().toISOString().split('T')[0];
        let completedDates = habit.completed_dates || [];

        // Если сегодня уже выполнено — убираем, иначе — добавляем
        if (completedDates.includes(today)) {
            completedDates = completedDates.filter(date => date !== today);
        } else {
            completedDates.push(today);
        }

        await toggleHabit(habitId, completedDates);
        
        // Перезагружаем список привычек
        await loadHabits();
        
        // Обновляем информацию о пользователе (уровень, опыт могли измениться)
        // В идеале нужно перезапросить данные пользователя, но пока обновим из localStorage
        // TODO: Запросить /api/user/ для получения актуальных данных
        updateUserInfo();
        
    } catch (error) {
        showNotification('Ошибка: ' + error.message, 'error');
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