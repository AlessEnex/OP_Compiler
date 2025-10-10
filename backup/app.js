// Controller principale dell'applicazione

const bomManager = new BomManager();

// Elementi DOM
const setupForm = document.getElementById('setupForm');
const mainApp = document.getElementById('mainApp');
const commessaForm = document.getElementById('commessaForm');
const selectMacchina = document.getElementById('macchina');
const sottoassiemiContainer = document.getElementById('sottoassiemiContainer');
const btnExport = document.getElementById('btnExport');
const headerCommessa = document.getElementById('headerCommessa');
const headerMacchina = document.getElementById('headerMacchina');

// Inizializzazione app
async function init() {
    await bomManager.loadData();
    await loadMacchine();
}

// Carica le macchine nel dropdown
async function loadMacchine() {
    const macchine = await loadJSON('data/macchine.json');
    if (!macchine) return;

    macchine.forEach(macchina => {
        const option = document.createElement('option');
        option.value = macchina.codice;
        option.textContent = `${macchina.codice} - ${macchina.descrizione}`;
        option.dataset.descrizione = macchina.descrizione;
        selectMacchina.appendChild(option);
    });
}

// Submit form commessa
commessaForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const anno = parseInt(document.getElementById('anno').value);
    const commessa = document.getElementById('commessa').value;
    const macchinaSelect = document.getElementById('macchina');
    const codiceMacchina = macchinaSelect.value;
    const descrizioneMacchina = macchinaSelect.options[macchinaSelect.selectedIndex].dataset.descrizione;

    // Validazione
    if (!commessa || commessa.length !== 4) {
        alert('Il numero commessa deve essere di 4 cifre');
        return;
    }

    // Inizializza bomManager
    bomManager.init(anno, commessa, codiceMacchina, descrizioneMacchina);
    bomManager.initSottoassiemi();

    // Aggiorna header
    headerCommessa.textContent = `Commessa: ${formatCommessa(commessa)} (${anno})`;
    headerMacchina.textContent = `Macchina: ${codiceMacchina}`;

    // Mostra app principale
    setupForm.style.display = 'none';
    mainApp.style.display = 'block';

    // Renderizza sottoassiemi
    renderSottoassiemi();
});

// Renderizza tutti i sottoassiemi
function renderSottoassiemi() {
    sottoassiemiContainer.innerHTML = '';

    bomManager.sottoassiemi.forEach(sottoassieme => {
        const card = createSottoassiemeCard(sottoassieme);
        sottoassiemiContainer.appendChild(card);
    });
}

// Crea card sottoassieme
function createSottoassiemeCard(sottoassieme) {
    const card = document.createElement('div');
    card.className = 'sottoassieme-card';
    card.dataset.progressivo = sottoassieme.progressivo;

    const header = document.createElement('div');
    header.className = 'sottoassieme-header';

    const toggle = document.createElement('div');
    toggle.className = 'sottoassieme-toggle';
    toggle.innerHTML = '▶';

    const code = document.createElement('div');
    code.className = 'sottoassieme-code';
    code.textContent = sottoassieme.codice;

    const desc = document.createElement('div');
    desc.className = 'sottoassieme-desc';
    desc.textContent = sottoassieme.descrizione;

    const btnCheck = document.createElement('button');
    btnCheck.className = 'btn-check';
    btnCheck.innerHTML = sottoassieme.completed ? '✓' : '';
    if (sottoassieme.completed) {
        btnCheck.classList.add('checked');
        card.classList.add('completed');
    }
    btnCheck.onclick = (e) => {
        e.stopPropagation();
        sottoassieme.completed = !sottoassieme.completed;
        btnCheck.innerHTML = sottoassieme.completed ? '✓' : '';
        btnCheck.classList.toggle('checked');
        card.classList.toggle('completed');
    };

    const btnDelete = document.createElement('button');
    btnDelete.className = 'btn-delete';
    btnDelete.textContent = '🗑';
    btnDelete.onclick = (e) => {
        e.stopPropagation();
        if (confirm(`Eliminare il sottoassieme ${sottoassieme.descrizione}?`)) {
            bomManager.removeSottoassieme(sottoassieme.progressivo);
            renderSottoassiemi();
        }
    };

    header.appendChild(toggle);
    header.appendChild(code);
    header.appendChild(desc);
    header.appendChild(btnCheck);  // <-- AGGIUNGI PRIMA DEL DELETE
    header.appendChild(btnDelete);

    const content = document.createElement('div');
    content.className = 'sottoassieme-content';

    // Toggle expand/collapse
    header.onclick = (e) => {
        if (e.target === btnDelete) return;
        sottoassieme.expanded = !sottoassieme.expanded;
        toggle.classList.toggle('expanded', sottoassieme.expanded);
        content.classList.toggle('expanded', sottoassieme.expanded);
        
        // Renderizza contenuto solo quando espanso
        if (sottoassieme.expanded && content.children.length === 0) {
            renderSottoassiemeContent(sottoassieme, content);
        }
    };

    card.appendChild(header);
    card.appendChild(content);

    return card;
}

