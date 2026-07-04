async function registerUser(username, password, password2, email = '') {
    try {
        const data = await apiRequest('/register/', 'POST', {
            username: username,
            password: password,
            password2: password2,
            email: email,
        });
        localStorage.clear();
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('user_id', data.user_id);
        localStorage.setItem('level', data.level || 1);
        localStorage.setItem('experience', data.experience || 0);
        localStorage.setItem('gold', data.gold || 0);
        localStorage.setItem('avatar', data.avatar_skin || '😊');
        return data;
    } catch (error) {
        showNotification('❌ ' + handleApiError(error, 'Ошибка регистрации'), 'error');
        throw error;
    }
}

async function loginUser(username, password) {
    try {
        const data = await apiRequest('/login/', 'POST', {
            username: username,
            password: password,
        });
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('user_id', data.user_id);
        localStorage.setItem('level', data.level || 1);
        localStorage.setItem('experience', data.experience || 0);
        localStorage.setItem('gold', data.gold || 0);
        localStorage.setItem('avatar', data.avatar_skin || '😊');
        return data;
    } catch (error) {
        showNotification('❌ ' + handleApiError(error, 'Ошибка входа'), 'error');
        throw error;
    }
}

function logoutUser() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('user_id');
    localStorage.removeItem('level');
    localStorage.removeItem('experience');
    localStorage.removeItem('gold');
    localStorage.removeItem('avatar');
    window.location.href = 'login.html';
}

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function getUserData() {
    return {
        username: localStorage.getItem('username') || 'Пользователь',
        level: parseInt(localStorage.getItem('level')) || 1,
        experience: parseInt(localStorage.getItem('experience')) || 0,
        gold: parseInt(localStorage.getItem('gold')) || 0,
        avatar: localStorage.getItem('avatar') || '😊',
        userId: parseInt(localStorage.getItem('user_id')) || null,
        total_completed: parseInt(localStorage.getItem('total_completed')) || 0,
        xp_progress: parseFloat(localStorage.getItem('xp_progress')) || 0,
        xp_for_next_level: parseInt(localStorage.getItem('xp_for_next_level')) || 100,
        xp_remaining: parseInt(localStorage.getItem('xp_remaining')) || 0,
    };
}

function saveUserResources(userData) {
    localStorage.setItem('gold', userData.gold);
    localStorage.setItem('experience', userData.experience);
    localStorage.setItem('level', userData.level);
    localStorage.setItem('xp_progress', userData.xp_progress);
    localStorage.setItem('xp_for_next_level', userData.xp_for_next_level);
    localStorage.setItem('xp_remaining', userData.xp_remaining);
}

async function refreshUserData() {
    try {
        const userData = await apiRequest('/user/', 'GET');
        saveUserResources(userData);
        localStorage.setItem('avatar', userData.avatar_skin || '😊');
        localStorage.setItem('total_completed', userData.total_completed || 0);
        return userData;
    } catch (error) {
        console.warn('Не удалось обновить данные:', error);
        return getUserData();
    }
}

async function updateUserResources() {
    try {
        const userData = await apiRequest('/user/', 'GET');
        saveUserResources(userData);
        return userData;
    } catch (error) {
        console.warn('Не удалось обновить ресурсы:', error);
        return null;
    }
}