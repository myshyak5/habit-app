// frontend/js/habits.js

// Получить все привычки пользователя
async function getHabits() {
    return await apiRequest('/habits/', 'GET');
}

// Создать новую привычку
async function createHabit(name, description = '', xpReward = 10) {
    return await apiRequest('/habits/', 'POST', {
        name: name,
        description: description,
        xp_reward: xpReward,
    });
}

// Обновить привычку (отметить выполненной)
async function toggleHabit(habitId, completedDates) {
    return await apiRequest(`/habits/${habitId}/`, 'PATCH', {
        completed_dates: completedDates,
    });
}

// Удалить привычку
async function deleteHabit(habitId) {
    return await apiRequest(`/habits/${habitId}/`, 'DELETE');
}