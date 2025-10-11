// Filtro sottoassiemi

const SottoassiemiFilter = {
    filterInput: null,
    btnClearFilter: null,
    visibleCountEl: null,
    totalCountEl: null,
    debounceTimer: null,

    setup() {
        this.filterInput = document.getElementById('filterSottoassiemi');
        this.btnClearFilter = document.getElementById('btnClearFilter');
        this.visibleCountEl = document.getElementById('visibleCount');
        this.totalCountEl = document.getElementById('totalCount');
        
        if (!this.filterInput) return;
        
        this.updateStats();
        this.attachEvents();
    },

    attachEvents() {
        // Input con debouncing
        this.filterInput.addEventListener('input', (e) => {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                this.filter(e.target.value);
            }, 200);
        });
        
        // Clear button
        this.btnClearFilter.addEventListener('click', () => {
            this.filterInput.value = '';
            this.filter('');
            this.filterInput.focus();
        });
        
        // ESC key
        this.filterInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.filterInput.value = '';
                this.filter('');
            }
        });
    },

    filter(query) {
        const cards = document.querySelectorAll('.sottoassieme-card');
        const searchTerm = query.toLowerCase().trim();
        let visibleCount = 0;
        
        // Mostra/nascondi bottone clear
        this.btnClearFilter.style.display = searchTerm ? 'block' : 'none';
        
        if (!searchTerm) {
            // Nessun filtro
            cards.forEach(card => {
                card.classList.remove('filtered-hidden');
                visibleCount++;
            });
        } else {
            // Applica filtro
            cards.forEach(card => {
                const progressivo = card.dataset.progressivo;
                const sottoassieme = bomManager.sottoassiemi.find(sa => sa.progressivo === progressivo);
                
                if (sottoassieme) {
                    const codice = sottoassieme.codice.toLowerCase();
                    const descrizione = sottoassieme.descrizione.toLowerCase();
                    
                    const matches = codice.includes(searchTerm) || descrizione.includes(searchTerm);
                    
                    if (matches) {
                        card.classList.remove('filtered-hidden');
                        visibleCount++;
                    } else {
                        card.classList.add('filtered-hidden');
                    }
                }
            });
        }
        
        this.updateStats(visibleCount);
        
        // Evidenzia in rosso se nessun risultato
        if (visibleCount === 0 && searchTerm) {
            this.filterInput.style.borderColor = '#ff3b30';
        } else {
            this.filterInput.style.borderColor = '';
        }
    },

    updateStats(visible = null) {
        if (!this.visibleCountEl || !this.totalCountEl) return;
        
        const total = bomManager.sottoassiemi.length;
        const visibleNum = visible !== null ? visible : total;
        
        this.visibleCountEl.textContent = visibleNum;
        this.totalCountEl.textContent = total;
    }
};