// frontend/js/shop.js

// =============================================
// 🛒 МАГАЗИН СКИНОВ
// =============================================

const SKINS = [
    { id: 1, emoji: '🐹', name: 'Мышь', price: 200 },
    { id: 2, emoji: '🐼', name: 'Панда', price: 250 },
    { id: 3, emoji: '💃', name: 'Танцор', price: 300 },
    { id: 4, emoji: '🦖', name: 'Динозавр', price: 350 },
    { id: 5, emoji: '🐙', name: 'Осьминог', price: 400 },
    { id: 6, emoji: '🛡️', name: 'Рыцарь', price: 450 },
    { id: 7, emoji: '🦜', name: 'Попугай', price: 500 },
    { id: 8, emoji: '👽', name: 'Пришелец', price: 550 },
];

let selectedSkin = null;
let userSkins = [];

// =============================================
// 🚀 ЗАГРУЗКА СТРАНИЦЫ
// =============================================

document.addEventListener('DOMContentLoaded', async function() {
    if (!checkAuth()) return;
    
    const user = getUserData();
    updateGold(user.gold);
    loadUserSkins();
    renderShop();
});

function updateGold(gold) {
    const el = document.getElementById('shopGold');
    if (el) el.textContent = gold || 0;
}

function loadUserSkins() {
    const saved = localStorage.getItem('userSkins');
    if (saved) {
        userSkins = JSON.parse(saved);
    } else {
        userSkins = [];
        localStorage.setItem('userSkins', JSON.stringify(userSkins));
    }
    
    const currentAvatar = localStorage.getItem('avatar');
    if (currentAvatar) {
        const currentSkin = SKINS.find(s => s.emoji === currentAvatar);
        selectedSkin = currentSkin ? currentSkin.id : null;
    } else {
        selectedSkin = null;
    }
}

function saveUserSkins() {
    localStorage.setItem('userSkins', JSON.stringify(userSkins));
}

// =============================================
// 🎨 ОТРИСОВКА МАГАЗИНА
// =============================================

