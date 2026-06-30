// frontend/js/shop.js

// =============================================
// 🛒 МАГАЗИН СКИНОВ
// =============================================

// Список доступных скинов
const SKINS = [
    { id: 1, emoji: '😊', name: 'Улыбка', price: 0 },
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
    
    // Загружаем данные пользователя
    const user = getUserData();
    updateGold(user.gold);
    
    // Загружаем скины пользователя (из localStorage или сервера)
    loadUserSkins();
    
    // Рендерим магазин
    renderShop();
});

// Обновить отображение золота
function updateGold(gold) {
    document.getElementById('shopGold').textContent = gold || 0;
}

// Загрузить скины пользователя
function loadUserSkins() {
    // Пока храним в localStorage
    const saved = localStorage.getItem('userSkins');
    if (saved) {
        userSkins = JSON.parse(saved);
    } else {
        // По умолчанию у всех есть первый скин (бесплатный)
        userSkins = [SKINS[0].id];
        localStorage.setItem('userSkins', JSON.stringify(userSkins));
    }
    
    // Текущий выбранный скин
    const currentAvatar = localStorage.getItem('avatar') || '😊';
    const currentSkin = SKINS.find(s => s.emoji === currentAvatar);
    selectedSkin = currentSkin ? currentSkin.id : SKINS[0].id;
}

// Сохранить скины пользователя
function saveUserSkins() {
    localStorage.setItem('userSkins', JSON.stringify(userSkins));
}

// =============================================
// 🎨 ОТРИСОВКА МАГАЗИНА
// =============================================

// frontend/js/shop.js

// frontend/js/shop.js

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
            buttonText = `💵 ${skin.price}`;      // ← ЗДЕСЬ
            buttonClass = 'btn-buy';
            disabled = false;
        } else {
            buttonText = `💵 ${skin.price}`;      // ← И ЗДЕСЬ
            buttonClass = 'btn-buy disabled';
            disabled = true;
            hintText = `Не хватает ${shortfall}💵`;  // ← И ЗДЕСЬ
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

    // Если скин уже куплен — выбираем его
    if (isOwned) {
        selectSkin(skinId);
        return;
    }

    // Если недостаточно золота
    if (gold < skin.price) {
        showMessage('❌ Недостаточно золота! Заработайте его, выполняя привычки.', 'error');
        return;
    }

    // Подтверждение покупки
    const confirmBuy = confirm(
        `🛒 Купить скин "${skin.name}" ${skin.emoji}?\n\n` +
        `Цена: 🪙 ${skin.price}\n` +
        `Ваш баланс: 💵 ${gold}\n\n` +
        `После покупки у вас останется: 🪙 ${gold - skin.price}`
    );

    if (!confirmBuy) return;

    // Пытаемся купить
    try {
        // Отправляем запрос на сервер (если есть API)
        // await apiRequest('/shop/buy/', 'POST', { skin_id: skinId });
        
        // Локальное сохранение (пока нет бэкенда)
        userSkins.push(skinId);
        saveUserSkins();
        
        // Списываем золото
        const newGold = gold - skin.price;
        localStorage.setItem('gold', newGold);
        
        // Обновляем интерфейс
        updateGold(newGold);
        renderShop();
        
        showMessage(`✅ Скин "${skin.name}" успешно куплен!`, 'success');
        
        // Автоматически выбираем купленный скин
        selectSkin(skinId);
        
    } catch (error) {
        showMessage('❌ Ошибка покупки: ' + error.message, 'error');
    }
}

// =============================================
// 🎨 ВЫБОР СКИНА
// =============================================

function selectSkin(skinId) {
    const skin = SKINS.find(s => s.id === skinId);
    if (!skin) return;

    selectedSkin = skinId;
    
    // Сохраняем в localStorage
    localStorage.setItem('avatar', skin.emoji);
    
    // Обновляем магазин
    renderShop();
    
    // Обновляем аватар на дашборде (если он открыт в другой вкладке — не страшно)
    showMessage(`✅ Скин "${skin.name}" выбран!`, 'success');
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
// 🔄 ОБНОВЛЕНИЕ ЗОЛОТА (если изменилось в другой вкладке)
// =============================================

// Слушаем изменения localStorage (если золото обновилось на дашборде)
window.addEventListener('storage', function(e) {
    if (e.key === 'gold') {
        const newGold = parseInt(e.newValue) || 0;
        updateGold(newGold);
        renderShop();
    }
});