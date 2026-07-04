document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    const currentPage = path.split('/').pop().replace('.html', '') || 'dashboard';
    
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.dataset.page === currentPage) {
            link.classList.add('active');
        }
    });
});