// Gestione pagina dipendenze con editor visuale

let sottoassiemiMap = {};
let articoliMap = {};
let allDepCards = [];
let dipendenze = [];
let articoli = [];
let sottoassiemi = [];
let editingDepIndex = null; // Per sapere se stiamo editando o creando

let selectedTriggers = []; // Articoli trigger selezionati
let selectedTarget = null; // Articolo target selezionato
let selectedTargets = []; // Array di target selezionati con ratio

// Setup modal e eventi
function setupModal() {
    const btnNewDep = document.getElementById('btnNewDep');
    const btnExportJSON = document.getElementById('btnExportJSON');
    const modal = document.getElementById('depModal');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const btnCancelModal = document.getElementById('btnCancelModal');
    const depForm = document.getElementById('depForm');

    // Popola dropdown sottoassiemi
    const selectSottoassieme = document.getElementById('depSottoassieme');

    // Aggiungi opzione SAME
    const optionSame = document.createElement('option');
    optionSame.value = 'SAME';
    optionSame.textContent = '🔗 SAME (stesso OP del trigger)';
    selectSottoassieme.appendChild(optionSame);

    // Aggiungi sottoassiemi normali
    sottoassiemi.forEach(sa => {
        const option = document.createElement('option');
        option.value = sa.progressivo;
        option.textContent = `${sa.progressivo} - ${sa.descrizione}`;
        selectSottoassieme.appendChild(option);
    });

    // Apri modal per nuova dipendenza
    btnNewDep.onclick = () => openNewModal();

    // Chiudi modal
    btnCloseModal.onclick = () => closeModal();
    btnCancelModal.onclick = () => closeModal();
    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };

    // Submit form
    depForm.onsubmit = (e) => {
        e.preventDefault();
        saveDep();
    };



    // Export JSON
    btnExportJSON.onclick = () => exportJSON();

    // Setup ricerca articoli
    setupArticleSearch();


    // Conferma import (gestisce sia trigger che target)
    btnConfirmImport.onclick = () => {
        const text = importTextarea.value.trim();
        if (!text) {
            alert('Nessun codice da importare');
            return;
        }

        const codes = text.split(';').map(c => c.trim()).filter(c => c.length > 0);
        let addedCount = 0;
        let notFoundCount = 0;
        
        const targetType = importModal.dataset.targetType || 'trigger';

        codes.forEach(code => {
            const art = articoli.find(a => a.codice.toLowerCase() === code.toLowerCase());
            if (art) {
                if (targetType === 'target') {
                    // Importa come target
                    if (!selectedTargets.some(t => t.codice === art.codice)) {
                        selectedTargets.push({
                            codice: art.codice,
                            descrizione: art.descrizione,
                            ratio: 1
                        });
                        addedCount++;
                    }
                } else {
                    // Importa come trigger
                    if (!selectedTriggers.some(t => t.codice === art.codice)) {
                        selectedTriggers.push(art);
                        addedCount++;
                    }
                }
            } else {
                notFoundCount++;
            }
        });

        if (targetType === 'target') {
            renderSelectedTargets();
        } else {
            renderSelectedTriggers();
        }
        
        importModal.style.display = 'none';

        if (notFoundCount > 0) {
            alert(`${addedCount} articoli importati. ${notFoundCount} codici non trovati nel database.`);
        } else {
            alert(`${addedCount} articoli importati con successo!`);
        }
    };

}


