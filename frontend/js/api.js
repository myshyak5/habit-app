const API_URL = 'http://127.0.0.1:8000/api';

function getToken() {
    return localStorage.getItem('token');
}

async function apiRequest(endpoint, method = 'GET', data = null) {
    const url = `${API_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
    };
    const token = getToken();
    if (token) {
        headers['Authorization'] = `Token ${token}`;
    }
    const options = {
        method: method,
        headers: headers,
    };

    if (data && method !== 'GET' && method !== 'DELETE') {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        const text = await response.text();
        
        if (!text || text.trim() === '') {
            if (response.ok) {
                return { success: true };
            }
            throw new Error('Сервер вернул пустой ответ');
        }
        
        let result;
        try {
            result = JSON.parse(text);
        } catch (jsonError) {
            if (response.ok) {
                return { success: true, raw: text };
            }
            throw new Error('Сервер вернул некорректный ответ');
        }

        if (!response.ok) {
            let errorMessage = 'Ошибка запроса';
            
            if (response.status === 401) {
                const isLoginPage = window.location.pathname.includes('login.html') || 
                                    window.location.pathname.includes('register.html');
                
                if (!isLoginPage) {
                    localStorage.removeItem('token');
                    window.location.href = 'login.html';
                    throw new Error('Сессия истекла. Войдите снова.');
                } else {
                    throw new Error('Неверный логин или пароль');
                }
            }
            
            if (response.status === 403) {
                throw new Error('Нет доступа к этому ресурсу.');
            }
            
            if (response.status === 404) {
                throw new Error('Ресурс не найден.');
            }
            
            if (response.status === 500) {
                throw new Error('Ошибка на сервере. Попробуйте позже.');
            }
            
            if (result.detail) errorMessage = result.detail;
            else if (result.error) errorMessage = result.error;
            else if (typeof result === 'object') {
                const firstKey = Object.keys(result)[0];
                if (firstKey && Array.isArray(result[firstKey])) {
                    errorMessage = `${firstKey}: ${result[firstKey][0]}`;
                }
            }
            throw new Error(errorMessage);
        }

        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}