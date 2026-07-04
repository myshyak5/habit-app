async function getHabits() {
    return await apiRequest('/habits/', 'GET');
}

async function createHabit(name, description = '', xpReward = 10) {
    return await apiRequest('/habits/', 'POST', {
        name: name,
        description: description,
        xp_reward: xpReward,
    });
}

async function toggleHabit(habitId, completedDates) {
    return await apiRequest(`/habits/${habitId}/`, 'PATCH', {
        completed_dates: completedDates,
    });
}

async function deleteHabit(habitId) {
    return await apiRequest(`/habits/${habitId}/`, 'DELETE');
}