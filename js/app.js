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

// Avvia app
async function init() {
    await bomManager.loadData();
    await loadMacchine();
    setupCSVModal();  // <-- AGGIUNGI QUESTA RIGA
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
        showConfirm(
            'Elimina sottoassieme',
            `Sei sicuro di voler eliminare il sottoassieme "${sottoassieme.descrizione}"?`,
            () => {
                bomManager.removeSottoassieme(sottoassieme.progressivo);
                renderSottoassiemi();
            }
        );
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
                <div style="display: flex; align-items: center; gap: 6px; padding: 8px 10px; background: var(--bg-tertiary); border: none; border-radius: 6px; white-space: nowrap;">

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
                <div style="display: flex; align-items: center; gap: 6px; padding: 8px 10px; background: var(--bg-tertiary); border: none; border-radius: 6px; white-space: nowrap;">

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
    // Setup eventi ricerca
    function setupSearchEvents(sottoassieme, searchSection) {
        const toggleSwitches = searchSection.querySelectorAll('.toggle-switch-mini'); // PLURALE
        const panels = searchSection.querySelectorAll('.search-panel');
        
        console.log('🔧 Setup search events');
        console.log('Toggle trovati:', toggleSwitches.length);
        
        if (toggleSwitches.length === 0) {
            console.error('❌ Nessun toggle switch trovato!');
            return;
        }
        
        // Aggiungi listener a TUTTI i toggle
        // Aggiungi listener a TUTTI i toggle
        toggleSwitches.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                console.log('🔘 Toggle cliccato!');
                e.stopPropagation();
                
                // Determina il nuovo stato in base al toggle cliccato
                const nuovoStato = !toggle.classList.contains('active');
                
                // Imposta lo STESSO stato su tutti i toggle
                toggleSwitches.forEach(t => {
                    if (nuovoStato) {
                        t.classList.add('active');
                    } else {
                        t.classList.remove('active');
                    }
                });
                
                // Aggiorna panels
                panels.forEach(p => p.classList.remove('active'));
                
                // Aggiorna tutti i label
                const allCodiceLabels = searchSection.querySelectorAll('[data-mode="codice"]');
                const allDescrizioneLabels = searchSection.querySelectorAll('[data-mode="descrizione"]');
                
                if (nuovoStato) {
                    // Descrizione attiva
                    searchSection.querySelector('[data-panel="descrizione"]').classList.add('active');
                    allCodiceLabels.forEach(l => l.style.color = 'var(--text-tertiary)');
                    allDescrizioneLabels.forEach(l => l.style.color = 'var(--accent-blue)');
                } else {
                    // Codice attivo
                    searchSection.querySelector('[data-panel="codice"]').classList.add('active');
                    allCodiceLabels.forEach(l => l.style.color = 'var(--accent-blue)');
                    allDescrizioneLabels.forEach(l => l.style.color = 'var(--text-tertiary)');
                }
            });
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
            <div class="result-desc">
                ${item.descrizione}
                ${item.descrizione_aggiuntiva ? `<div class="result-desc-extra">${item.descrizione_aggiuntiva}</div>` : ''}
            </div>
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
            <div class="articolo-desc">
                ${articolo.descrizione}
                ${articolo.descrizione_aggiuntiva ? `<div class="articolo-desc-extra">${articolo.descrizione_aggiuntiva}</div>` : ''}
            </div>
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
            showConfirm(
                'Rimuovi articolo',
                `Rimuovere "${articolo.codice}" da questo sottoassieme?`,
                () => {
                    bomManager.removeArticolo(sottoassieme.progressivo, articolo.codice, articolo.phantomPadre);
                    renderArticoliList(sottoassieme, container);
                    refreshAllExpandedSottoassiemi();
                }
            );
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



// ==================== IMPORT CSV ====================

let csvData = [];
let csvValidated = false;

// Setup modal CSV
function setupCSVModal() {
    const btnImportCSV = document.getElementById('btnImportCSV');
    const csvModal = document.getElementById('csvModal');
    const btnCloseCsvModal = document.getElementById('btnCloseCsvModal');
    const btnCancelCSV = document.getElementById('btnCancelCSV');
    const btnSelectCSV = document.getElementById('btnSelectCSV');
    const csvFileInput = document.getElementById('csvFileInput');
    const csvDropZone = document.getElementById('csvDropZone');
    const btnClearCSV = document.getElementById('btnClearCSV');
    const btnImportCSVConfirm = document.getElementById('btnImportCSV');

    // Apri modal
    btnImportCSV.addEventListener('click', () => {
        csvModal.style.display = 'flex';
        resetCSVModal();
    });

    // Chiudi modal
    btnCloseCsvModal.addEventListener('click', () => {
        csvModal.style.display = 'none';
    });

    btnCancelCSV.addEventListener('click', () => {
        csvModal.style.display = 'none';
    });

    csvModal.addEventListener('click', (e) => {
        if (e.target === csvModal) {
            csvModal.style.display = 'none';
        }
    });

    // Click su "Seleziona file"
    btnSelectCSV.addEventListener('click', () => {
        csvFileInput.click();
    });

    // File selezionato
    csvFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleCSVFile(file);
        }
    });

    // Drag & drop
    csvDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        csvDropZone.classList.add('dragover');
    });

    csvDropZone.addEventListener('dragleave', () => {
        csvDropZone.classList.remove('dragover');
    });

    csvDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        csvDropZone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.csv')) {
            handleCSVFile(file);
        } else {
            alert('⚠️ Per favore carica un file CSV');
        }
    });

    // Clear CSV
    btnClearCSV.addEventListener('click', () => {
        resetCSVModal();
    });

    // Conferma import
    btnImportCSVConfirm.addEventListener('click', () => {
        if (csvValidated && csvData.length > 0) {
            importCSVData();
            csvModal.style.display = 'none';
        }
    });
}

