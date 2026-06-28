// frontend/js/utils.js

// Показать уведомление
function showNotification(message, type = 'info') {
    // Простая реализация через alert
    // В будущем можно заменить на красивое всплывающее окно
    alert(message);
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