// Carica e mostra le dipendenze
async function loadDipendenze() {
    try {
        dipendenze = await loadJSON('data/dipendenze.json') || [];
        sottoassiemi = await loadJSON('data/sottoassiemi.json') || [];
        articoli = await loadJSON('data/articoli.json') || [];
        
        // Sanifica articoli (come in bomManager)
        articoli = articoli.map(art => ({
            ...art,
            codice: String(art.codice || ''),
            descrizione: String(art.descrizione || '')
        }));
        
        // Crea mappa sottoassieme progressivo -> descrizione
        sottoassiemi.forEach(sa => {
            sottoassiemiMap[sa.progressivo] = sa.descrizione;
        });

        // Crea mappa articolo codice -> descrizione
        articoli.forEach(art => {
            articoliMap[art.codice] = art.descrizione || '';
        });

        const depList = document.getElementById('depList');
        const emptyState = document.getElementById('emptyState');
        const totalDeps = document.getElementById('totalDeps');
        const visibleDeps = document.getElementById('visibleDeps');

        if (!dipendenze || dipendenze.length === 0) {
            depList.style.display = 'none';
            emptyState.style.display = 'block';
            totalDeps.textContent = '0';
            visibleDeps.textContent = '0';
        } else {
            depList.style.display = 'flex';
            emptyState.style.display = 'none';
            totalDeps.textContent = dipendenze.length;
            visibleDeps.textContent = dipendenze.length;
            renderAllDeps();
        }

                // Setup eventi (ALLA FINE della funzione)
        setupFilter();
        setupModal();


    } catch (error) {
        console.error('Errore nel caricamento delle dipendenze:', error);
        alert('Impossibile caricare le dipendenze');
    }
}

// Renderizza tutte le dipendenze
function renderAllDeps() {
    const depList = document.getElementById('depList');
    depList.innerHTML = '';
    allDepCards = [];

    dipendenze.forEach((dep, index) => {
        const card = createDepCard(dep, index);
        depList.appendChild(card);
        allDepCards.push({
            element: card,
            data: dep
        });
    });
}

// Setup filtro di ricerca
function setupFilter() {
    const filterInput = document.getElementById('filterInput');
    const visibleDeps = document.getElementById('visibleDeps');

    filterInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        let visibleCount = 0;

        allDepCards.forEach(({ element, data }) => {
            if (!query) {
                element.classList.remove('hidden');
                visibleCount++;
                return;
            }

            // Cerca in: trigger codes, target code, nome dipendenza, descrizioni articoli
            const searchText = [
                data.nome,
                data.target,
                ...data.trigger,
                articoliMap[data.target] || '',
                ...data.trigger.map(t => articoliMap[t] || '')
            ].join(' ').toLowerCase();

            if (searchText.includes(query)) {
                element.classList.remove('hidden');
                visibleCount++;
            } else {
                element.classList.add('hidden');
            }
        });

        visibleDeps.textContent = visibleCount;
    });
}



