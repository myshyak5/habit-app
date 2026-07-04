function renderNavbar(activePage) {
    const pages = [
        { id: 'dashboard', name: '📊 Дашборд', href: 'dashboard.html' },
        { id: 'profile', name: '👤 Профиль', href: 'profile.html' },
        { id: 'shop', name: '🛒 Магазин', href: 'shop.html' }
    ];
    
    return `
        <header class="header">
            <div class="header-content">
                <div class="logo">🎮 Habit RPG</div>
                <nav class="nav-links">
                    ${pages.map(page => `
                        <a href="${page.href}" class="${page.id === activePage ? 'active' : ''}">
                            ${page.name}
                        </a>
                    `).join('')}
                </nav>
                <button onclick="logoutUser()" class="btn-logout">Выйти</button>
            </div>
        </header>
    `;
}
document.addEventListener('DOMContentLoaded', function() {
    const navbar = document.getElementById('navbar');
    if (navbar) {
        const path = window.location.pathname;
        const currentPage = path.split('/').pop().replace('.html', '') || 'dashboard';
        navbar.innerHTML = renderNavbar(currentPage);
    }
});