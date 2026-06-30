// frontend/js/shop.js

// =============================================
// 🛒 МАГАЗИН СКИНОВ
// =============================================

// Список доступных скинов
const SKINS = [
    { id: 1, emoji: '🐭', name: 'Мышь', price: 200 },
    { id: 2, emoji: '🐼', name: 'Панда', price: 250 },
    { id: 3, emoji: '💃', name: 'Танцор', price: 300 },
    { id: 4, emoji: '🦖', name: 'Динозавр', price: 350 },
    { id: 5, emoji: '🐙', name: 'Осьминог', price: 400 },
    { id: 6, emoji: '🛡️', name: 'Рыцарь', price: 450 },
    { id: 7, emoji: '🦜', name: 'Попугай', price: 500 },
    { id: 8, emoji: '👽', name: 'Пришелец', price: 550 },
];

// Текущий выбранный скин
let selectedSkin = null;
let userSkins = [];

// Загрузка страницы
document.addEventListener('DOMContentLoaded', async function() {
    if (!checkAuth()) return;
    
    const user = getUserData();
    updateGold(user.gold);
    loadUserSkins();
    renderShop();
});

function updateGold(gold) {
    document.getElementById('shopGold').textContent = gold || 0;
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
        selectedSkin = currentSkin ? currentSkin.id : null;  // ← НЕ ВЫБИРАЕМ ПЕРВЫЙ
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
            <div class="shop-item ${isOwned ? 'owned' : ''} ${isSelected ? 'selected' : ''}">
                <span class="shop-item-emoji">${skin.emoji}</span>
                <div class="shop-item-name">${skin.name}</div>
                ${hintText ? `<div class="shop-item-hint">${hintText}</div>` : ''}
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
    
    // 🔥 ОТПРАВЛЯЕМ НА СЕРВЕР
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

// 🔥 Обновление аватара на дашборде
function updateAvatarOnDashboard(emoji) {
    const avatarElement = document.getElementById('characterAvatar');
    if (avatarElement) {
        avatarElement.textContent = emoji;
    }
}

// =============================================
// 💬 СООБЩЕНИЯ
// =============================================

function showMessage(text, type = 'info') {
    const msg = document.getElementById('shopMessage');
    if (!msg) return;
    
    msg.style.display = 'block';
    msg.textContent = text;
    msg.style.background = type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#cce5ff';
    msg.style.color = type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#004085';
    msg.style.border = `1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#b8daff'}`;
    
    setTimeout(() => {
        msg.style.display = 'none';
    }, 3000);
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