// Crea una card per una dipendenza
function createDepCard(dep, index) {
    const card = document.createElement('div');
    card.className = 'dep-card';

    // Nome e ID + Azioni
    const nameDiv = document.createElement('div');
    nameDiv.className = 'dep-name';
    nameDiv.innerHTML = `
        ${dep.nome}
        <span class="dep-id">${dep.id}</span>
    `;

    // Azioni Edit/Delete
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'dep-card-actions';
    
    const btnEdit = document.createElement('button');
    btnEdit.className = 'btn-edit-dep';
    btnEdit.innerHTML = '✏️';
    btnEdit.title = 'Modifica';
    btnEdit.onclick = () => openEditModal(index);
    
    const btnDelete = document.createElement('button');
    btnDelete.className = 'btn-delete-dep';
    btnDelete.innerHTML = '🗑️';
    btnDelete.title = 'Elimina';
    btnDelete.onclick = () => deleteDep(index);
    
    actionsDiv.appendChild(btnEdit);
    actionsDiv.appendChild(btnDelete);
    nameDiv.appendChild(actionsDiv);

    // Flow: Trigger → Ratio → Target → Dove
    const flowDiv = document.createElement('div');
    flowDiv.className = 'dep-flow';

    // Sezione Trigger
    const triggerSection = document.createElement('div');
    triggerSection.className = 'dep-section';
    const triggerLabel = document.createElement('div');
    triggerLabel.className = 'dep-label';
    triggerLabel.textContent = 'Trigger (SE aggiungi)';
    const triggerCodes = document.createElement('div');
    triggerCodes.className = 'dep-codes';
    dep.trigger.forEach(code => {
        const codeContainer = document.createElement('div');
        codeContainer.className = 'code-with-desc';
        
        const codeSpan = document.createElement('span');
        codeSpan.className = 'dep-code dep-trigger';
        codeSpan.textContent = code;
        
        const desc = articoliMap[String(code)];
        if (desc) {
            const descSpan = document.createElement('span');
            descSpan.className = 'code-desc';
            descSpan.textContent = desc;
            codeContainer.appendChild(codeSpan);
            codeContainer.appendChild(descSpan);
        } else {
            codeContainer.appendChild(codeSpan);
        }
        
        triggerCodes.appendChild(codeContainer);
    });
    triggerSection.appendChild(triggerLabel);
    triggerSection.appendChild(triggerCodes);

    // Arrow 1
    const arrow1 = document.createElement('div');
    arrow1.className = 'dep-arrow';
    arrow1.textContent = '→';

    // Sezione Ratio (non più usata per multi-target, ma lasciamola per compatibilità visiva)
    const ratioSection = document.createElement('div');
    ratioSection.className = 'dep-section';
    const ratioLabel = document.createElement('div');
    ratioLabel.className = 'dep-label';
    ratioLabel.textContent = 'Ratio';
    const ratioValue = document.createElement('div');
    ratioValue.className = 'dep-ratio';
    ratioValue.textContent = 'Vedi target →';
    ratioSection.appendChild(ratioLabel);
    ratioSection.appendChild(ratioValue);

    // Arrow 2
    const arrow2 = document.createElement('div');
    arrow2.className = 'dep-arrow';
    arrow2.textContent = '→';

    // Sezione Target (SUPPORTA MULTIPLI)
    const targetSection = document.createElement('div');
    targetSection.className = 'dep-section';
    const targetLabel = document.createElement('div');
    targetLabel.className = 'dep-label';
    targetLabel.textContent = 'Aggiungi (ALLORA)';
    const targetCode = document.createElement('div');
    targetCode.className = 'dep-codes';

    // Supporta entrambi i formati
    let targetsList = [];
    if (dep.targets && Array.isArray(dep.targets)) {
        targetsList = dep.targets;
    } else if (dep.target) {
        targetsList = [{ codice: dep.target, ratio: dep.ratio || 1 }];
    }

    targetsList.forEach(targetItem => {
        const targetContainer = document.createElement('div');
        targetContainer.className = 'code-with-desc';
        
        const targetSpan = document.createElement('span');
        targetSpan.className = 'dep-code dep-target';
        targetSpan.textContent = `${targetItem.codice} (×${targetItem.ratio})`;
        
        const targetDesc = articoliMap[String(targetItem.codice)];
        if (targetDesc) {
            const descSpan = document.createElement('span');
            descSpan.className = 'code-desc';
            descSpan.textContent = targetDesc;
            targetContainer.appendChild(targetSpan);
            targetContainer.appendChild(descSpan);
        } else {
            targetContainer.appendChild(targetSpan);
        }
        
        targetCode.appendChild(targetContainer);
    });

    targetSection.appendChild(targetLabel);
    targetSection.appendChild(targetCode);

    // Arrow 3
    const arrow3 = document.createElement('div');
    arrow3.className = 'dep-arrow';
    arrow3.textContent = '→';

    // Sezione Dove
    const whereSection = document.createElement('div');
    whereSection.className = 'dep-section';
    const whereLabel = document.createElement('div');
    whereLabel.className = 'dep-label';
    whereLabel.textContent = 'Nel sottoassieme';
    const whereValue = document.createElement('div');
    whereValue.className = 'dep-sottoassieme';
    
    if (dep.sottoassieme_destinazione === 'SAME') {
        whereValue.textContent = '🔗 SAME (stesso OP del trigger)';
        whereValue.style.fontStyle = 'italic';
    } else {
        const saDesc = sottoassiemiMap[dep.sottoassieme_destinazione] || 'N/A';
        whereValue.textContent = `${dep.sottoassieme_destinazione} - ${saDesc}`;
    }
    
    whereSection.appendChild(whereLabel);
    whereSection.appendChild(whereValue);

    // Assembla flow
    flowDiv.appendChild(triggerSection);
    flowDiv.appendChild(arrow1);
    flowDiv.appendChild(ratioSection);
    flowDiv.appendChild(arrow2);
    flowDiv.appendChild(targetSection);
    flowDiv.appendChild(arrow3);
    flowDiv.appendChild(whereSection);

    // Meta info (badge)
    const metaDiv = document.createElement('div');
    metaDiv.className = 'dep-meta';
    
    if (dep.override) {
        const overrideBadge = document.createElement('span');
        overrideBadge.className = 'dep-badge badge-override';
        overrideBadge.textContent = 'Override';
        metaDiv.appendChild(overrideBadge);
    }

    if (dep.dedup) {
        const dedupBadge = document.createElement('span');
        dedupBadge.className = 'dep-badge badge-sum';
        dedupBadge.textContent = `Dedup: ${dep.dedup}`;
        metaDiv.appendChild(dedupBadge);
    }

    // Assembla card
    card.appendChild(nameDiv);
    card.appendChild(flowDiv);
    if (metaDiv.children.length > 0) {
        card.appendChild(metaDiv);
    }

    return card;
}