// Reset modal CSV
function resetCSVModal() {
    csvData = [];
    csvValidated = false;
    document.getElementById('csvFileInput').value = '';
    document.getElementById('csvDropZone').style.display = 'block';
    document.getElementById('csvPreview').style.display = 'none';
}

// Gestisce il file CSV caricato
async function handleCSVFile(file) {
    document.getElementById('csvFileName').textContent = file.name;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        const text = e.target.result;
        await parseAndValidateCSV(text);
    };
    reader.readAsText(file);
}

// Parse e valida CSV
async function parseAndValidateCSV(csvText) {
    // Parse CSV con Papaparse (già caricato per Excel)
    const parsed = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        trimHeaders: true,
        delimitersToGuess: [';', '\t', '|']  // <-- CAMBIA QUESTA RIGA (auto-detect)
    });
 

    if (parsed.errors.length > 0) {
        alert('⚠️ Errore nel parsing del CSV');
        console.error(parsed.errors);
        return;
    }

    const rows = parsed.data;
    csvData = [];
    let validCount = 0;
    let errorCount = 0;
    let warningCount = 0;

    // Valida ogni riga
    for (const row of rows) {
        // Normalizza headers (rimuovi spazi)
        const sottoassieme = String(row.sottoassieme || row.Sottoassieme || '').trim();
        const codice = String(row.codice || row.Codice || '').trim();
        const quantita = parseInt(row.quantita || row.Quantita || row.Quantità || 1);

        if (!sottoassieme || !codice) {
            errorCount++;
            continue;
        }

        // Verifica che il sottoassieme esista
        const saExists = bomManager.sottoassiemi.find(sa => sa.progressivo === sottoassieme);
        
        // Verifica che l'articolo esista
        const articolo = bomManager.findArticolo(codice);
        
        const validation = {
            sottoassieme,
            codice,
            quantita,
            saExists: !!saExists,
            artExists: articolo.trovato,
            articolo: articolo,
            status: 'valid'
        };

        if (!saExists) {
            validation.status = 'error';
            validation.error = 'Sottoassieme non esiste';
            errorCount++;
        } else if (!articolo.trovato) {
            validation.status = 'warning';
            validation.error = 'Articolo non trovato';
            warningCount++;
        } else {
            validCount++;
        }

        csvData.push(validation);
    }

    // Mostra preview
    renderCSVPreview(csvData, validCount, errorCount, warningCount);
    csvValidated = errorCount === 0;

    // Mostra preview, nascondi drop zone
    document.getElementById('csvDropZone').style.display = 'none';
    document.getElementById('csvPreview').style.display = 'block';
}

// Renderizza preview CSV
function renderCSVPreview(data, validCount, errorCount, warningCount) {
    const previewContent = document.getElementById('csvPreviewContent');
    const csvStats = document.getElementById('csvStats');

    previewContent.innerHTML = '';

    data.forEach(item => {
        const row = document.createElement('div');
        row.className = `preview-row ${item.status}`;
        
        let statusIcon = '✅';
        if (item.status === 'error') statusIcon = '❌';
        if (item.status === 'warning') statusIcon = '⚠️';

        row.innerHTML = `
            <div class="preview-sa">${item.sottoassieme}</div>
            <div class="preview-code">${item.codice}</div>
            <div class="preview-qty">${item.quantita}x</div>
            <div class="preview-status">${statusIcon}</div>
        `;

        if (item.error) {
            row.title = item.error;
        }

        previewContent.appendChild(row);
    });

    // Stats
    csvStats.innerHTML = `
        <div><strong>${data.length}</strong> righe totali</div>
        <div><strong>${validCount}</strong> valide</div>
        ${warningCount > 0 ? `<div style="color: #ff9500;"><strong>${warningCount}</strong> warning</div>` : ''}
        ${errorCount > 0 ? `<div style="color: #ff3b30;"><strong>${errorCount}</strong> errori</div>` : ''}
    `;

    // Abilita/disabilita bottone import
    const btnImport = document.getElementById('btnImportCSV');
    if (errorCount > 0) {
        btnImport.disabled = true;
        btnImport.style.opacity = '0.5';
        btnImport.style.cursor = 'not-allowed';
    } else {
        btnImport.disabled = false;
        btnImport.style.opacity = '1';
        btnImport.style.cursor = 'pointer';
    }
}

// Importa i dati CSV nella BoM
function importCSVData() {
    let importedCount = 0;
    let skippedCount = 0;

    csvData.forEach(item => {
        if (item.status === 'valid' || item.status === 'warning') {
            const sottoassieme = bomManager.sottoassiemi.find(sa => sa.progressivo === item.sottoassieme);
            
            if (sottoassieme) {
                // Aggiungi articolo (usa addArticolo per triggerare dipendenze)
                bomManager.addArticolo(sottoassieme.progressivo, item.articolo, item.quantita);
                importedCount++;
            } else {
                skippedCount++;
            }
        }
    });

    // Aggiorna UI di tutti i sottoassiemi espansi
    refreshAllExpandedSottoassiemi();

    alert(`Importazione completata!\n\n${importedCount} articoli importati${skippedCount > 0 ? `\n${skippedCount} saltati` : ''}`);
}


// Avvia app
init();