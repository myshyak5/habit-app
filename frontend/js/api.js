import { CONFIG } from './constants.js';

const API_URL = CONFIG.API_URL;

function getToken() {
    return localStorage.getItem('token');
}

function isNetworkError(error) {
    return error.message.includes('NetworkError') || 
           error.message.includes('Failed to fetch') ||
           error.message.includes('fetch') ||
           error.code === 'ECONNABORTED';
}

export class AuthError extends Error {
    constructor(message, status) {
        super(message);
        this.name = 'AuthError';
        this.status = status;
    }
}

export class ApiError extends Error {
    constructor(message, status, data) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

export async function apiRequest(endpoint, method = 'GET', data = null, retries = CONFIG.MAX_RETRIES) {
    const url = `${API_URL}${endpoint}`;
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) {
        headers['Authorization'] = `Token ${token}`;
    }
    
    const options = { method, headers };
    if (data && method !== 'GET' && method !== 'DELETE') {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        
        let result = null;
        const text = await response.text();
        if (text && text.trim() !== '') {
            try {
                result = JSON.parse(text);
            } catch (e) {
                if (response.ok) {
                    return { success: true, raw: text };
                }
                throw new Error('Сервер вернул некорректный ответ');
            }
        }

        if (!response.ok) {
            let errorMessage = 'Произошла ошибка';
            
            if (response.status === 401) {
                const isLoginPage = window.location.pathname.includes('login.html') || 
                                   window.location.pathname.includes('register.html') ||
                                   window.location.pathname === '/' ||
                                   window.location.pathname === '/index.html';
                
                if (!isLoginPage) {
                    throw new AuthError('Сессия истекла. Войдите снова.', 401);
                } else {
                    throw new AuthError('Неверный логин или пароль', 401);
                }
            }
            
            if (response.status === 403) throw new Error('Нет доступа');
            if (response.status === 404) throw new Error('Ресурс не найден');
            if (response.status === 500) throw new Error('Ошибка на сервере');
            
            if (result) {
                if (result.detail) errorMessage = result.detail;
                else if (result.error) errorMessage = result.error;
                else if (result.message) errorMessage = result.message;
                else if (typeof result === 'object') {
                    const firstKey = Object.keys(result)[0];
                    if (firstKey && Array.isArray(result[firstKey])) {
                        errorMessage = `${firstKey}: ${result[firstKey][0]}`;
                    }
                }
            }
            throw new ApiError(errorMessage, response.status, result);
        }

        return result || { success: true };
        
    } catch (error) {
        if (isNetworkError(error) && retries > 0) {
            await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
            return apiRequest(endpoint, method, data, retries - 1);
        }
        
        if (error instanceof AuthError || error instanceof ApiError) {
            throw error;
        }
        
        console.error('API Error:', error);
        throw new ApiError(error.message || 'Ошибка сети', 0);
    }
}