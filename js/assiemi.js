// Gestione Assiemi

class AssiemiManager {
    constructor() {
        this.assiemi = [];
        this.articoli = [];
        this.sottoassiemiStandard = [];
        this.dipendenze = [];
        this.currentEditingId = null;
    }

    async init() {
        await this.loadData();
        this.setupUI();
        this.renderAssiemi();
        this.updateStats();
    }

    async loadData() {
        this.articoli = await loadJSON('data/articoli.json') || [];
        this.sottoassiemiStandard = await loadJSON('data/sottoassiemi.json') || [];
        this.assiemi = await loadJSON('data/assiemi.json') || [];
        this.dipendenze = await loadJSON('data/dipendenze.json') || [];
        
        // Sanifica dati
        this.articoli = this.articoli.map(art => ({
            ...art,
            codice: String(art.codice || ''),
            descrizione: String(art.descrizione || '')
        }));
    }

    setupUI() {
        const btnNew = document.getElementById('btnNewAssieme');
        const btnExport = document.getElementById('btnExportJSONAssiemi');
        const btnCloseModal = document.getElementById('btnCloseModalAssieme');
        const btnCancelModal = document.getElementById('btnCancelModalAssieme');
        const form = document.getElementById('assiemeForm');
        const filterInput = document.getElementById('filterInputAssiemi');
        const modal = document.getElementById('assiemeModal');
        const toggleTutti = document.getElementById('assiemeTuttiOP');
        const checkboxesContainer = document.getElementById('sottoassiemiCheckboxes');

        // Nuovo assieme
        btnNew.addEventListener('click', () => this.openModal());

        // Export JSON
        btnExport.addEventListener('click', () => this.exportJSON());

        // Chiudi modal
        btnCloseModal.addEventListener('click', () => this.closeModal());
        btnCancelModal.addEventListener('click', () => this.closeModal());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });

        // Submit form
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveAssieme();
        });

        // Filtro
        filterInput.addEventListener('input', (e) => {
            this.filterAssiemi(e.target.value);
        });

        // Toggle "Tutti"
        toggleTutti.addEventListener('change', (e) => {
            if (e.target.checked) {
                checkboxesContainer.classList.add('disabled');
                checkboxesContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                    cb.checked = false;
                    cb.disabled = true;
                });
            } else {
                checkboxesContainer.classList.remove('disabled');
                checkboxesContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                    cb.disabled = false;
                });
            }
        });

        // Ricerca articoli
        this.setupArticoloSearch();
        
        // Filtro sottoassiemi nel modal
        this.setupSottoassiemiFilter();
    }

    setupSottoassiemiFilter() {
        const filterInput = document.getElementById('filterSottoassiemi');
        if (!filterInput) return;

        filterInput.addEventListener('input', (e) => {
            this.filterSottoassiemiCheckboxes(e.target.value);
        });
    }

    filterSottoassiemiCheckboxes(query) {
        const checkboxesContainer = document.getElementById('sottoassiemiCheckboxes');
        const noResults = document.getElementById('noResultsSottoassiemi');
        const labels = checkboxesContainer.querySelectorAll('label');
        const searchTerm = query.toLowerCase().trim();
        
        let visibleCount = 0;

        labels.forEach(label => {
            const text = label.textContent.toLowerCase();
            
            if (!searchTerm || text.includes(searchTerm)) {
                label.style.display = 'flex';
                visibleCount++;
            } else {
                label.style.display = 'none';
            }
        });

        // Mostra/nascondi messaggio "nessun risultato"
        if (visibleCount === 0 && searchTerm) {
            checkboxesContainer.style.display = 'none';
            noResults.style.display = 'block';
        } else {
            checkboxesContainer.style.display = 'grid';
            noResults.style.display = 'none';
        }
    }

    setupArticoloSearch() {
        const searchInput = document.getElementById('searchArticoloAssieme');
        const resultsDiv = document.getElementById('articoloResultsAssieme');
        let debounceTimer;

        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            const query = e.target.value.trim();

            if (query.length < 2) {
                resultsDiv.innerHTML = '';
                resultsDiv.classList.remove('active');
                return;
            }

            debounceTimer = setTimeout(() => {
                const results = this.searchArticoli(query);
                this.renderArticoloResults(results);
            }, 200);
        });

        // Chiudi risultati quando clicchi fuori
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !resultsDiv.contains(e.target)) {
                resultsDiv.classList.remove('active');
            }
        });
    }

    searchArticoli(query) {
        const q = query.toLowerCase();
        return this.articoli
            .filter(art => 
                art.codice.toLowerCase().includes(q) || 
                art.descrizione.toLowerCase().includes(q)
            )
            .slice(0, 20)
            .sort((a, b) => a.codice.localeCompare(b.codice));
    }

    renderArticoloResults(results) {
        const resultsDiv = document.getElementById('articoloResultsAssieme');
        
        if (results.length === 0) {
            resultsDiv.innerHTML = '<div class="search-result-item-dep" style="cursor: default;">Nessun risultato</div>';
            resultsDiv.classList.add('active');
            return;
        }

        resultsDiv.innerHTML = results.map(art => `
            <div class="search-result-item-dep" data-codice="${art.codice}">
                <div class="search-result-code">${art.codice}</div>
                <div class="search-result-desc">${art.descrizione}</div>
            </div>
        `).join('');

        resultsDiv.classList.add('active');

        // Aggiungi event listeners
        resultsDiv.querySelectorAll('.search-result-item-dep').forEach(item => {
            item.addEventListener('click', () => {
                const codice = item.dataset.codice;
                const articolo = this.articoli.find(a => a.codice === codice);
                if (articolo) {
                    this.addArticoloToSelection(articolo);
                    document.getElementById('searchArticoloAssieme').value = '';
                    resultsDiv.classList.remove('active');
                }
            });
        });
    }

    addArticoloToSelection(articolo) {
        const container = document.getElementById('selectedArticoliAssieme');
        
        // Verifica se già presente
        const existing = container.querySelector(`[data-codice="${articolo.codice}"]`);
        if (existing) {
            alert('Articolo già aggiunto!');
            return;
        }

        // Trova dipendenze per questo articolo
        const dipendenze = this.findDipendenze(articolo.codice);
        const hasDipendenze = dipendenze.length > 0;

        const item = document.createElement('div');
        item.className = 'selected-item-with-qty';
        item.dataset.codice = articolo.codice;
        item.style.flexDirection = 'column';
        item.style.gap = '8px';
        item.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; width: 100%;">
                <span class="selected-item-code-assieme">${articolo.codice}</span>
                <span class="selected-item-desc-assieme" style="flex: 1;">${articolo.descrizione}</span>
                <input type="number" class="qty-input-assieme" value="1" min="1" data-codice="${articolo.codice}">
                <select class="op-select-assieme" data-codice="${articolo.codice}">
                    <option value="SAME">STESSO OP</option>
                    ${this.sottoassiemiStandard.map(sa => `<option value="${sa.progressivo}">${sa.progressivo} - ${sa.descrizione}</option>`).join('')}
                </select>
                <button type="button" class="btn-remove-articolo-assieme" data-codice="${articolo.codice}">×</button>
            </div>
            ${hasDipendenze ? `
                <div class="dipendenze-info" style="background: rgba(10, 132, 255, 0.05); padding: 8px; border-radius: 4px; border-left: 3px solid var(--accent-blue); font-size: 11px;">
                    <div style="font-weight: 600; margin-bottom: 4px; color: var(--accent-blue);">Questo articolo genera dipendenze:</div>
                    ${dipendenze.map(dep => `<div style="color: var(--text-secondary);">${dep}</div>`).join('')}
                </div>
            ` : ''}
        `;

        container.appendChild(item);

        // Event listener rimozione
        item.querySelector('.btn-remove-articolo-assieme').addEventListener('click', (e) => {
            item.remove();
        });
    }

    // Trova dipendenze per un articolo trigger
    findDipendenze(codiceTrigger) {
        const result = [];
        
        if (!this.dipendenze || !Array.isArray(this.dipendenze)) {
            return result;
        }
        
        this.dipendenze.forEach(dep => {
            if (!dep.trigger || !Array.isArray(dep.trigger)) return;
            if (!dep.trigger.includes(codiceTrigger)) return;
            
            // Gestisci sia "target" (singolo) che "targets" (array)
            let targets = [];
            if (dep.targets && Array.isArray(dep.targets)) {
                targets = dep.targets;
            } else if (dep.target) {
                targets = [{ codice: dep.target, ratio: dep.ratio || 1 }];
            } else {
                return;
            }
            
            targets.forEach(target => {
                const targetCode = target.codice || target;
                const targetRatio = target.ratio || 1;
                const articoloTarget = this.articoli.find(a => a.codice === targetCode);
                const descTarget = articoloTarget ? articoloTarget.descrizione : targetCode;
                
                let opDest = '';
                if (dep.sottoassieme_destinazione === 'SAME') {
                    opDest = 'STESSO OP';
                } else {
                    const sa = this.sottoassiemiStandard.find(s => s.progressivo === dep.sottoassieme_destinazione);
                    opDest = sa ? `${sa.progressivo} - ${sa.descrizione}` : dep.sottoassieme_destinazione;
                }
                
                result.push(`→ ${targetCode} (${targetRatio}x) - ${descTarget} in ${opDest}`);
            });
        });
        
        return result;
    }

    openModal(assiemeId = null) {
        const modal = document.getElementById('assiemeModal');
        const title = document.getElementById('modalTitleAssieme');
        const form = document.getElementById('assiemeForm');
        
        // Reset form
        form.reset();
        document.getElementById('selectedArticoliAssieme').innerHTML = '';
        this.currentEditingId = assiemeId;

        if (assiemeId) {
            // Modalità modifica
            title.textContent = 'Modifica Assieme';
            const assieme = this.assiemi.find(a => a.id === assiemeId);
            if (assieme) {
                document.getElementById('assiemeId').value = assieme.id;
                document.getElementById('assiemeNome').value = assieme.nome;
                
                // Carica articoli
                assieme.articoli.forEach(item => {
                    const articolo = this.articoli.find(a => a.codice === item.codice);
                    if (articolo) {
                        this.addArticoloToSelection(articolo);
                        // Imposta quantità
                        const qtyInput = document.querySelector(`input.qty-input-assieme[data-codice="${item.codice}"]`);
                        if (qtyInput) qtyInput.value = item.quantita;
                        // Imposta OP destinazione
                        const opSelect = document.querySelector(`select.op-select-assieme[data-codice="${item.codice}"]`);
                        if (opSelect && item.op_destinazione) {
                            opSelect.value = item.op_destinazione;
                        }
                    }
                });

                // Carica disponibilità sottoassiemi
                if (assieme.disponibile_in === 'tutti') {
                    document.getElementById('assiemeTuttiOP').checked = true;
                    document.getElementById('sottoassiemiCheckboxes').classList.add('disabled');
                } else {
                    document.getElementById('assiemeTuttiOP').checked = false;
                    assieme.disponibile_in.forEach(prog => {
                        const checkbox = document.querySelector(`#sottoassiemiCheckboxes input[value="${prog}"]`);
                        if (checkbox) checkbox.checked = true;
                    });
                }
            }
        } else {
            // Modalità creazione
            title.textContent = 'Nuovo Assieme';
            const newId = this.generateId();
            document.getElementById('assiemeId').value = newId;
            document.getElementById('assiemeTuttiOP').checked = true;
            document.getElementById('sottoassiemiCheckboxes').classList.add('disabled');
        }

        // Genera checkbox sottoassiemi
        this.renderSottoassiemiCheckboxes();
        
        // Reset filtro sottoassiemi
        const filterSottoassiemi = document.getElementById('filterSottoassiemi');
        if (filterSottoassiemi) {
            filterSottoassiemi.value = '';
            this.filterSottoassiemiCheckboxes(''); // Mostra tutti
        }

        modal.style.display = 'flex';
    }

    renderSottoassiemiCheckboxes() {
        const container = document.getElementById('sottoassiemiCheckboxes');
        container.innerHTML = this.sottoassiemiStandard.map(sa => `
            <label>
                <input type="checkbox" value="${sa.progressivo}">
                <span>${sa.progressivo} - ${sa.descrizione}</span>
            </label>
        `).join('');
    }

    closeModal() {
        document.getElementById('assiemeModal').style.display = 'none';
        this.currentEditingId = null;
    }

    saveAssieme() {
        const id = document.getElementById('assiemeId').value;
        const nome = document.getElementById('assiemeNome').value.trim();
        
        if (!nome) {
            alert('Inserisci un nome per l\'assieme!');
            return;
        }

        // Raccogli articoli
        const articoliItems = [];
        document.querySelectorAll('#selectedArticoliAssieme .selected-item-with-qty').forEach(item => {
            const codice = item.dataset.codice;
            const qtyInput = item.querySelector('.qty-input-assieme');
            const opSelect = item.querySelector('.op-select-assieme');
            const quantita = parseInt(qtyInput.value) || 1;
            const op_destinazione = opSelect ? opSelect.value : 'SAME';
            articoliItems.push({ codice, quantita, op_destinazione });
        });

        if (articoliItems.length === 0) {
            alert('Aggiungi almeno un articolo!');
            return;
        }

        // Raccogli disponibilità
        let disponibile_in;
        if (document.getElementById('assiemeTuttiOP').checked) {
            disponibile_in = 'tutti';
        } else {
            disponibile_in = [];
            document.querySelectorAll('#sottoassiemiCheckboxes input[type="checkbox"]:checked').forEach(cb => {
                disponibile_in.push(cb.value);
            });
            
            if (disponibile_in.length === 0) {
                alert('Seleziona almeno un sottoassieme o abilita "Tutti"!');
                return;
            }
        }

        const assiemeData = {
            id,
            nome,
            articoli: articoliItems,
            disponibile_in
        };

        if (this.currentEditingId) {
            // Modifica esistente
            const index = this.assiemi.findIndex(a => a.id === this.currentEditingId);
            if (index !== -1) {
                this.assiemi[index] = assiemeData;
            }
        } else {
            // Nuovo
            this.assiemi.push(assiemeData);
        }

        this.saveToLocalStorage();
        this.renderAssiemi();
        this.updateStats();
        this.closeModal();
    }

    deleteAssieme(id) {
        if (!confirm('Sei sicuro di voler eliminare questo assieme?')) return;
        
        this.assiemi = this.assiemi.filter(a => a.id !== id);
        this.saveToLocalStorage();
        this.renderAssiemi();
        this.updateStats();
    }

    renderAssiemi() {
        const container = document.getElementById('assiemiList');
        const emptyState = document.getElementById('emptyStateAssiemi');

        if (this.assiemi.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        container.innerHTML = this.assiemi.map(assieme => this.renderAssiemeCard(assieme)).join('');

        // Attach event listeners
        container.querySelectorAll('.btn-edit-assieme').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.openModal(id);
            });
        });

        container.querySelectorAll('.btn-delete-assieme').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.deleteAssieme(id);
            });
        });
    }

    renderAssiemeCard(assieme) {
        const articoliHTML = assieme.articoli.map(item => {
            const articolo = this.articoli.find(a => a.codice === item.codice);
            const desc = articolo ? articolo.descrizione : '???';
            return `
                <div class="assieme-articolo-item" title="${desc}">
                    <span>${item.codice}</span>
                    <span class="assieme-articolo-qty">${item.quantita}x</span>
                </div>
            `;
        }).join('');

        let disponibilitaHTML;
        if (assieme.disponibile_in === 'tutti') {
            disponibilitaHTML = '<span class="assieme-sa-badge tutti">Tutti i sottoassiemi</span>';
        } else {
            disponibilitaHTML = assieme.disponibile_in.map(prog => {
                const sa = this.sottoassiemiStandard.find(s => s.progressivo === prog);
                const label = sa ? `${prog} - ${sa.descrizione}` : prog;
                return `<span class="assieme-sa-badge">${label}</span>`;
            }).join('');
        }

        return `
            <div class="assieme-card" data-id="${assieme.id}">
                <div class="assieme-header-card">
                    <div class="assieme-name">
                        📦 ${assieme.nome}
                        <span class="assieme-id">${assieme.id}</span>
                    </div>
                    <div class="assieme-actions">
                        <button class="btn-edit-assieme" data-id="${assieme.id}">✏️</button>
                        <button class="btn-delete-assieme" data-id="${assieme.id}">🗑️</button>
                    </div>
                </div>
                <div class="assieme-body">
                    <div class="assieme-section">
                        <div class="assieme-label">Articoli (${assieme.articoli.length})</div>
                        <div class="assieme-articoli">
                            ${articoliHTML}
                        </div>
                    </div>
                    <div class="assieme-section">
                        <div class="assieme-label">Disponibile in</div>
                        <div class="assieme-sottoassiemi">
                            ${disponibilitaHTML}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    filterAssiemi(query) {
        const cards = document.querySelectorAll('.assieme-card');
        const searchTerm = query.toLowerCase().trim();
        let visibleCount = 0;

        cards.forEach(card => {
            const id = card.dataset.id;
            const assieme = this.assiemi.find(a => a.id === id);
            
            if (!assieme) {
                card.classList.add('hidden');
                return;
            }

            if (!searchTerm) {
                card.classList.remove('hidden');
                visibleCount++;
                return;
            }

            const nome = assieme.nome.toLowerCase();
            const articoliCodici = assieme.articoli.map(a => a.codice.toLowerCase()).join(' ');
            
            const matches = nome.includes(searchTerm) || articoliCodici.includes(searchTerm);
            
            if (matches) {
                card.classList.remove('hidden');
                visibleCount++;
            } else {
                card.classList.add('hidden');
            }
        });

        this.updateStats(visibleCount);
    }

    updateStats(visible = null) {
        const totalEl = document.getElementById('totalAssiemi');
        const visibleEl = document.getElementById('visibleAssiemi');
        
        const total = this.assiemi.length;
        const visibleNum = visible !== null ? visible : total;
        
        totalEl.textContent = total;
        visibleEl.textContent = visibleNum;
    }

    generateId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 7);
        return `ASS_${timestamp}_${random}`.toUpperCase();
    }

    saveToLocalStorage() {
        localStorage.setItem('assiemi', JSON.stringify(this.assiemi));
    }

    exportJSON() {
        const dataStr = JSON.stringify(this.assiemi, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'assiemi.json';
        link.click();
        URL.revokeObjectURL(url);
    }
}

// Inizializza
const assiemiManager = new AssiemiManager();
assiemiManager.init();