// Renderizza contenuto sottoassieme (form ricerca + lista articoli)
function renderSottoassiemeContent(sottoassieme, container) {
    container.innerHTML = '';

    // Sezione ricerca
    const searchSection = document.createElement('div');
    searchSection.className = 'search-section';
    searchSection.innerHTML = `
    <div class="search-content">
        <!-- Ricerca per codice -->
        <div class="search-panel" data-panel="codice">
            <div style="display: flex; gap: 8px; align-items: center;">
                <input type="text" class="search-input" style="flex: 1;" placeholder="Cerca codice..." data-search="codice">
                <div style="display: flex; align-items: center; gap: 6px; padding: 8px 10px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 6px; white-space: nowrap;">
                    <span style="font-size: 11px; color: var(--text-tertiary);" data-mode="codice">Codice</span>
                    <div class="toggle-switch-mini">
                        <div class="toggle-slider-mini"></div>
                    </div>
                    <span style="font-size: 11px; color: var(--accent-blue); font-weight: 500;" data-mode="descrizione">Descrizione</span>
                </div>
            </div>
            <div class="search-results" data-results="codice"></div>
        </div>
        
        <!-- Ricerca per descrizione -->
        <div class="search-panel active" data-panel="descrizione">
            <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
                <div class="search-double" style="flex: 1; margin: 0;">
                    <input type="text" class="search-input" placeholder="Parola chiave 1..." data-search="desc1">
                    <input type="text" class="search-input" placeholder="Parola chiave 2..." data-search="desc2">
                </div>
                <div style="display: flex; align-items: center; gap: 6px; padding: 8px 10px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 6px; white-space: nowrap;">
                    <span style="font-size: 11px; color: var(--text-tertiary);" data-mode="codice">Codice</span>
                    <div class="toggle-switch-mini active">
                        <div class="toggle-slider-mini"></div>
                    </div>
                    <span style="font-size: 11px; color: var(--accent-blue); font-weight: 500;" data-mode="descrizione">Descrizione</span>
                </div>
            </div>
            <div class="search-results" data-results="descrizione"></div>
        </div>
    </div>
    `;

    // Lista articoli
    const articoliSection = document.createElement('div');
    articoliSection.className = 'articoli-section';
    articoliSection.innerHTML = '<div class="articoli-list"></div>';

    container.appendChild(searchSection);
    container.appendChild(articoliSection);

    // Setup eventi ricerca
    setupSearchEvents(sottoassieme, searchSection);
    
    // Renderizza articoli esistenti
    renderArticoliList(sottoassieme, articoliSection.querySelector('.articoli-list'));
}

    // Setup eventi ricerca
    // Setup eventi ricerca
    // Setup eventi ricerca
    function setupSearchEvents(sottoassieme, searchSection) {
    const toggleSwitch = searchSection.querySelector('.toggle-switch-mini');
    
    console.log('🔧 Setup search events');
    console.log('Toggle trovato:', toggleSwitch);
    
    if (!toggleSwitch) {
        console.error('❌ Toggle switch non trovato!');
        return;
    }
    
    const panels = searchSection.querySelectorAll('.search-panel');
    const labels = searchSection.querySelectorAll('[data-mode]');
        // Gestione toggle switch
        toggleSwitch.addEventListener('click', () => {
            console.log('🔘 Toggle cliccato!');
            toggleSwitch.classList.toggle('active');
            
            // Aggiorna panels
            panels.forEach(p => p.classList.remove('active'));
            
            // Aggiorna labels colors
            const codiceLabel = searchSection.querySelector('[data-mode="codice"]');
            const descrizioneLabel = searchSection.querySelector('[data-mode="descrizione"]');
            
            if (toggleSwitch.classList.contains('active')) {
                // Descrizione attiva
                searchSection.querySelector('[data-panel="descrizione"]').classList.add('active');
                codiceLabel.style.color = 'var(--text-tertiary)';
                descrizioneLabel.style.color = 'var(--accent-blue)';
            } else {
                // Codice attivo
                searchSection.querySelector('[data-panel="codice"]').classList.add('active');
                codiceLabel.style.color = 'var(--accent-blue)';
                descrizioneLabel.style.color = 'var(--text-tertiary)';
            }
        });

        // Ricerca per codice
        const searchCodice = searchSection.querySelector('[data-search="codice"]');
        const resultsCodice = searchSection.querySelector('[data-results="codice"]');
        
        searchCodice.addEventListener('input', (e) => {
            const results = bomManager.searchArticoli(e.target.value, 'codice');
            renderSearchResults(results, resultsCodice, sottoassieme);
        });

        // Ricerca per descrizione
        const searchDesc1 = searchSection.querySelector('[data-search="desc1"]');
        const searchDesc2 = searchSection.querySelector('[data-search="desc2"]');
        const resultsDesc = searchSection.querySelector('[data-results="descrizione"]');
        
        const searchDescrizione = () => {
            const results = bomManager.searchArticoliByDescrizione(searchDesc1.value, searchDesc2.value);
            renderSearchResults(results, resultsDesc, sottoassieme);
        };
        
        searchDesc1.addEventListener('input', searchDescrizione);
        searchDesc2.addEventListener('input', searchDescrizione);
    }

