// frontend/js/api.js
const API_URL = 'http://127.0.0.1:8000/api';

// Получить токен из localStorage
function getToken() {
    return localStorage.getItem('token');
}

// Универсальная функция для запросов
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

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        const result = await response.json();

        if (!response.ok) {
            // Обработка ошибок от Django
            let errorMessage = 'Ошибка запроса';
            if (result.detail) {
                errorMessage = result.detail;
            } else if (result.error) {
                errorMessage = result.error;
            } else if (typeof result === 'object') {
                // Django часто возвращает { "field": ["error"] }
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