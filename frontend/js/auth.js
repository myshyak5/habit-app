// frontend/js/auth.js

// Регистрация
async function registerUser(username, password, password2, email = '') {
    const data = await apiRequest('/register/', 'POST', {
        username: username,
        password: password,
        password2: password2,
        email: email,
    });

    // Сохраняем данные в localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    localStorage.setItem('user_id', data.user_id);
    if (data.level) localStorage.setItem('level', data.level);
    if (data.experience) localStorage.setItem('experience', data.experience);
    if (data.gold) localStorage.setItem('gold', data.gold);
    
    // 🔥 ДОБАВЛЯЕМ СОХРАНЕНИЕ АВАТАРА
    localStorage.setItem('avatar', data.avatar_skin || '😊');

    return data;
}

// Вход
async function loginUser(username, password) {
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
    
    // 🔥 ДОБАВЛЯЕМ СОХРАНЕНИЕ АВАТАРА
    localStorage.setItem('avatar', data.avatar_skin || '😊');

    return data;
}

// Выход
function logoutUser() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('user_id');
    localStorage.removeItem('level');
    localStorage.removeItem('experience');
    localStorage.removeItem('gold');
    localStorage.removeItem('avatar');  // 🔥 ДОБАВЛЯЕМ УДАЛЕНИЕ АВАТАРА
    window.location.href = 'login.html';
}

// Проверка авторизации
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Получить данные пользователя из localStorage
function getUserData() {
    return {
        username: localStorage.getItem('username') || 'Пользователь',
        level: parseInt(localStorage.getItem('level')) || 1,
        experience: parseInt(localStorage.getItem('experience')) || 0,
        gold: parseInt(localStorage.getItem('gold')) || 0,
        avatar: localStorage.getItem('avatar') || '😊',
        userId: parseInt(localStorage.getItem('user_id')) || null,
    };
}