// Renderizza risultati ricerca
function renderSearchResults(results, container, sottoassieme) {
    if (results.length === 0) {
        container.innerHTML = '<div class="no-results">Nessun risultato</div>';
        return;
    }

    container.innerHTML = '';
    results.forEach(item => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        if (item.isPhantom) {
            resultItem.classList.add('phantom');
        }
        
        resultItem.innerHTML = `
            <div class="result-code">
                ${item.codice}
                ${item.isPhantom ? '<span class="phantom-badge">PHANTOM</span>' : ''}
            </div>
            <div class="result-desc">${item.descrizione}</div>
            <div class="result-cat">${item.categoria || item.tipo || ''}</div>
        `;
        
        resultItem.onclick = () => {
            if (item.isPhantom) {
                // Mostra modal selezione variante
                showVariantModal(item, sottoassieme, container);
            } else {
                // Articolo normale
                bomManager.addArticolo(sottoassieme.progressivo, item, 1);
                const articoliList = container.closest('.sottoassieme-content').querySelector('.articoli-list');
                renderArticoliList(sottoassieme, articoliList);
                container.innerHTML = '';
                container.closest('.search-content').querySelectorAll('.search-input').forEach(input => input.value = '');
                
                // Refresh tutti i sottoassiemi espansi per aggiornare dipendenze
                refreshAllExpandedSottoassiemi();
            }
        };
        
        container.appendChild(resultItem);
    });
}

// Mostra modal per selezione variante
function showVariantModal(phantom, sottoassieme, searchContainer) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    const variantiHTML = Object.keys(phantom.varianti).map(varCode => {
        const variant = phantom.varianti[varCode];
        return `
            <div class="variante-option" data-variant="${varCode}">
                <div class="variante-code">${varCode}</div>
                <div class="variante-desc">${variant.descrizione}</div>
            </div>
        `;
    }).join('');
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <div class="modal-title">${phantom.codice}</div>
                <div class="modal-subtitle">${phantom.descrizione}</div>
            </div>
            <div class="varianti-list">
                ${variantiHTML}
            </div>
            <div class="modal-actions">
                <button class="btn-cancel">Annulla</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Gestione click variante
    modal.querySelectorAll('.variante-option').forEach(option => {
        option.onclick = () => {
            const variantCode = option.dataset.variant;
            bomManager.addArticolo(sottoassieme.progressivo, phantom, 1, variantCode);
            const articoliList = searchContainer.closest('.sottoassieme-content').querySelector('.articoli-list');
            renderArticoliList(sottoassieme, articoliList);
            searchContainer.innerHTML = '';
            searchContainer.closest('.search-content').querySelectorAll('.search-input').forEach(input => input.value = '');
            modal.remove();
            
            // Refresh tutti i sottoassiemi espansi per aggiornare dipendenze
            refreshAllExpandedSottoassiemi();
        };
    });
    
    // Gestione annulla
    modal.querySelector('.btn-cancel').onclick = () => modal.remove();
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}

