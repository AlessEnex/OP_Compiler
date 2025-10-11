// Controller principale - coordina tutto

const bomManager = new BomManager();

// Elementi DOM globali
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
    UI.renderSottoassiemi();
    
    // Setup funzionalità
    CSVImporter.setup();
    SottoassiemiFilter.setup();
});

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


// Aggiorna barra selezione multipla
function updateMultiSelectBar() {
    const multiSelectBar = document.getElementById('multiSelectBar');
    const selectedCount = document.getElementById('selectedCount');
    const selectedCards = document.querySelectorAll('.sottoassieme-card.selected');
    
    if (selectedCards.length > 0) {
        multiSelectBar.style.display = 'block';
        selectedCount.textContent = `${selectedCards.length} selezionati`;
    } else {
        multiSelectBar.style.display = 'none';
    }
}

// Deseleziona tutto
document.getElementById('btnDeselectAll')?.addEventListener('click', () => {
    document.querySelectorAll('.sottoassieme-card.selected').forEach(card => {
        card.classList.remove('selected');
        card.querySelector('.sottoassieme-checkbox').checked = false;
    });
    updateMultiSelectBar();
});

// Elimina multipli
document.getElementById('btnDeleteMultiple')?.addEventListener('click', () => {
    const selectedCards = document.querySelectorAll('.sottoassieme-card.selected');
    const progressivi = Array.from(selectedCards).map(card => card.dataset.progressivo);
    
    if (progressivi.length === 0) return;
    
    showConfirm(
        'Elimina sottoassiemi',
        `Sei sicuro di voler eliminare ${progressivi.length} sottoassiemi?`,
        () => {
            progressivi.forEach(prog => {
                bomManager.removeSottoassieme(prog);
            });
            UI.renderSottoassiemi();
            updateMultiSelectBar();
        }
    );
});


// Avvia
init();

