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
                    <button class="btn-add-assieme" data-progressivo="${sottoassieme.progressivo}" style="padding: 8px 14px; background: transparent; border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-secondary); font-size: 12px; font-weight: 500; cursor: pointer; white-space: nowrap; transition: all 0.15s ease;">
                        + Assieme
                    </button>
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
        
        // Bottone Aggiungi Assieme
        const btnAddAssieme = searchSection.querySelector('.btn-add-assieme');
        if (btnAddAssieme) {
            btnAddAssieme.addEventListener('click', () => {
                this.openAssiemeModal(sottoassieme);
            });
            
            // Hover effect
            btnAddAssieme.addEventListener('mouseenter', () => {
                btnAddAssieme.style.background = 'var(--bg-tertiary)';
                btnAddAssieme.style.borderColor = 'var(--separator)';
                btnAddAssieme.style.color = 'var(--text-primary)';
            });
            btnAddAssieme.addEventListener('mouseleave', () => {
                btnAddAssieme.style.background = 'transparent';
                btnAddAssieme.style.borderColor = 'var(--border-color)';
                btnAddAssieme.style.color = 'var(--text-secondary)';
            });
        }
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

    // Renderizza lista articoli con supporto gruppi assiemi
    renderArticoliList(sottoassieme, container) {
        if (sottoassieme.articoli.length === 0 && sottoassieme.gruppiAssiemi.length === 0) {
            container.innerHTML = '<div class="empty-articoli">Nessun articolo inserito</div>';
            return;
        }

        container.innerHTML = '';
        
        // Raggruppa articoli per gruppoAssieme
        const articoliPerGruppo = {};
        const articoliSingoli = [];
        
        sottoassieme.articoli.forEach(articolo => {
            if (articolo.gruppoAssieme) {
                if (!articoliPerGruppo[articolo.gruppoAssieme]) {
                    articoliPerGruppo[articolo.gruppoAssieme] = [];
                }
                articoliPerGruppo[articolo.gruppoAssieme].push(articolo);
            } else {
                articoliSingoli.push(articolo);
            }
        });
        
        // Renderizza gruppi assiemi
        sottoassieme.gruppiAssiemi.forEach(gruppo => {
            const articoliGruppo = articoliPerGruppo[gruppo.id] || [];
            this.renderGruppoAssieme(sottoassieme, gruppo, articoliGruppo, container);
        });
        
        // Renderizza articoli singoli
        articoliSingoli.forEach(articolo => {
            this.renderArticoloSingolo(sottoassieme, articolo, container);
        });
    },
    
    // Renderizza un gruppo assieme
    renderGruppoAssieme(sottoassieme, gruppo, articoli, container) {
        const gruppoDiv = document.createElement('div');
        gruppoDiv.className = 'gruppo-assieme';
        gruppoDiv.style.cssText = `
            background: rgba(10, 132, 255, 0.03);
            border-left: 3px solid var(--accent-blue);
            padding: 12px;
            margin-bottom: 12px;
            border-radius: 6px;
        `;
        
        // Header del gruppo
        const headerDiv = document.createElement('div');
        headerDiv.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--border-color);
        `;
        
        headerDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 14px; font-weight: 700;">${gruppo.nomeAssieme}</span>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <button class="qty-btn-gruppo" data-action="minus" style="width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; background: none; border: none; color: #222; font-size: 14px; cursor: pointer;">−</button>
                    <input type="number" class="qty-input-gruppo" value="${gruppo.quantitaAssieme}" min="1" style="width: 40px; text-align: center; padding: 2px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 4px; font-size: 12px;">
                    <button class="qty-btn-gruppo" data-action="plus" style="width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; background: none; border: none; color: #222; font-size: 14px; cursor: pointer;">+</button>
                    <span style="font-size: 12px; color: var(--text-tertiary); margin-left: 4px;">x assieme</span>
                </div>
            </div>
            <button class="btn-remove-gruppo" style="width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; background: none; border: none; color: #c62828; font-size: 16px; cursor: pointer;">×</button>
        `;
        
        gruppoDiv.appendChild(headerDiv);
        
        // Eventi per header
        const qtyInput = headerDiv.querySelector('.qty-input-gruppo');
        const btnMinus = headerDiv.querySelector('[data-action="minus"]');
        const btnPlus = headerDiv.querySelector('[data-action="plus"]');
        const btnRemove = headerDiv.querySelector('.btn-remove-gruppo');
        
        btnMinus.onclick = () => {
            const newQty = Math.max(1, gruppo.quantitaAssieme - 1);
            bomManager.updateQuantitaGruppoAssieme(sottoassieme.progressivo, gruppo.id, newQty);
            this.refreshAllExpanded();
        };
        
        btnPlus.onclick = () => {
            bomManager.updateQuantitaGruppoAssieme(sottoassieme.progressivo, gruppo.id, gruppo.quantitaAssieme + 1);
            this.refreshAllExpanded();
        };
        
        qtyInput.addEventListener('change', (e) => {
            const newQty = Math.max(1, parseInt(e.target.value) || 1);
            bomManager.updateQuantitaGruppoAssieme(sottoassieme.progressivo, gruppo.id, newQty);
            this.refreshAllExpanded();
        });
        
        btnRemove.onclick = () => {
            showConfirm(
                'Rimuovi assieme',
                `Rimuovere "${gruppo.nomeAssieme}" da questo sottoassieme?`,
                () => {
                    bomManager.removeGruppoAssieme(sottoassieme.progressivo, gruppo.id);
                    this.refreshAllExpanded();
                }
            );
        };
        
        // Articoli del gruppo
        articoli.forEach(articolo => {
            const item = document.createElement('div');
            item.className = 'articolo-item';
            item.style.cssText = `
                grid-template-columns: 20px 110px 1fr 130px 40px;
                padding-left: 0;
            `;
            
            if (articolo.trovato === false) {
                item.classList.add('not-found');
            }
            
            item.innerHTML = `
                <div style="color: var(--accent-blue); font-size: 16px;">└</div>
                <div class="articolo-code">${articolo.codice}</div>
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
                bomManager.updateQuantita(sottoassieme.progressivo, articolo.codice, -1, articolo.phantomPadre, articolo.gruppoAssieme);
                qtyInput.value = articolo.quantita;
                this.refreshAllExpanded();
            };

            btnPlus.onclick = () => {
                bomManager.updateQuantita(sottoassieme.progressivo, articolo.codice, 1, articolo.phantomPadre, articolo.gruppoAssieme);
                qtyInput.value = articolo.quantita;
                this.refreshAllExpanded();
            };

            qtyInput.addEventListener('change', (e) => {
                bomManager.setQuantita(sottoassieme.progressivo, articolo.codice, e.target.value, articolo.phantomPadre, articolo.gruppoAssieme);
                qtyInput.value = articolo.quantita;
                this.refreshAllExpanded();
            });

            btnRemove.onclick = () => {
                bomManager.removeArticolo(sottoassieme.progressivo, articolo.codice, articolo.phantomPadre, articolo.gruppoAssieme);
                this.refreshAllExpanded();
            };
            
            gruppoDiv.appendChild(item);
        });
        
        container.appendChild(gruppoDiv);
    },
    
    // Renderizza un singolo articolo (non in gruppo)
    renderArticoloSingolo(sottoassieme, articolo, container) {
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
    },
    
    // Apre modal per selezionare assieme
    openAssiemeModal(sottoassieme) {
        const assiemiDisponibili = bomManager.getAssiemiDisponibili(sottoassieme.progressivo);
        
        if (assiemiDisponibili.length === 0) {
            alert('Nessun assieme disponibile per questo sottoassieme.\n\nVai su Assiemi per crearne di nuovi!');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <div class="modal-title">Seleziona Assieme</div>
                    <div class="modal-subtitle">Scegli un assieme da aggiungere a ${sottoassieme.codice}</div>
                </div>
                
                <div style="padding: 0 24px 24px 24px;">
                    <!-- Prima riga: Ricerca per nome assieme -->
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-tertiary); margin-bottom: 6px;">Ricerca per nome assieme</label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                            <input type="text" id="searchNome1" class="search-input-assieme-modal" placeholder="Parola chiave 1...">
                            <input type="text" id="searchNome2" class="search-input-assieme-modal" placeholder="Parola chiave 2...">
                        </div>
                    </div>
                    
                    <!-- Seconda riga: Ricerca per articoli contenuti -->
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-tertiary); margin-bottom: 6px;">Ricerca per articoli contenuti</label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
                            <input type="text" id="searchDesc1" class="search-input-assieme-modal" placeholder="Descrizione 1...">
                            <input type="text" id="searchDesc2" class="search-input-assieme-modal" placeholder="Descrizione 2...">
                            <input type="text" id="searchCodice" class="search-input-assieme-modal" placeholder="Codice...">
                        </div>
                    </div>
                    
                    <!-- Lista assiemi -->
                    <div id="assiemiListContainer" style="max-height: 350px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 8px; padding: 8px; background: var(--bg-tertiary);">
                        <!-- Gli assiemi verranno renderizzati qui -->
                    </div>
                    
                    <div id="noResultsAssiemi" style="display: none; padding: 32px; text-align: center; color: var(--text-tertiary); font-size: 13px;">
                        Nessun assieme trovato con i criteri di ricerca
                    </div>
                </div>
                
                <div class="modal-actions" style="padding: 16px 24px; border-top: 1px solid var(--border-color);">
                    <button class="btn-cancel">Annulla</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const listContainer = modal.querySelector('#assiemiListContainer');
        const noResults = modal.querySelector('#noResultsAssiemi');
        
        // Funzione per renderizzare assiemi filtrati
        const renderAssiemi = (assiemiFiltrati) => {
            if (assiemiFiltrati.length === 0) {
                listContainer.style.display = 'none';
                noResults.style.display = 'block';
                return;
            }
            
            listContainer.style.display = 'block';
            noResults.style.display = 'none';
            listContainer.innerHTML = '';
            
            assiemiFiltrati.forEach(assieme => {
                const articoliPreview = assieme.articoli
                    .map(a => {
                        const art = bomManager.articoli.find(art => art.codice === a.codice);
                        const desc = art ? art.descrizione : '???';
                        return `${a.codice} (${a.quantita}x) - ${desc}`;
                    })
                    .join(', ');
                
                const option = document.createElement('div');
                option.className = 'assieme-option-filterable';
                option.dataset.id = assieme.id;
                option.dataset.qty = '1';
                option.style.cssText = 'padding: 12px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; transition: all 0.15s ease; margin-bottom: 6px;';
                option.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <div style="font-weight: 700; font-size: 14px;">${assieme.nome}</div>
                        <div class="qty-controls" style="display: flex; align-items: center; gap: 6px;">
                            <button class="qty-btn-minus" style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-primary); font-size: 14px; cursor: pointer; font-weight: 600;">−</button>
                            <span class="qty-display" style="min-width: 30px; text-align: center; font-weight: 600; font-size: 14px;">1</span>
                            <button class="qty-btn-plus" style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-primary); font-size: 14px; cursor: pointer; font-weight: 600;">+</button>
                        </div>
                    </div>
                    <div style="font-size: 11px; color: var(--text-secondary); line-height: 1.4;">${articoliPreview}</div>
                `;
                
                const qtyDisplay = option.querySelector('.qty-display');
                const btnMinus = option.querySelector('.qty-btn-minus');
                const btnPlus = option.querySelector('.qty-btn-plus');
                
                // Eventi quantità
                btnMinus.addEventListener('click', (e) => {
                    e.stopPropagation();
                    let qty = parseInt(option.dataset.qty);
                    if (qty > 1) {
                        qty--;
                        option.dataset.qty = qty;
                        qtyDisplay.textContent = qty;
                    }
                });
                
                btnPlus.addEventListener('click', (e) => {
                    e.stopPropagation();
                    let qty = parseInt(option.dataset.qty);
                    qty++;
                    option.dataset.qty = qty;
                    qtyDisplay.textContent = qty;
                });
                
                option.addEventListener('mouseenter', () => {
                    option.style.background = 'var(--bg-elevated)';
                    option.style.borderColor = 'var(--separator)';
                });
                option.addEventListener('mouseleave', () => {
                    option.style.background = 'var(--bg-secondary)';
                    option.style.borderColor = 'var(--border-color)';
                });
                
                option.onclick = (e) => {
                    // Se clicco sui bottoni quantità, non fare nulla
                    if (e.target.closest('.qty-controls')) return;
                    
                    const qty = parseInt(option.dataset.qty);
                    bomManager.addAssieme(sottoassieme.progressivo, assieme.id, qty);
                    this.refreshAllExpanded();
                    modal.remove();
                };
                
                listContainer.appendChild(option);
            });
        };
        
        // Funzione di filtro
        const filterAssiemi = () => {
            const nome1 = modal.querySelector('#searchNome1').value.toLowerCase().trim();
            const nome2 = modal.querySelector('#searchNome2').value.toLowerCase().trim();
            const desc1 = modal.querySelector('#searchDesc1').value.toLowerCase().trim();
            const desc2 = modal.querySelector('#searchDesc2').value.toLowerCase().trim();
            const codice = modal.querySelector('#searchCodice').value.toLowerCase().trim();
            
            const filtrati = assiemiDisponibili.filter(assieme => {
                const nomeAssieme = assieme.nome.toLowerCase();
                
                // Filtro per nome assieme
                if (nome1 && !nomeAssieme.includes(nome1)) return false;
                if (nome2 && !nomeAssieme.includes(nome2)) return false;
                
                // Filtro per articoli contenuti
                if (desc1 || desc2 || codice) {
                    const articoliMatch = assieme.articoli.some(item => {
                        const art = bomManager.articoli.find(a => a.codice === item.codice);
                        const artCodice = item.codice.toLowerCase();
                        const artDesc = art ? art.descrizione.toLowerCase() : '';
                        
                        let match = true;
                        
                        if (codice && !artCodice.includes(codice)) match = false;
                        if (desc1 && !artDesc.includes(desc1)) match = false;
                        if (desc2 && !artDesc.includes(desc2)) match = false;
                        
                        return match;
                    });
                    
                    if (!articoliMatch) return false;
                }
                
                return true;
            });
            
            renderAssiemi(filtrati);
        };
        
        // Render iniziale
        renderAssiemi(assiemiDisponibili);
        
        // Event listeners per i filtri
        ['searchNome1', 'searchNome2', 'searchDesc1', 'searchDesc2', 'searchCodice'].forEach(id => {
            const input = modal.querySelector(`#${id}`);
            input.addEventListener('input', filterAssiemi);
        });
        
        // Eventi chiusura
        modal.querySelector('.btn-cancel').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }
};