// Renderizza lista articoli inseriti
function renderArticoliList(sottoassieme, container) {
    if (sottoassieme.articoli.length === 0) {
        container.innerHTML = '<div class="empty-articoli">Nessun articolo inserito</div>';
        return;
    }

    container.innerHTML = '';
    sottoassieme.articoli.forEach(articolo => {
        const item = document.createElement('div');
        item.className = 'articolo-item';
        
        // Evidenzia se non trovato
        if (articolo.trovato === false) {
            item.classList.add('not-found');
        }
        
        item.innerHTML = `
            <div class="articolo-code">
                ${articolo.codice}
                ${articolo.phantomPadre ? `<div class="phantom-info">da ${articolo.phantomPadre} [${articolo.variantePadre}]</div>` : ''}
            </div>
            <div class="articolo-desc">${articolo.descrizione}</div>
            <div class="articolo-qty">
                <button class="qty-btn" data-action="minus">−</button>
                <input type="number" class="qty-input" value="${articolo.quantita}" min="1">
                <button class="qty-btn" data-action="plus">+</button>
            </div>
            <button class="btn-remove">×</button>
        `;

        // Eventi quantità
        const qtyInput = item.querySelector('.qty-input');
        const btnMinus = item.querySelector('[data-action="minus"]');
        const btnPlus = item.querySelector('[data-action="plus"]');
        const btnRemove = item.querySelector('.btn-remove');

        btnMinus.onclick = () => {
        bomManager.updateQuantita(sottoassieme.progressivo, articolo.codice, -1, articolo.phantomPadre);
        qtyInput.value = articolo.quantita;
        
        // Re-renderizza tutti i sottoassiemi per aggiornare le dipendenze
        refreshAllExpandedSottoassiemi();
        };

        btnPlus.onclick = () => {
        bomManager.updateQuantita(sottoassieme.progressivo, articolo.codice, 1, articolo.phantomPadre);
        qtyInput.value = articolo.quantita;
        
        // Re-renderizza tutti i sottoassiemi per aggiornare le dipendenze
        refreshAllExpandedSottoassiemi();
        };

        qtyInput.addEventListener('change', (e) => {
        bomManager.setQuantita(sottoassieme.progressivo, articolo.codice, e.target.value, articolo.phantomPadre);
        qtyInput.value = articolo.quantita;
        
        // Re-renderizza tutti i sottoassiemi per aggiornare le dipendenze
        refreshAllExpandedSottoassiemi();
        });

        btnRemove.onclick = () => {
        bomManager.removeArticolo(sottoassieme.progressivo, articolo.codice, articolo.phantomPadre);
        renderArticoliList(sottoassieme, container);
        
        // Re-renderizza tutti i sottoassiemi per aggiornare le dipendenze
        refreshAllExpandedSottoassiemi();
        };

        container.appendChild(item);
    });
}

// Export Excel
btnExport.addEventListener('click', () => {
    const bomData = bomManager.exportFlat();
    if (bomData.length === 0) {
        alert('La distinta base è vuota!');
        return;
    }

    const filename = `BOM_${formatCommessa(bomManager.commessa)}_${bomManager.anno}.xlsx`;
    exportToExcel(bomData, filename);
});

// Aggiorna la visualizzazione di tutti i sottoassiemi espansi
function refreshAllExpandedSottoassiemi() {
    bomManager.sottoassiemi.forEach(sa => {
        if (sa.expanded) {
            const card = document.querySelector(`[data-progressivo="${sa.progressivo}"]`);
            if (card) {
                const content = card.querySelector('.sottoassieme-content');
                const articoliList = content.querySelector('.articoli-list');
                if (articoliList) {
                    renderArticoliList(sa, articoliList);
                }
            }
        }
    });
}

function refreshAllExpandedSottoassiemi() {
    console.log('🔄 Refresh sottoassiemi espansi');
    bomManager.sottoassiemi.forEach(sa => {
        if (sa.expanded) {
            console.log('  - Aggiornando sottoassieme:', sa.codice);
            const card = document.querySelector(`[data-progressivo="${sa.progressivo}"]`);
            if (card) {
                const content = card.querySelector('.sottoassieme-content');
                const articoliList = content.querySelector('.articoli-list');
                if (articoliList) {
                    renderArticoliList(sa, articoliList);
                }
            }
        }
    });
}


// Avvia app
init();