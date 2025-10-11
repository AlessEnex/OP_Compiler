// Gestione UI e rendering

const UI = {
    // Renderizza tutti i sottoassiemi
// Renderizza tutti i sottoassiemi
renderSottoassiemi() {
    sottoassiemiContainer.innerHTML = '';

    bomManager.sottoassiemi.forEach(sottoassieme => {
        const card = this.createSottoassiemeCard(sottoassieme);
        sottoassiemiContainer.appendChild(card);
        
        // ✅ Ripristina lo stato expanded se era aperto
        if (sottoassieme.expanded) {
            const toggle = card.querySelector('.sottoassieme-toggle');
            const content = card.querySelector('.sottoassieme-content');
            
            toggle.classList.add('expanded');
            content.classList.add('expanded');
            
            // Renderizza il contenuto
            this.renderSottoassiemeContent(sottoassieme, content);
        }
    });
    
    SottoassiemiFilter.updateStats();
    updateMultiSelectBar();
},

    // Crea card sottoassieme
    createSottoassiemeCard(sottoassieme) {
        const card = document.createElement('div');
        card.className = 'sottoassieme-card';
        card.dataset.progressivo = sottoassieme.progressivo;

        const header = document.createElement('div');
        header.className = 'sottoassieme-header';

        // Checkbox per selezione multipla
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'sottoassieme-checkbox';
        checkbox.onclick = (e) => {
            e.stopPropagation();
            card.classList.toggle('selected');
            updateMultiSelectBar();
        };

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
            
            // ✅ Se viene completato e è espanso, comprimi
            if (sottoassieme.completed && sottoassieme.expanded) {
                sottoassieme.expanded = false;
                const toggle = card.querySelector('.sottoassieme-toggle');
                const content = card.querySelector('.sottoassieme-content');
                toggle.classList.remove('expanded');
                content.classList.remove('expanded');
            }
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
                    UI.renderSottoassiemi();
                }
            );
        };

        header.appendChild(checkbox);
        header.appendChild(toggle);
        header.appendChild(code);
        header.appendChild(desc);
        header.appendChild(btnCheck);
        header.appendChild(btnDelete);

        const content = document.createElement('div');
        content.className = 'sottoassieme-content';

        // Toggle expand/collapse
        header.onclick = (e) => {
            if (e.target === btnDelete || e.target === checkbox) return;
            sottoassieme.expanded = !sottoassieme.expanded;
            toggle.classList.toggle('expanded', sottoassieme.expanded);
            content.classList.toggle('expanded', sottoassieme.expanded);
            
            if (sottoassieme.expanded && content.children.length === 0) {
                this.renderSottoassiemeContent(sottoassieme, content);
            }
        };

        card.appendChild(header);
        card.appendChild(content);

        return card;
    },

    // Renderizza contenuto sottoassieme
    renderSottoassiemeContent(sottoassieme, container) {
        container.innerHTML = '';

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

        const articoliSection = document.createElement('div');
        articoliSection.className = 'articoli-section';
        articoliSection.innerHTML = '<div class="articoli-list"></div>';

        container.appendChild(searchSection);
        container.appendChild(articoliSection);

        this.setupSearchEvents(sottoassieme, searchSection);
        this.renderArticoliList(sottoassieme, articoliSection.querySelector('.articoli-list'));
    },

    // Setup eventi ricerca
    setupSearchEvents(sottoassieme, searchSection) {
        const toggleSwitches = searchSection.querySelectorAll('.toggle-switch-mini');
        const panels = searchSection.querySelectorAll('.search-panel');
        
        if (toggleSwitches.length === 0) return;
        
        toggleSwitches.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                
                const nuovoStato = !toggle.classList.contains('active');
                
                toggleSwitches.forEach(t => {
                    if (nuovoStato) {
                        t.classList.add('active');
                    } else {
                        t.classList.remove('active');
                    }
                });
                
                panels.forEach(p => p.classList.remove('active'));
                
                const allCodiceLabels = searchSection.querySelectorAll('[data-mode="codice"]');
                const allDescrizioneLabels = searchSection.querySelectorAll('[data-mode="descrizione"]');
                
                if (nuovoStato) {
                    searchSection.querySelector('[data-panel="descrizione"]').classList.add('active');
                    allCodiceLabels.forEach(l => l.style.color = 'var(--text-tertiary)');
                    allDescrizioneLabels.forEach(l => l.style.color = 'var(--accent-blue)');
                } else {
                    searchSection.querySelector('[data-panel="codice"]').classList.add('active');
                    allCodiceLabels.forEach(l => l.style.color = 'var(--accent-blue)');
                    allDescrizioneLabels.forEach(l => l.style.color = 'var(--text-tertiary)');
                }
            });
        });

        const searchCodice = searchSection.querySelector('[data-search="codice"]');
        const resultsCodice = searchSection.querySelector('[data-results="codice"]');
        
        searchCodice.addEventListener('input', (e) => {
            const results = bomManager.searchArticoli(e.target.value, 'codice');
            this.renderSearchResults(results, resultsCodice, sottoassieme);
        });

        const searchDesc1 = searchSection.querySelector('[data-search="desc1"]');
        const searchDesc2 = searchSection.querySelector('[data-search="desc2"]');
        const resultsDesc = searchSection.querySelector('[data-results="descrizione"]');
        
        const searchDescrizione = () => {
            const results = bomManager.searchArticoliByDescrizione(searchDesc1.value, searchDesc2.value);
            this.renderSearchResults(results, resultsDesc, sottoassieme);
        };
        
        searchDesc1.addEventListener('input', searchDescrizione);
        searchDesc2.addEventListener('input', searchDescrizione);
    },

    // Renderizza risultati ricerca
    renderSearchResults(results, container, sottoassieme) {
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
                    this.showVariantModal(item, sottoassieme, container);
                } else {
                    bomManager.addArticolo(sottoassieme.progressivo, item, 1);
                    const articoliList = container.closest('.sottoassieme-content').querySelector('.articoli-list');
                    this.renderArticoliList(sottoassieme, articoliList);
                    container.innerHTML = '';
                    container.closest('.search-content').querySelectorAll('.search-input').forEach(input => input.value = '');
                    
                    this.refreshAllExpanded();
                }
            };
            
            container.appendChild(resultItem);
        });
    },

    // Mostra modal varianti phantom
    showVariantModal(phantom, sottoassieme, searchContainer) {
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
        
        modal.querySelectorAll('.variante-option').forEach(option => {
            option.onclick = () => {
                const variantCode = option.dataset.variant;
                bomManager.addArticolo(sottoassieme.progressivo, phantom, 1, variantCode);
                const articoliList = searchContainer.closest('.sottoassieme-content').querySelector('.articoli-list');
                this.renderArticoliList(sottoassieme, articoliList);
                searchContainer.innerHTML = '';
                searchContainer.closest('.search-content').querySelectorAll('.search-input').forEach(input => input.value = '');
                modal.remove();
                
                this.refreshAllExpanded();
            };
        });
        
        modal.querySelector('.btn-cancel').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    },

    // Renderizza lista articoli
    renderArticoliList(sottoassieme, container) {
        if (sottoassieme.articoli.length === 0) {
            container.innerHTML = '<div class="empty-articoli">Nessun articolo inserito</div>';
            return;
        }

        container.innerHTML = '';
        sottoassieme.articoli.forEach(articolo => {
            const item = document.createElement('div');
            item.className = 'articolo-item';
            
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

            const qtyInput = item.querySelector('.qty-input');
            const btnMinus = item.querySelector('[data-action="minus"]');
            const btnPlus = item.querySelector('[data-action="plus"]');
            const btnRemove = item.querySelector('.btn-remove');

            btnMinus.onclick = () => {
                bomManager.updateQuantita(sottoassieme.progressivo, articolo.codice, -1, articolo.phantomPadre);
                qtyInput.value = articolo.quantita;
                this.refreshAllExpanded();
            };

            btnPlus.onclick = () => {
                bomManager.updateQuantita(sottoassieme.progressivo, articolo.codice, 1, articolo.phantomPadre);
                qtyInput.value = articolo.quantita;
                this.refreshAllExpanded();
            };

            qtyInput.addEventListener('change', (e) => {
                bomManager.setQuantita(sottoassieme.progressivo, articolo.codice, e.target.value, articolo.phantomPadre);
                qtyInput.value = articolo.quantita;
                this.refreshAllExpanded();
            });

            btnRemove.onclick = () => {
                showConfirm(
                    'Rimuovi articolo',
                    `Rimuovere "${articolo.codice}" da questo sottoassieme?`,
                    () => {
                        bomManager.removeArticolo(sottoassieme.progressivo, articolo.codice, articolo.phantomPadre);
                        this.renderArticoliList(sottoassieme, container);
                        this.refreshAllExpanded();
                    }
                );
            };

            container.appendChild(item);
        });
    },

    // Refresh sottoassiemi espansi
    refreshAllExpanded() {
        bomManager.sottoassiemi.forEach(sa => {
            if (sa.expanded) {
                const card = document.querySelector(`[data-progressivo="${sa.progressivo}"]`);
                if (card) {
                    const content = card.querySelector('.sottoassieme-content');
                    const articoliList = content.querySelector('.articoli-list');
                    if (articoliList) {
                        this.renderArticoliList(sa, articoliList);
                    }
                }
            }
        });
    }
};