function renderShop() {
    const grid = document.getElementById('shopGrid');
    if (!grid) {
        console.warn('❌ shopGrid не найден');
        return;
    }

    const user = getUserData();
    const gold = user.gold || 0;

    if (SKINS.length === 0) {
        grid.innerHTML = `
            <div class="shop-empty">
                <span class="emoji">🛒</span>
                <p>Скины временно недоступны</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = SKINS.map(skin => {
        const isOwned = userSkins.includes(skin.id);
        const isSelected = selectedSkin === skin.id;
        const canBuy = !isOwned && gold >= skin.price;
        const shortfall = skin.price - gold;

        let buttonText = '';
        let buttonClass = 'btn-buy';
        let disabled = true;
        let hintText = '';

        if (isOwned && isSelected) {
            buttonText = '✅ Выбран';
            buttonClass = 'btn-buy selected';
            disabled = true;
        } else if (isOwned) {
            buttonText = '📤 Выбрать';
            buttonClass = 'btn-buy owned';
            disabled = false;
        } else if (canBuy) {
            buttonText = `💵 ${skin.price}`;
            buttonClass = 'btn-buy';
            disabled = false;
        } else {
            buttonText = `💵 ${skin.price}`;
            buttonClass = 'btn-buy disabled';
            disabled = true;
            hintText = `Не хватает ${shortfall} 💵`;
        }

        return `
            <div class="shop-item ${isOwned ? 'owned' : ''} ${isSelected ? 'selected' : ''}">
                <span class="shop-item-emoji">${skin.emoji}</span>
                <div class="shop-item-name">${skin.name}</div>
                ${hintText ? `<div class="shop-item-hint">${hintText}</div>` : '<div class="shop-item-hint"></div>'}
                <button 
                    class="${buttonClass}" 
                    onclick="handleShopAction(${skin.id})"
                    ${disabled ? 'disabled' : ''}
                >
                    ${buttonText}
                </button>
            </div>
        `;
    }).join('');
}

// =============================================
// 🎯 ДЕЙСТВИЯ В МАГАЗИНЕ
// =============================================

async function handleShopAction(skinId) {
    const skin = SKINS.find(s => s.id === skinId);
    if (!skin) return;

    const isOwned = userSkins.includes(skinId);
    const user = getUserData();
    const gold = user.gold || 0;

    if (isOwned) {
        selectSkin(skinId);
        return;
    }

    if (gold < skin.price) {
        showMessage('❌ Недостаточно золота! Заработайте его, выполняя привычки.', 'error');
        return;
    }

    const confirmBuy = confirm(
        `🛒 Купить скин "${skin.name}" ${skin.emoji}?\n\n` +
        `Цена: 💵 ${skin.price}\n` +
        `Ваш баланс: 💵 ${gold}\n\n` +
        `После покупки у вас останется: 💵 ${gold - skin.price}`
    );

    if (!confirmBuy) return;

    try {
        userSkins.push(skinId);
        saveUserSkins();
        
        const newGold = gold - skin.price;
        localStorage.setItem('gold', newGold);
        
        updateGold(newGold);
        renderShop();
        
        showMessage(`✅ Скин "${skin.name}" успешно куплен!`, 'success');
        selectSkin(skinId);
        
    } catch (error) {
        showMessage('❌ Ошибка покупки: ' + error.message, 'error');
    }
}

// =============================================
// 🎨 ВЫБОР СКИНА (С СОХРАНЕНИЕМ В БД)
// =============================================

async function selectSkin(skinId) {
    const skin = SKINS.find(s => s.id === skinId);
    if (!skin) return;

    selectedSkin = skinId;
    localStorage.setItem('avatar', skin.emoji);
    
    try {
        await apiRequest('/user/update_avatar/', 'PATCH', {
            avatar_skin: skin.emoji
        });
        console.log('✅ Аватар сохранён на сервере:', skin.emoji);
    } catch (error) {
        console.warn('⚠️ Не удалось сохранить аватар на сервере:', error);
    }
    
    renderShop();
    updateAvatarOnDashboard(skin.emoji);
    showMessage(`✅ Скин "${skin.name}" выбран!`, 'success');
}

function updateAvatarOnDashboard(emoji) {
    const avatarElement = document.getElementById('characterAvatar');
    if (avatarElement) {
        avatarElement.textContent = emoji;
    }
}

// =============================================
// 💬 ПЛАВАЮЩИЕ УВЕДОМЛЕНИЯ (РАБОЧАЯ ВЕРСИЯ)
// =============================================

let messageTimeout = null;

function showMessage(text, type = 'info') {
    // Удаляем старые уведомления
    document.querySelectorAll('.shop-notification').forEach(el => el.remove());
    
    if (messageTimeout) {
        clearTimeout(messageTimeout);
        messageTimeout = null;
    }

    const colors = {
        success: '#2ecc71',
        error: '#e74c3c',
        info: '#3498db',
        warning: '#f39c12'
    };

    const notification = document.createElement('div');
    notification.className = 'shop-notification';
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
        transform: translateX(120%);
        opacity: 0;
        transition: transform 0.4s ease, opacity 0.4s ease;
    `;
    notification.textContent = text;
    document.body.appendChild(notification);
    
    // Принудительный рефлоу
    void notification.offsetHeight;
    
    // Появление
    notification.style.transform = 'translateX(0)';
    notification.style.opacity = '1';

    messageTimeout = setTimeout(() => {
        notification.style.transform = 'translateX(120%)';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 400);
        messageTimeout = null;
    }, 2500);
}

// =============================================
// 🔄 ОБНОВЛЕНИЕ ЗОЛОТА (из другой вкладки)
// =============================================

window.addEventListener('storage', function(e) {
    if (e.key === 'gold') {
        const newGold = parseInt(e.newValue) || 0;
        updateGold(newGold);
        renderShop();
    }
});