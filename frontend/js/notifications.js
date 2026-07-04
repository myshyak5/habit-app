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
    }, 1500);
}

function updateNotificationPositions() {
    notificationQueue.forEach((notif, index) => {
        notif.style.top = `${80 + index * 62}px`;
    });
}