// Setup import lista codici
const btnImportTriggers = document.getElementById('btnImportTriggers');
const importModal = document.getElementById('importModal');
const btnCloseImport = document.getElementById('btnCloseImport');
const btnCancelImport = document.getElementById('btnCancelImport');
const btnConfirmImport = document.getElementById('btnConfirmImport');
const importTextarea = document.getElementById('importTextarea');
const importPreview = document.getElementById('importPreview');

btnImportTriggers.onclick = () => {
    importTextarea.value = '';
    importPreview.innerHTML = '<span style="color: var(--text-tertiary);">Incolla i codici per vedere l\'anteprima</span>';
    importModal.style.display = 'flex';
};

btnCloseImport.onclick = () => {
    importModal.style.display = 'none';
};

btnCancelImport.onclick = () => {
    importModal.style.display = 'none';
};

importModal.onclick = (e) => {
    if (e.target === importModal) {
        importModal.style.display = 'none';
    }
};

// Preview in tempo reale
importTextarea.addEventListener('input', () => {
    const text = importTextarea.value.trim();
    if (!text) {
        importPreview.innerHTML = '<span style="color: var(--text-tertiary);">Incolla i codici per vedere l\'anteprima</span>';
        return;
    }

    // Split per ";"
    const codes = text.split(';').map(c => c.trim()).filter(c => c.length > 0);
    
    if (codes.length === 0) {
        importPreview.innerHTML = '<span style="color: var(--text-tertiary);">Nessun codice rilevato</span>';
        return;
    }

    // Verifica quali codici esistono
    const preview = codes.map(code => {
        const found = articoli.find(art => art.codice.toLowerCase() === code.toLowerCase());
        const className = found ? 'valid' : 'invalid';
        return `<span class="import-preview-item ${className}">${code}</span>`;
    }).join('');

    const validCount = codes.filter(code => 
        articoli.find(art => art.codice.toLowerCase() === code.toLowerCase())
    ).length;

    importPreview.innerHTML = `
        ${preview}
        <div class="import-stats">
            <strong>${validCount}</strong> validi, <strong>${codes.length - validCount}</strong> non trovati
        </div>
    `;
});


