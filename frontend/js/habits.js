import { apiRequest } from './api.js';

export async function getHabits() {
    return await apiRequest('/habits/', 'GET');
}

export async function getAllHabits() {
    return await apiRequest('/habits/all/', 'GET');
}

export async function createHabit(name, description = '', xpReward = 10) {
    return await apiRequest('/habits/', 'POST', {
        name: name,
        description: description,
        xp_reward: xpReward,
    });
}

export async function toggleHabit(habitId, completedDates) {
    return await apiRequest(`/habits/${habitId}/`, 'PATCH', {
        completed_dates: completedDates,
    });
}

export async function deleteHabit(habitId) {
    return await apiRequest(`/habits/${habitId}/`, 'DELETE');
}