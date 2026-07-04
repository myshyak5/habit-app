let notificationQueue = [];

function showNotification(message, type = 'info') {
    const colors = {
        success: '#2ecc71',
        error: '#e74c3c',
        info: '#3498db',
        warning: '#f39c12'
    };
    
    const notification = document.createElement('div');
    notification.className = 'notification-toast';
    notification.style.top = `${80 + notificationQueue.length * 62}px`;
    notification.style.background = colors[type] || colors.info;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    notificationQueue.push(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(30px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
            notificationQueue = notificationQueue.filter(n => n !== notification);
            updateNotificationPositions();
        }, 300);
    }, 2000);
}

function updateNotificationPositions() {
    notificationQueue.forEach((notif, index) => {
        notif.style.top = `${80 + index * 62}px`;
    });
}

function handleApiError(error, defaultMessage = 'Произошла ошибка') {
    console.error('API Error:', error);
    
    if (error.message.includes('Сессия') || error.message.includes('401')) {
        return 'Сессия истекла. Войдите снова.';
    }
    if (error.message.includes('Недостаточно золота')) {
        return 'Недостаточно золота.';
    }
    if (error.message.includes('интернет') || error.message.includes('fetch') || error.message.includes('NetworkError')) {
        return 'Проверьте подключение к интернету.';
    }
    if (error.message.includes('сервере') || error.message.includes('500')) {
        return 'Ошибка на сервере. Попробуйте позже.';
    }
    if (error.message.includes('не найдена') || error.message.includes('404')) {
        return 'Ресурс не найден.';
    }
    if (error.message.includes('доступ')) {
        return 'Нет доступа к этому ресурсу.';
    }
    
    return error.message || defaultMessage;
}