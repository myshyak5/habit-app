import store from './store.js';
import { checkAuth, refreshUserData, logoutUser } from './auth.js';
import { apiRequest } from './api.js';
import { showNotification, handleApiError } from './notifications.js';
import { CONFIG } from './constants.js';

let SKINS = [];
let selectedSkin = null;

document.addEventListener('DOMContentLoaded', async function() {
    if (!checkAuth()) return;
    
    document.getElementById('logoutBtn')?.addEventListener('click', logoutUser);
    store.subscribe((state) => {
        updateGold(state.user.gold);
        const newAvatar = state.user.avatar;
        if (newAvatar && SKINS.length > 0) {
            const newSkin = SKINS.find(s => s.emoji === newAvatar);
            if (newSkin && selectedSkin !== newSkin.id) {
                selectedSkin = newSkin.id;
                updateShopSelection(selectedSkin);
            }
        }
    });
    
    await refreshUserData();
    const user = store.getUser();
    updateGold(user.gold);
    await loadSkinsFromServer();
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
        
        const user = store.getUser();
        const currentAvatar = user.avatar || CONFIG.DEFAULT_AVATAR;
        const savedSkinId = parseInt(localStorage.getItem('selectedSkin'));
        
        if (savedSkinId && SKINS.some(s => s.id === savedSkinId)) {
            selectedSkin = savedSkinId;
        } else {
            const currentSkin = SKINS.find(s => s.emoji === currentAvatar);
            selectedSkin = currentSkin ? currentSkin.id : null;
            if (selectedSkin !== null) {
                localStorage.setItem('selectedSkin', selectedSkin);
            }
        }
        
    } catch (error) {
        showNotification('❌ ' + handleApiError(error, 'Не удалось загрузить скины'), 'error');
    }
}

function updateGold(gold) {
    const el = document.getElementById('shopGold');
    if (el) el.textContent = gold || 0;
}

function renderShop() {
    const grid = document.getElementById('shopGrid');
    if (!grid) return;

    const user = store.getUser();
    const gold = user.gold || 0;
    const ownedSkins = user.owned_skins || [];

    if (SKINS.length === 0) {
        grid.innerHTML = `<div class="shop-empty"><p>🛒 Скины пока недоступны</p></div>`;
        return;
    }

    grid.innerHTML = SKINS.map(skin => {
        const isOwned = ownedSkins.includes(skin.id);
        const isSelected = selectedSkin === skin.id;
        const canBuy = !isOwned && gold >= skin.price;
        const shortfall = skin.price - gold;

        let buttonText = '';
        let buttonClass = 'btn-buy';
        let disabled = true;
        let hintText = '';

        if (isOwned && isSelected) {
            buttonText = 'Выбран';
            buttonClass = 'btn-buy selected';
            disabled = true;
        } else if (isOwned) {
            buttonText = 'Выбрать';
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
                <button class="${buttonClass} buy-btn" data-id="${skin.id}" ${disabled ? 'disabled' : ''}>
                    ${buttonText}
                </button>
            </div>
        `;
    }).join('');

    grid.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const skinId = parseInt(this.dataset.id);
            handleShopAction(skinId);
        });
    });
}

function updateShopSelection(skinId) {
    const user = store.getUser();
    const ownedSkins = user.owned_skins || [];
    
    document.querySelectorAll('.shop-item').forEach(item => {
        const id = parseInt(item.dataset.id);
        const isOwned = ownedSkins.includes(id);
        const btn = item.querySelector('.btn-buy');
        
        item.classList.toggle('selected', id === skinId);
        
        if (btn) {
            if (id === skinId) {
                btn.textContent = 'Выбран';
                btn.className = 'btn-buy selected';
                btn.disabled = true;
            } else if (isOwned) {
                btn.textContent = 'Выбрать';
                btn.className = 'btn-buy owned';
                btn.disabled = false;
            } else {
                const skin = SKINS.find(s => s.id === id);
                if (skin) {
                    const gold = store.getUser().gold || 0;
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

    const user = store.getUser();
    const ownedSkins = user.owned_skins || [];
    const isOwned = ownedSkins.includes(skinId);
    const gold = user.gold || 0;

    if (isOwned) {
        await selectSkin(skinId);
        return;
    }
    if (gold < skin.price) {
        showNotification('❌ Недостаточно золота!', 'error');
        return;
    }

    if (!confirm(`🛒 Купить скин "${skin.name}" ${skin.emoji}?\nЦена: 💰 ${skin.price}\nВаш баланс: 💰 ${gold}`)) return;

    try {
        const response = await apiRequest(`/skins/${skinId}/buy/`, 'POST');
        
        store.updateUser({
            gold: response.gold_left,
            owned_skins: response.owned_skins
        });

        updateGold(response.gold_left || 0);
        
        const shopItem = document.querySelector(`.shop-item[data-id="${skinId}"]`);
        
        if (shopItem) {
            const btn = shopItem.querySelector('.btn-buy');
            if (btn) {
                btn.textContent = 'Выбрать';
                btn.className = 'btn-buy owned';
                btn.disabled = false;
            }
            shopItem.classList.add('owned');
            shopItem.classList.remove('selected');
        }
        
        showNotification(`✅ Скин "${skin.name}" куплен!`, 'success');
    } catch (error) {
        await refreshUserData();
        renderShop();
        
        if (error.message && error.message.includes('уже куплен')) {
            showNotification('ℹ️ Этот скин уже куплен', 'info');
        } else {
            showNotification('❌ ' + handleApiError(error, 'Ошибка при покупке скина'), 'error');
        }
    }
}

async function selectSkin(skinId) {
    const skin = SKINS.find(s => s.id === skinId);
    if (!skin) return;

    selectedSkin = skinId;
    localStorage.setItem('selectedSkin', skinId);
    
    try {
        const response = await apiRequest(`/skins/${skinId}/activate/`, 'POST');

        store.updateUser({
            avatar: response.avatar_skin,
            owned_skins: response.owned_skins
        });
        
        const updatedSkin = SKINS.find(s => s.emoji === response.avatar_skin);
        selectedSkin = updatedSkin ? updatedSkin.id : skinId;
        localStorage.setItem('selectedSkin', selectedSkin);
        
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
    }
});