/*
    // Setup import lista TARGET
    const btnImportTargets = document.getElementById('btnImportTargets');

    btnImportTargets.onclick = () => {
        importTextarea.value = '';
        importPreview.innerHTML = '<span style="color: var(--text-tertiary);">Incolla i codici per vedere l\'anteprima</span>';
        importModal.style.display = 'flex';
        importModal.dataset.targetType = 'target'; // Flag per sapere se stiamo importando trigger o target
    };

    // Modifica il confirm import per gestire entrambi i tipi
    const originalConfirmImport = btnConfirmImport.onclick;
    btnConfirmImport.onclick = () => {
        const text = importTextarea.value.trim();
        if (!text) {
            showAlert('Nessun codice da importare');
            return;
        }

        const codes = text.split(';').map(c => c.trim()).filter(c => c.length > 0);
        let addedCount = 0;
        let notFoundCount = 0;
        
        const targetType = importModal.dataset.targetType || 'trigger';

        codes.forEach(code => {
            const art = articoli.find(a => a.codice.toLowerCase() === code.toLowerCase());
            if (art) {
                if (targetType === 'target') {
                    // Importa come target
                    if (!selectedTargets.some(t => t.codice === art.codice)) {
                        selectedTargets.push({
                            codice: art.codice,
                            descrizione: art.descrizione,
                            ratio: 1
                        });
                        addedCount++;
                    }
                } else {
                    // Importa come trigger (comportamento originale)
                    if (!selectedTriggers.some(t => t.codice === art.codice)) {
                        selectedTriggers.push(art);
                        addedCount++;
                    }
                }
            } else {
                notFoundCount++;
            }
        });

        if (targetType === 'target') {
            renderSelectedTargets();
        } else {
            renderSelectedTriggers();
        }
        
        importModal.style.display = 'none';

        if (notFoundCount > 0) {
            showAlert(`${addedCount} articoli importati. ${notFoundCount} codici non trovati nel database.`);
        } else {
            showAlert(`${addedCount} articoli importati con successo!`);
        }
    };
*/


// Setup import lista TARGET
const btnImportTargets = document.getElementById('btnImportTargets');

if (btnImportTargets) {
    btnImportTargets.onclick = () => {
        importTextarea.value = '';
        importPreview.innerHTML = '<span style="color: var(--text-tertiary);">Incolla i codici per vedere l\'anteprima</span>';
        importModal.style.display = 'flex';
        importModal.dataset.targetType = 'target'; // Flag per sapere se stiamo importando trigger o target
    };
}


// Apri modal per nuova dipendenza
function openNewModal() {
    editingDepIndex = null;
    selectedTriggers = [];
    selectedTargets = [];  // ← cambiato da selectedTarget = null
    
    document.getElementById('modalTitle').textContent = 'Nuova Dipendenza';
    document.getElementById('depId').value = generateNewDepId();
    document.getElementById('depNome').value = '';
    document.getElementById('depRatio').value = '1';
    document.getElementById('depSottoassieme').value = '';
    document.getElementById('depOverride').checked = true;
    document.getElementById('depDedup').value = 'sum';
    
    renderSelectedTriggers();
    renderSelectedTargets();  // ← cambiato da renderSelectedTarget
    
    document.getElementById('depModal').style.display = 'flex';
}

// Apri modal per modificare dipendenza
function openEditModal(index) {
    editingDepIndex = index;
    const dep = dipendenze[index];
    
    selectedTriggers = dep.trigger.map(code => {
        return {
            codice: code,
            descrizione: articoliMap[code] || ''
        };
    });
    
    // Supporta entrambi i formati (vecchio e nuovo)
    if (dep.targets && Array.isArray(dep.targets)) {
        // Nuovo formato: array di targets
        selectedTargets = dep.targets.map(t => ({
            codice: t.codice,
            descrizione: articoliMap[t.codice] || '',
            ratio: t.ratio || 1
        }));
    } else if (dep.target) {
        // Vecchio formato: singolo target
        selectedTargets = [{
            codice: dep.target,
            descrizione: articoliMap[dep.target] || '',
            ratio: dep.ratio || 1
        }];
    } else {
        selectedTargets = [];
    }
    
    document.getElementById('modalTitle').textContent = 'Modifica Dipendenza';
    document.getElementById('depId').value = dep.id;
    document.getElementById('depNome').value = dep.nome;
    document.getElementById('depRatio').value = '1'; // Non usato più per multi-target
    document.getElementById('depSottoassieme').value = dep.sottoassieme_destinazione;
    document.getElementById('depOverride').checked = dep.override || false;
    document.getElementById('depDedup').value = dep.dedup || 'sum';
    
    renderSelectedTriggers();
    renderSelectedTargets();
    
    document.getElementById('depModal').style.display = 'flex';
}

