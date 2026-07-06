import { apiRequest } from './api.js';
import store from './store.js';
import { CONFIG } from './constants.js';

async function registerUser(username, password, password2, email = '') {
    const data = await apiRequest('/register/', 'POST', { username, password, password2, email });
    localStorage.setItem('token', data.token);
    store.updateUser({
        id: data.user_id,
        username: data.username,
        level: data.level || 1,
        experience: data.experience || 0,
        gold: data.gold || 0,
        avatar: data.avatar_skin || CONFIG.DEFAULT_AVATAR
    });
    return data;
}

async function loginUser(username, password) {
    const data = await apiRequest('/login/', 'POST', { username, password });
    localStorage.setItem('token', data.token);
    store.updateUser({
        id: data.user_id,
        username: data.username,
        level: data.level || 1,
        experience: data.experience || 0,
        gold: data.gold || 0,
        avatar: data.avatar_skin || CONFIG.DEFAULT_AVATAR,
        xp_progress: data.xp_progress || 0,
        xp_for_next_level: data.xp_for_next_level || CONFIG.XP_PER_LEVEL,
        xp_remaining: data.xp_remaining || 0
    });
    return data;
}

function logoutUser() {
    store.clear();
    localStorage.clear();
    window.location.href = 'login.html';
}

function checkAuth() {
    if (!localStorage.getItem('token')) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function getUserData() {
    return store.getUser();
}

async function refreshUserData() {
    try {
        const data = await apiRequest('/user/', 'GET');
        store.updateUser({
            username: data.username,
            level: data.level,
            experience: data.experience,
            gold: data.gold,
            avatar: data.avatar_skin || '😊',
            xp_progress: data.xp_progress || 0,
            xp_for_next_level: data.xp_for_next_level || 100,
            xp_remaining: data.xp_remaining || 0
        });
        return data;
    } catch (e) {
        return store.getUser();
    }
}

async function updateUserResources() {
    return refreshUserData();
}

export { registerUser, loginUser, logoutUser, checkAuth, getUserData, refreshUserData, updateUserResources };