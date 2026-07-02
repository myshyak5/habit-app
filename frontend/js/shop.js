// frontend/js/shop.js

const SKINS = [
    { id: 1, emoji: '🐹', name: 'Хомяк', price: 200 },
    { id: 2, emoji: '🐼', name: 'Панда', price: 400 },
    { id: 3, emoji: '💃', name: 'Танцор', price: 600 },
    { id: 4, emoji: '🦖', name: 'Динозавр', price: 800 },
    { id: 5, emoji: '🐙', name: 'Осьминог', price: 1000 },
    { id: 6, emoji: '🛡️', name: 'Рыцарь', price: 1200 },
    { id: 7, emoji: '🦜', name: 'Попугай', price: 1300 },
    { id: 8, emoji: '👽', name: 'Пришелец', price: 1500 },
];

let selectedSkin = null;
let userSkins = [];

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

async function loadUserSkins() {
    try {
        const user = await apiRequest('/user/', 'GET');
        userSkins = user.owned_skins || [];
        const currentAvatar = user.avatar_skin || '😊';
        const currentSkin = SKINS.find(s => s.emoji === currentAvatar);
        selectedSkin = currentSkin ? currentSkin.id : null;
    } catch (error) {
        console.warn('Не удалось загрузить скины с сервера:', error);
        userSkins = [];
        selectedSkin = null;
    }
}

function renderShop() {
    const grid = document.getElementById('shopGrid');
    if (!grid) return;

    const user = getUserData();
    const gold = user.gold || 0;

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
            <div class="shop-item ${isOwned ? 'owned' : ''} ${isSelected ? 'selected' : ''}" data-id="${skin.id}">
                <span class="shop-item-emoji">${skin.emoji}</span>
                <div class="shop-item-name">${skin.name}</div>
                ${hintText ? `<div class="shop-item-hint">${hintText}</div>` : '<div class="shop-item-hint"></div>'}
                <button class="${buttonClass}" onclick="handleShopAction(${skin.id})" ${disabled ? 'disabled' : ''}>
                    ${buttonText}
                </button>
            </div>
        `;
    }).join('');
}

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
        showMessage('❌ Недостаточно золота!', 'error');
        return;
    }

    if (!confirm(`🛒 Купить скин "${skin.name}" ${skin.emoji}?\nЦена: 💵 ${skin.price}\nВаш баланс: 💵 ${gold}`)) return;

    try {
        const response = await apiRequest(`/skins/${skinId}/buy/`, 'POST');
        await refreshUserData();
        await loadUserSkins();
        
        updateGold(response.gold_left);
        updateShopSelection(skinId);
        updateAvatarOnDashboard(skin.emoji);
        
        showMessage(`✅ Скин "${skin.name}" куплен!`, 'success');
        selectSkin(skinId);
        
    } catch (error) {
        showMessage('❌ Ошибка покупки: ' + error.message, 'error');
    }
}
async function selectSkin(skinId) {
    const skin = SKINS.find(s => s.id === skinId);
    if (!skin) return;

    selectedSkin = skinId;
    localStorage.setItem('avatar', skin.emoji);
    
    try {
        await apiRequest('/user/update_avatar/', 'PATCH', { avatar_skin: skin.emoji });
    } catch (error) {
        console.warn('⚠️ Не удалось сохранить аватар на сервере:', error);
    }
    
    updateShopSelection(skinId);
    updateAvatarOnDashboard(skin.emoji);
    showMessage(`✅ Скин "${skin.name}" выбран!`, 'success');
}

// =============================================
// 🔄 ОБНОВЛЕНИЕ ТОЛЬКО ВЫБРАННОГО СКИНА
// =============================================

function updateShopSelection(skinId) {
    // 1. Снимаем выделение со ВСЕХ карточек
    document.querySelectorAll('.shop-item').forEach(item => {
        const itemId = parseInt(item.dataset.id);
        const isOwned = userSkins.includes(itemId);
        const btn = item.querySelector('.btn-buy');
        
        item.classList.remove('selected');
        
        if (btn) {
            btn.classList.remove('selected');
            
            if (isOwned && itemId !== skinId) {
                btn.textContent = '📤 Выбрать';
                btn.className = 'btn-buy owned';
                btn.disabled = false;
            } else if (!isOwned && itemId !== skinId) {
                const skin = SKINS.find(s => s.id === itemId);
                if (skin) {
                    const gold = getUserData().gold || 0;
                    const canBuy = gold >= skin.price;
                    btn.textContent = `💵 ${skin.price}`;
                    btn.className = canBuy ? 'btn-buy' : 'btn-buy disabled';
                    btn.disabled = !canBuy;
                }
            }
        }
    });
    
    // 2. Подсвечиваем ВЫБРАННУЮ карточку
    const selectedItem = document.querySelector(`.shop-item[data-id="${skinId}"]`);
    if (selectedItem) {
        selectedItem.classList.add('selected');
        const btn = selectedItem.querySelector('.btn-buy');
        if (btn) {
            btn.classList.add('selected');
            btn.textContent = '✅ Выбран';
            btn.disabled = true;
        }
    }
}

function updateAvatarOnDashboard(emoji) {
    const avatarElement = document.getElementById('characterAvatar');
    if (avatarElement) avatarElement.textContent = emoji;
}

// ===== УВЕДОМЛЕНИЯ =====
let messageTimeout = null;

function showMessage(text, type = 'info') {
    document.querySelectorAll('.shop-notification').forEach(el => el.remove());
    if (messageTimeout) clearTimeout(messageTimeout);

    const colors = { success: '#2ecc71', error: '#e74c3c', info: '#3498db', warning: '#f39c12' };
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
    void notification.offsetHeight;
    notification.style.transform = 'translateX(0)';
    notification.style.opacity = '1';

    messageTimeout = setTimeout(() => {
        notification.style.transform = 'translateX(120%)';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 400);
        messageTimeout = null;
    }, 2500);
}

window.addEventListener('storage', function(e) {
    if (e.key === 'gold') {
        updateGold(parseInt(e.newValue) || 0);
        renderShop();
    }
});