// Chiudi modal
function closeModal() {
    document.getElementById('depModal').style.display = 'none';
    editingDepIndex = null;
    selectedTriggers = [];
    selectedTargets = [];  // ← cambiato
}

// Genera nuovo ID dipendenza
function generateNewDepId() {
    const maxId = dipendenze.reduce((max, dep) => {
        const num = parseInt(dep.id.replace('DEP', ''));
        return num > max ? num : max;
    }, 0);
    return `DEP${String(maxId + 1).padStart(3, '0')}`;
}

// Setup ricerca articoli (trigger e target)
function setupArticleSearch() {
    const searchTrigger = document.getElementById('searchTrigger');
    const triggerResults = document.getElementById('triggerResults');
    const searchTarget = document.getElementById('searchTarget');
    const targetResults = document.getElementById('targetResults');

    // Ricerca trigger
    searchTrigger.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (query.length < 2) {
            triggerResults.classList.remove('active');
            return;
        }
        
        const results = searchArticles(query);
        renderSearchResults(results, triggerResults, 'trigger');
    });

    // Ricerca target
    searchTarget.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (query.length < 2) {
            targetResults.classList.remove('active');
            return;
        }
        
        const results = searchArticles(query);
        renderSearchResults(results, targetResults, 'target');
    });

    // Chiudi risultati quando si clicca fuori
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-articolo-wrapper')) {
            triggerResults.classList.remove('active');
            targetResults.classList.remove('active');
        }
    });
}

// Cerca articoli
function searchArticles(query) {
    const q = query.toLowerCase();
    return articoli.filter(art => 
        art.codice.toLowerCase().includes(q) ||
        art.descrizione.toLowerCase().includes(q)
    ).slice(0, 15);
}

// Renderizza risultati ricerca
function renderSearchResults(results, container, type) {
    if (results.length === 0) {
        container.innerHTML = '<div style="padding: 12px; color: var(--text-tertiary); font-size: 13px;">Nessun risultato</div>';
        container.classList.add('active');
        return;
    }

    container.innerHTML = '';
    results.forEach(art => {
        const item = document.createElement('div');
        item.className = 'search-result-item-dep';
        item.innerHTML = `
            <div class="search-result-code">${art.codice}</div>
            <div class="search-result-desc">${art.descrizione}</div>
        `;
        item.onclick = () => {
            if (type === 'trigger') {
                addTrigger(art);
                document.getElementById('searchTrigger').value = '';
            } else {
                addTarget(art);  // ← cambiato da selectTarget
                document.getElementById('searchTarget').value = '';
            }
            container.classList.remove('active');
        };
        container.appendChild(item);
    });
    container.classList.add('active');
}

// Aggiungi trigger
function addTrigger(articolo) {
    // Evita duplicati
    if (selectedTriggers.some(t => t.codice === articolo.codice)) {
        return;
    }
    selectedTriggers.push(articolo);
    renderSelectedTriggers();
}

// Rimuovi trigger
function removeTrigger(index) {
    selectedTriggers.splice(index, 1);
    renderSelectedTriggers();
}



// Aggiungi target
function addTarget(articolo) {
    // Evita duplicati
    if (selectedTargets.some(t => t.codice === articolo.codice)) {
        return;
    }
    selectedTargets.push({
        codice: articolo.codice,
        descrizione: articolo.descrizione,
        ratio: 1  // Ratio di default
    });
    renderSelectedTargets();
}

// Rimuovi target
function removeTarget(index) {
    selectedTargets.splice(index, 1);
    renderSelectedTargets();
}

// Aggiorna ratio di un target
function updateTargetRatio(index, newRatio) {
    selectedTargets[index].ratio = parseFloat(newRatio) || 1;
}

