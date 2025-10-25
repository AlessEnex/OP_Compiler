// Theme Toggle Manager
class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'dark';
        this.init();
    }

    init() {
        // Applica tema salvato
        this.applyTheme(this.theme);
        
        // Crea toggle button se non esiste
        this.createToggleButton();
        
        // Listener per cambio tema
        document.addEventListener('DOMContentLoaded', () => {
            this.attachToggleListener();
        });
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.theme = theme;
        localStorage.setItem('theme', theme);
    }

    toggleTheme() {
        const newTheme = this.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
    }

    createToggleButton() {
        // Aspetta che il DOM sia pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.insertToggleButton());
        } else {
            this.insertToggleButton();
        }
    }

    insertToggleButton() {
        // Cerca l'header o il nav
        const header = document.querySelector('header') || 
                      document.querySelector('nav') || 
                      document.querySelector('.header') ||
                      document.querySelector('.navbar');
        
        if (!header) {
            console.warn('Header non trovato per theme toggle');
            return;
        }

        // Crea il toggle button
        const toggleContainer = document.createElement('div');
        toggleContainer.style.cssText = 'display: flex; align-items: center; gap: 8px;';
        
        const label = document.createElement('span');
        label.textContent = 'Tema';
        label.style.cssText = 'font-size: 12px; color: var(--text-tertiary); font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;';
        
        const toggle = document.createElement('button');
        toggle.className = 'theme-toggle';
        toggle.setAttribute('aria-label', 'Toggle theme');
        toggle.innerHTML = `
            <span class="theme-toggle-icon moon">🌙</span>
            <div class="theme-toggle-slider"></div>
            <span class="theme-toggle-icon sun">☀️</span>
        `;
        
        toggle.addEventListener('click', () => this.toggleTheme());
        
        toggleContainer.appendChild(label);
        toggleContainer.appendChild(toggle);
        
        // Cerca dove inserirlo (di solito a destra nell'header)
        const rightSection = header.querySelector('.header-right') || 
                            header.querySelector('.nav-right') ||
                            header;
        
        // Se c'è già contenuto a destra, aggiungi prima
        if (rightSection.children.length > 0) {
            rightSection.insertBefore(toggleContainer, rightSection.firstChild);
        } else {
            rightSection.appendChild(toggleContainer);
        }
    }

    attachToggleListener() {
        const toggles = document.querySelectorAll('.theme-toggle');
        toggles.forEach(toggle => {
            // Rimuovi listener precedenti per evitare duplicati
            toggle.replaceWith(toggle.cloneNode(true));
        });
        
        // Ri-seleziona dopo cloning
        document.querySelectorAll('.theme-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => this.toggleTheme());
        });
    }
}

// Inizializza theme manager immediatamente (prima del DOM)
const themeManager = new ThemeManager();

// Ri-attach listeners quando DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    themeManager.attachToggleListener();
});

// Export per uso in altri script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}
