let SKINS = [];
let selectedSkin = null;
let userSkins = [];

document.addEventListener('DOMContentLoaded', async function() {
    if (!checkAuth()) return;
    const user = getUserData();
    updateGold(user.gold);
    await loadSkinsFromServer();
    await loadUserSkins();
    renderShop();
});

async function loadSkinsFromServer() {
    try {
        const response = await apiRequest('/skins/', 'GET');
        SKINS = response.map(skin => ({
            id: skin.id,
            emoji: skin.emoji,
            name: skin.name,
            price: skin.price
        }));
    } catch (error) {
        showNotification('❌ ' + handleApiError(error, 'Не удалось загрузить скины'), 'error');
    }
}

async function loadUserSkins() {
    try {
        const user = await apiRequest('/user/', 'GET');
        userSkins = user.owned_skins || [];
        const currentAvatar = user.avatar_skin || '😊';
        const currentSkin = SKINS.find(s => s.emoji === currentAvatar);
        selectedSkin = currentSkin ? currentSkin.id : null;
    } catch (error) {
        console.warn('⚠️ Не удалось загрузить скины пользователя:', error);
        userSkins = [];
        selectedSkin = null;
    }
}

function updateGold(gold) {
    const el = document.getElementById('shopGold');
    if (el) el.textContent = gold || 0;
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
            buttonText = `💰 ${skin.price}`;
            buttonClass = 'btn-buy';
            disabled = false;
        } else {
            buttonText = `💰 ${skin.price}`;
            buttonClass = 'btn-buy disabled';
            disabled = true;
            hintText = `Не хватает ${shortfall} 💰`;
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

function updateShopSelection(skinId) {
    document.querySelectorAll('.shop-item').forEach(item => {
        const id = parseInt(item.dataset.id);
        const isOwned = userSkins.includes(id);
        const btn = item.querySelector('.btn-buy');
        
        item.classList.toggle('selected', id === skinId);
        
        if (btn) {
            if (id === skinId) {
                btn.textContent = '✅ Выбран';
                btn.className = 'btn-buy selected';
                btn.disabled = true;
            } else if (isOwned) {
                btn.textContent = '📤 Выбрать';
                btn.className = 'btn-buy owned';
                btn.disabled = false;
            } else {
                const skin = SKINS.find(s => s.id === id);
                if (skin) {
                    const gold = getUserData().gold || 0;
                    const canBuy = gold >= skin.price;
                    btn.textContent = `💰 ${skin.price}`;
                    btn.className = canBuy ? 'btn-buy' : 'btn-buy disabled';
                    btn.disabled = !canBuy;
                }
            }
        }
    });
}

async function handleShopAction(skinId) {
    const skin = SKINS.find(s => s.id === skinId);
    if (!skin) {
        showNotification('❌ Скин не найден', 'error');
        return;
    }

    const isOwned = userSkins.includes(skinId);
    const user = getUserData();
    const gold = user.gold || 0;

    if (isOwned) {
        selectSkin(skinId);
        return;
    }
    if (gold < skin.price) {
        showNotification('❌ Недостаточно золота!', 'error');
        return;
    }

    if (!confirm(`🛒 Купить скин "${skin.name}" ${skin.emoji}?\nЦена: 💰 ${skin.price}\nВаш баланс: 💰 ${gold}`)) return;

    try {
        const response = await apiRequest(`/skins/${skinId}/buy/`, 'POST');
        await refreshUserData();
        await loadUserSkins();
        updateGold(response.gold_left || 0);
        renderShop();
        showNotification(`✅ Скин "${skin.name}" куплен!`, 'success');
    } catch (error) {
        showNotification('❌ ' + handleApiError(error, 'Ошибка при покупке скина'), 'error');
    }
}

async function selectSkin(skinId) {
    const skin = SKINS.find(s => s.id === skinId);
    if (!skin) return;

    selectedSkin = skinId;
    localStorage.setItem('avatar', skin.emoji);
    
    try {
        await apiRequest('/user/update-avatar/', 'POST', { 
            avatar_skin: skin.emoji
        });
        
        await refreshUserData();
        showNotification(`✅ Скин "${skin.name}" выбран!`, 'success');
    } catch (error) {
        console.warn('⚠️ Не удалось сохранить аватар:', error);
    }
    
    updateShopSelection(skinId);
    updateAvatarOnDashboard(skin.emoji);
}

function updateAvatarOnDashboard(emoji) {
    const avatarElement = document.getElementById('characterAvatar');
    if (avatarElement) avatarElement.textContent = emoji;
}

window.addEventListener('storage', function(e) {
    if (e.key === 'gold') {
        updateGold(parseInt(e.newValue) || 0);
        renderShop();
    }
});