// frontend/js/notifications.js

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
    notification.style.cssText = `
        position: fixed;
        top: ${80 + notificationQueue.length * 62}px;
        right: 20px;
        padding: 14px 24px;
        background: ${colors[type] || colors.info};
        color: white;
        border-radius: 10px;
        font-weight: 500;
        z-index: 9999;
        box-shadow: 0 4px 14px rgba(0,0,0,0.15);
        max-width: 400px;
        font-size: 15px;
        animation: slideIn 0.3s ease;
        transform: translateX(0);
        opacity: 1;
        transition: all 0.3s ease;
    `;
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