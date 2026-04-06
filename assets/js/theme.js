// Immediately set theme to prevent FOUC (Flash of Unstyled Content)
(function() {
    const saved = localStorage.getItem('theme-preference');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    // Inject floating toggle button
    const btn = document.createElement('button');
    btn.id = 'theme-toggle';
    btn.setAttribute('aria-label', 'Toggle Dark Mode');
    btn.title = 'Toggle Dark Mode';
    
    // Style adjustments dynamically applied if required by layout collisions
    
    const updateIcon = () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        btn.innerHTML = isDark ? '☀️' : '🌙';
    };
    
    updateIcon();
    
    btn.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme-preference', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme-preference', 'dark');
        }
        updateIcon();
    });
    
    document.body.appendChild(btn);
});
