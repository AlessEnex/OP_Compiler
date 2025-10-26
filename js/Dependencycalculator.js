// 🔗 Sistema Calcolo Dipendenze MANUALE

const DependencyCalculator = {
    modal: null,
    proposals: [],
    
    elements: {},

    setup() {
        this.modal = document.getElementById('dependencyModal');
        
        this.elements = {
            btnCalculate: document.getElementById('btnCalculateDeps'),
            btnClose: document.getElementById('btnCloseDepsModal'),
            btnCancel: document.getElementById('btnCancelDeps'),
            btnApply: document.getElementById('btnApplyDeps'),
            triggerPanel: document.getElementById('triggerPanel'),
            targetPanel: document.getElementById('targetPanel'),
            statsEl: document.getElementById('depsStats')
        };

        if (!this.elements.btnCalculate || !this.modal) {
            console.warn('⚠️ Elementi dependency calculator non trovati');
            return;
        }

        this.attachEvents();
        console.log('✅ Dependency Calculator inizializzato');
    },

    attachEvents() {
        const { btnCalculate, btnClose, btnCancel, btnApply } = this.elements;

        btnCalculate.addEventListener('click', () => {
            this.calculate();
        });

        btnClose.addEventListener('click', () => this.close());
        btnCancel.addEventListener('click', () => this.close());
        
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });

        btnApply.addEventListener('click', () => {
            this.apply();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'flex') {
                this.close();
            }
        });
    },

    calculate() {
        console.log('🔄 Inizio calcolo dipendenze manuale...');
        
        this.proposals = bomManager.calculateDependenciesPreview();
        
        console.log(`📊 Generate ${this.proposals.length} proposte di dipendenza`);
        
        if (this.proposals.length === 0) {
            alert('✅ Nessuna dipendenza da applicare.\n\nNon ci sono articoli trigger che attivano dipendenze.');
            return;
        }

        this.render();
        this.modal.style.display = 'flex';
    },

    render() {
        const { triggerPanel, targetPanel, statsEl } = this.elements;

        triggerPanel.innerHTML = '<div class="dep-calc-panel-title">📦 ARTICOLI TRIGGER (Impegnati)</div>';
        targetPanel.innerHTML = '<div class="dep-calc-panel-title">🎯 ARTICOLI TARGET (Da Aggiungere)</div>';

        let totalToAdd = 0;
        let totalToRemove = 0;
        let totalCorrect = 0;

        const groupedByTarget = {};
        
        this.proposals.forEach((p, index) => {
            p.index = index;
            
            const key = p.targetOP;
            if (!groupedByTarget[key]) {
                groupedByTarget[key] = [];
            }
            groupedByTarget[key].push(p);
            
            // Conta in base al delta
            if (p.targetQuantita > 0) {
                totalToAdd++;
            } else if (p.targetQuantita < 0) {
                totalToRemove++;
            } else {
                totalCorrect++;
            }
        });

        const triggersByOP = {};
        this.proposals.forEach(p => {
            if (p.triggersByOP) {
                Object.keys(p.triggersByOP).forEach(opCode => {
                    if (!triggersByOP[opCode]) {
                        triggersByOP[opCode] = [];
                    }
                    p.triggersByOP[opCode].forEach(t => {
                        if (!triggersByOP[opCode].some(existing => existing.codice === t.codice)) {
                            triggersByOP[opCode].push(t);
                        }
                    });
                });
            } else if (p.triggersFound) {
                const opCode = p.triggerOP;
                if (!triggersByOP[opCode]) {
                    triggersByOP[opCode] = [];
                }
                p.triggersFound.forEach(t => {
                    if (!triggersByOP[opCode].some(existing => existing.codice === t.codice)) {
                        triggersByOP[opCode].push(t);
                    }
                });
            }
        });

        Object.keys(triggersByOP).sort().forEach(opCode => {
            const triggers = triggersByOP[opCode];
            
            const opBlock = document.createElement('div');
            opBlock.className = 'dep-calc-op-block';
            
            const opHeader = document.createElement('div');
            opHeader.className = 'dep-calc-op-header';
            opHeader.textContent = opCode;
            
            const triggerList = document.createElement('div');
            triggerList.className = 'dep-calc-trigger-list';
            
            triggers.forEach(trigger => {
                const triggerItem = document.createElement('div');
                triggerItem.className = 'dep-calc-trigger-item';
                
                const articolo = bomManager.findArticolo(trigger.codice);
                const desc = articolo.descrizione || '';
                
                triggerItem.innerHTML = `
                    <div>
                        <span class="dep-calc-code">${trigger.codice}</span>
                        <span class="dep-calc-desc">${desc}</span>
                    </div>
                    <span class="dep-calc-qty">${trigger.quantita}x</span>
                `;
                triggerList.appendChild(triggerItem);
            });
            
            opBlock.appendChild(opHeader);
            opBlock.appendChild(triggerList);
            triggerPanel.appendChild(opBlock);
        });

        Object.keys(groupedByTarget).sort().forEach(targetOP => {
            const proposals = groupedByTarget[targetOP];
            
            const opBlock = document.createElement('div');
            opBlock.className = 'dep-calc-op-block target';
            
            const opHeader = document.createElement('div');
            opHeader.className = 'dep-calc-op-header target';
            opHeader.innerHTML = `→ ${targetOP}`;
            
            const targetList = document.createElement('div');
            targetList.className = 'dep-calc-target-list';
            
            proposals.forEach(p => {
                // Salta se rimosso manualmente
                if (p.removed) return;
                
                const targetItem = document.createElement('div');
                
                let statusText = '';
                let statusClass = 'neutral';
                
                // Determina stato in base al delta
                if (p.targetQuantita > 0) {
                    statusText = `AGGIUNGI ${p.targetQuantita}x (Richiesti: ${p.quantitaRichiesta}, Presenti: ${p.quantitaPresente})`;
                    statusClass = 'success';
                } else if (p.targetQuantita < 0) {
                    statusText = `RIMUOVI ${Math.abs(p.targetQuantita)}x (Richiesti: ${p.quantitaRichiesta}, Presenti: ${p.quantitaPresente})`;
                    statusClass = 'remove';
                } else {
                    statusText = `GIÀ CORRETTO (Richiesti: ${p.quantitaRichiesta}, Presenti: ${p.quantitaPresente})`;
                    statusClass = 'correct';
                }
                
                targetItem.className = `dep-calc-target-item ${statusClass}`;
                
                const articolo = bomManager.findArticolo(p.targetCodice);
                const desc = articolo.descrizione || '';
                
                targetItem.innerHTML = `
                    <div class="dep-calc-target-info">
                        <div>
                            <span class="dep-calc-code">${p.targetCodice}</span>
                            <span class="dep-calc-desc">${desc}</span>
                            <div class="dep-calc-dep-name">${p.depNome}</div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div class="dep-calc-qty-control">
                                <button class="qty-btn" data-index="${p.index}" data-action="decrease">−</button>
                                <input 
                                    type="number" 
                                    class="qty-input" 
                                    value="${p.targetQuantita}" 
                                    data-index="${p.index}"
                                >
                                <button class="qty-btn" data-action="increase" data-index="${p.index}">+</button>
                            </div>
                            <button class="btn-remove-proposal" data-index="${p.index}" title="Scarta suggerimento">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="dep-calc-status ${statusClass}">
                        ${statusText}
                    </div>
                `;
                
                targetList.appendChild(targetItem);
            });
            
            opBlock.appendChild(opHeader);
            opBlock.appendChild(targetList);
            targetPanel.appendChild(opBlock);
        });

        this.attachQuantityEvents();

        let statsHTML = `
            <div class="stat-item"><strong>${totalToAdd}</strong> da aggiungere</div>
            <div class="stat-item" style="color: #ff9500;"><strong>${totalToRemove}</strong> da rimuovere</div>
            <div class="stat-item" style="color: #34c759;"><strong>${totalCorrect}</strong> già corretti</div>
            <div class="stat-item"><strong>${this.proposals.length}</strong> totali</div>
        `;
        
        statsEl.innerHTML = statsHTML;
    },

    attachQuantityEvents() {
        // Eventi sui pulsanti +/-
        document.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                const action = e.target.dataset.action;
                const proposal = this.proposals[index];
                
                if (action === 'increase') {
                    proposal.targetQuantita++;
                } else if (action === 'decrease') {
                    proposal.targetQuantita--;
                }
                
                const input = document.querySelector(`.qty-input[data-index="${index}"]`);
                if (input) input.value = proposal.targetQuantita;
            });
        });

        // Eventi su input quantità
        document.querySelectorAll('.qty-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                const value = parseInt(e.target.value) || 0;
                const proposal = this.proposals[index];
                
                proposal.targetQuantita = value;
                e.target.value = proposal.targetQuantita;
            });
        });
        
        // Eventi pulsante elimina
        document.querySelectorAll('.btn-remove-proposal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                const proposal = this.proposals[index];
                
                // Marca come rimossa
                proposal.removed = true;
                
                // Rimuovi visivamente
                const item = e.target.closest('.dep-calc-target-item');
                if (item) {
                    item.style.opacity = '0';
                    item.style.transform = 'translateX(-10px)';
                    setTimeout(() => item.remove(), 200);
                }
            });
        });
    },

    apply() {
        console.log('✅ Applicazione dipendenze...');
        
        let added = 0;
        let updated = 0;
        let removed = 0;
        let skipped = 0;
        
        this.proposals.forEach(p => {
            // Salta se rimosso manualmente dall'utente
            if (p.removed) {
                skipped++;
                return;
            }
            
            // Salta se quantità zero (già corretto)
            if (p.targetQuantita === 0) {
                skipped++;
                return;
            }
            
            const targetSA = bomManager.sottoassiemi.find(sa => 
                sa.progressivo === p.targetSottoassieme
            );
            
            if (!targetSA) {
                console.warn(`⚠️ Sottoassieme ${p.targetSottoassieme} non trovato`);
                return;
            }
            
            const existingArticolo = targetSA.articoli.find(a => 
                a.codice === p.targetCodice && 
                a.phantomPadre === null
            );
            
            if (p.targetQuantita > 0) {
                // AGGIUNGI o INCREMENTA
                if (existingArticolo) {
                    existingArticolo.quantita += p.targetQuantita;
                    existingArticolo.isFromDependency = true;
                    updated++;
                    console.log(`✏️ Incrementato ${p.targetCodice}: ${existingArticolo.quantita}x (+${p.targetQuantita})`);
                } else {
                    const articoloCompleto = bomManager.findArticolo(p.targetCodice);
                    targetSA.articoli.push({
                        ...articoloCompleto,
                        quantita: p.targetQuantita,
                        phantomPadre: null,
                        variantePadre: null,
                        isFromDependency: true,
                        isManualOverride: false
                    });
                    added++;
                    console.log(`✅ Aggiunto ${p.targetCodice}: ${p.targetQuantita}x`);
                }
            } else if (p.targetQuantita < 0) {
                // RIMUOVI o DECREMENTA
                if (existingArticolo) {
                    const nuovaQuantita = existingArticolo.quantita + p.targetQuantita; // somma algebrica
                    
                    if (nuovaQuantita <= 0) {
                        // Rimuovi completamente
                        targetSA.articoli = targetSA.articoli.filter(a => a !== existingArticolo);
                        removed++;
                        console.log(`🗑️ Rimosso ${p.targetCodice} (quantità finale ≤ 0)`);
                    } else {
                        // Decrementa
                        existingArticolo.quantita = nuovaQuantita;
                        updated++;
                        console.log(`✏️ Decrementato ${p.targetCodice}: ${existingArticolo.quantita}x (${p.targetQuantita})`);
                    }
                } else {
                    console.warn(`⚠️ Tentativo di rimuovere ${p.targetCodice} che non esiste`);
                }
            }
        });
        
        // Refresh UI
        if (typeof UI !== 'undefined' && UI.refreshAllExpanded) {
            UI.refreshAllExpanded();
        }
        
        this.close();
        
        let message = `✅ Dipendenze applicate!\n\n`;
        message += `${added} articoli aggiunti\n`;
        message += `${updated} articoli aggiornati\n`;
        message += `${removed} articoli rimossi`;
        if (skipped > 0) {
            message += `\n${skipped} suggerimenti saltati`;
        }
        
        alert(message);
    },

    close() {
        this.modal.style.display = 'none';
        this.proposals = [];
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        DependencyCalculator.setup();
    });
} else {
    DependencyCalculator.setup();
}