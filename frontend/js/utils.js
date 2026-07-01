// frontend/js/utils.js

// Показать уведомление
// frontend/js/utils.js

function showNotification(message, type = 'info') {
    const colors = {
        success: '#2ecc71',
        error: '#e74c3c',
        info: '#3498db',
        warning: '#f39c12'
    };
    
    // Удаляем старые уведомления
    const oldNotifications = document.querySelectorAll('.notification');
    oldNotifications.forEach(el => el.remove());
    
    // Создаём новое уведомление
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 15px 25px;
        background: ${colors[type] || colors.info};
        color: white;
        border-radius: 10px;
        font-weight: 600;
        z-index: 9999;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        max-width: 400px;
        font-size: 14px;
        transform: translateX(120%);           /* ← Начало: за экраном справа */
        opacity: 0;
        transition: transform 0.4s ease, opacity 0.4s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Принудительный рефлоу (чтобы анимация сработала)
    void notification.offsetHeight;
    
    // Появление: выезжает слева
    notification.style.transform = 'translateX(0)';
    notification.style.opacity = '1';
    
    // Автоматическое скрытие через 2.5 секунды
    setTimeout(() => {
        // Уезжает вправо
        notification.style.transform = 'translateX(120%)';
        notification.style.opacity = '0';
        
        // Удаляем после анимации
        setTimeout(() => notification.remove(), 400);
    }, 2500);
}

// Форматирование даты
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Проверка, выполнена ли привычка сегодня
function isCompletedToday(completedDates) {
    if (!completedDates || !Array.isArray(completedDates) || completedDates.length === 0) {
        return false;
    }
    
    const today = new Date().toISOString().split('T')[0]; // '2024-01-15'
    return completedDates.includes(today);
}