// Renderizza target selezionati
function renderSelectedTargets() {
    const container = document.getElementById('selectedTargets');
    container.innerHTML = '';
    
    if (selectedTargets.length === 0) {
        container.innerHTML = '<div style="color: var(--text-tertiary); font-size: 13px; padding: 8px;">Nessun articolo selezionato</div>';
        return;
    }

    selectedTargets.forEach((target, index) => {
        const item = document.createElement('div');
        item.className = 'selected-item-with-ratio';
        item.innerHTML = `
            <div class="selected-item-info">
                <span class="selected-item-code">${target.codice}</span>
                <span class="selected-item-desc">${target.descrizione}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 4px;">
                <span class="ratio-label">×</span>
                <input type="number" class="ratio-input" value="${target.ratio}" min="0.1" step="0.1" data-index="${index}">
            </div>
            <button type="button" class="btn-remove-item">✕</button>
        `;
        
        // Event listener per ratio
        const ratioInput = item.querySelector('.ratio-input');
        ratioInput.addEventListener('change', (e) => {
            updateTargetRatio(index, e.target.value);
        });
        
        // Event listener per rimozione
        item.querySelector('.btn-remove-item').onclick = () => removeTarget(index);
        
        container.appendChild(item);
    });
}






// Renderizza trigger selezionati
function renderSelectedTriggers() {
    const container = document.getElementById('selectedTriggers');
    container.innerHTML = '';
    
    if (selectedTriggers.length === 0) {
        container.innerHTML = '<div style="color: var(--text-tertiary); font-size: 13px; padding: 8px;">Nessun articolo selezionato</div>';
        return;
    }

    selectedTriggers.forEach((art, index) => {
        const item = document.createElement('div');
        item.className = 'selected-item';
        item.innerHTML = `
            <span class="selected-item-code">${art.codice}</span>
            <span class="selected-item-desc">${art.descrizione}</span>
            <button type="button" class="btn-remove-item">✕</button>
        `;
        item.querySelector('.btn-remove-item').onclick = () => removeTrigger(index);
        container.appendChild(item);
    });
}


// Salva dipendenza
function saveDep() {
    // Validazione
    if (selectedTriggers.length === 0) {
        alert('Seleziona almeno un articolo trigger');
        return;
    }
    
    if (selectedTargets.length === 0) {
        alert('Seleziona almeno un articolo target');
        return;
    }

    const newDep = {
        id: document.getElementById('depId').value,
        nome: document.getElementById('depNome').value,
        trigger: selectedTriggers.map(t => t.codice),
        targets: selectedTargets.map(t => ({
            codice: t.codice,
            ratio: t.ratio
        })),
        sottoassieme_destinazione: document.getElementById('depSottoassieme').value,
        override: document.getElementById('depOverride').checked,
        dedup: document.getElementById('depDedup').value
    };

    if (editingDepIndex !== null) {
        // Modifica esistente
        dipendenze[editingDepIndex] = newDep;
    } else {
        // Nuova dipendenza
        dipendenze.push(newDep);
    }

    // Aggiorna UI
    renderAllDeps();
    document.getElementById('totalDeps').textContent = dipendenze.length;
    document.getElementById('visibleDeps').textContent = dipendenze.length;
    
    // Mostra lista se era vuota
    document.getElementById('depList').style.display = 'flex';
    document.getElementById('emptyState').style.display = 'none';

    closeModal();
    
    alert(editingDepIndex !== null ? 'Dipendenza modificata!' : 'Dipendenza creata!');
}


// Elimina dipendenza
function deleteDep(index) {
    const dep = dipendenze[index];
    if (!confirm(`Eliminare la dipendenza "${dep.nome}"?`)) {
        return;
    }

    dipendenze.splice(index, 1);
    renderAllDeps();
    
    document.getElementById('totalDeps').textContent = dipendenze.length;
    document.getElementById('visibleDeps').textContent = dipendenze.length;
    
    if (dipendenze.length === 0) {
        document.getElementById('depList').style.display = 'none';
        document.getElementById('emptyState').style.display = 'block';
    }
}

// Esporta JSON
function exportJSON() {
    if (dipendenze.length === 0) {
        alert('Non ci sono dipendenze da esportare');
        return;
    }

    const json = JSON.stringify(dipendenze, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dipendenze.json';
    a.click();
    URL.revokeObjectURL(url);
    
    alert('JSON esportato! Sostituisci il file in data/dipendenze.json');
}

// Avvia il caricamento
loadDipendenze();

