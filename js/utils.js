// Funzioni di utilità

// Formatta il numero commessa con zeri iniziali (es. 26 -> 0026)
function formatCommessa(numero) {
    return String(numero).padStart(4, '0');
}

// Genera il codice OP per un sottoassieme
function generateOPCode(anno, commessa, progressivo) {
    const annoShort = String(anno).slice(-2); // Ultime 2 cifre dell'anno
    const commessaFormatted = formatCommessa(commessa);
    const progFormatted = String(progressivo).padStart(2, '0');
    return `OP${annoShort}${commessaFormatted}${progFormatted}`;
}

// Carica un file JSON
async function loadJSON(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Errore nel caricamento di ${url}`);
        }
        return await response.json();
    } catch (error) {
        console.error(error);
        alert(`Impossibile caricare il file: ${url}`);
        return null;
    }
}

// Ricerca articoli per codice (fuzzy search)
function searchByCodice(articoli, query) {
    if (!query) return [];
    const q = query.toLowerCase();
    return articoli.filter(art => 
         art.codice && art.codice.toLowerCase().includes(q)  // <-- AGGIUNGI && art.codice
    ).slice(0, 20); // Limita a 20 risultati
}

// Ricerca articoli per descrizione (doppio filtro AND)
function searchByDescrizione(articoli, query1, query2) {
    let results = articoli;
    
    if (query1) {
        const q1 = query1.toLowerCase();
        results = results.filter(art => 
            art.descrizione.toLowerCase().includes(q1)
        );
    }
    
    if (query2) {
        const q2 = query2.toLowerCase();
        results = results.filter(art => 
            art.descrizione.toLowerCase().includes(q2)
        );
    }
    
    return results.slice(0, 20); // Limita a 20 risultati
}

    // Esporta la BoM in formato Excel (.xlsx) con due fogli
    function exportToExcel(bomData, filename = 'distinta_base.xlsx') {
        console.log('Inizio export, righe da esportare:', bomData.length);
        
        // Crea un nuovo workbook
        const wb = XLSX.utils.book_new();
        
        // FOGLIO 1: Articoli (vuoto, solo intestazioni)
        const articoliData = [
            ['Codice', 'Descrizione', 'Categoria']
        ];
        const wsArticoli = XLSX.utils.aoa_to_sheet(articoliData);
        XLSX.utils.book_append_sheet(wb, wsArticoli, 'Articoli');
        console.log('Foglio Articoli creato');
        
        // FOGLIO 2: Distinte
        const distinteData = [
            ['codice padre', 'codice figlio', 'quantita', 'variantepadre', 'variantefiglio']
        ];
        
        bomData.forEach(row => {
            distinteData.push([
                row.padre || '',
                row.figlio || '',
                row.quantita || 0,
                row.variantePadre || '',
                row.varianteFiglio || ''
            ]);
        });
        
        console.log('Dati distinte preparati:', distinteData.length, 'righe');
        
        const wsDistinte = XLSX.utils.aoa_to_sheet(distinteData);
        XLSX.utils.book_append_sheet(wb, wsDistinte, 'Distinte');
        console.log('Foglio Distinte creato');
        
        // Verifica struttura workbook
        console.log('Fogli nel workbook:', wb.SheetNames);
        
        // Scarica il file
        XLSX.writeFile(wb, filename);
        console.log('File scaricato:', filename);
    }


    // Modal conferma personalizzato
let confirmCallback = null;

function showConfirm(title, message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    const titleEl = document.getElementById('confirmTitle');
    const messageEl = document.getElementById('confirmMessage');
    const btnCancel = document.getElementById('btnCancelConfirm');
    const btnConfirm = document.getElementById('btnConfirmDelete');

    titleEl.textContent = title;
    messageEl.textContent = message;
    confirmCallback = onConfirm;

    modal.style.display = 'flex';

    // Gestione click
    btnCancel.onclick = hideConfirm;
    btnConfirm.onclick = () => {
        if (confirmCallback) confirmCallback();
        hideConfirm();
    };

    // Chiudi cliccando fuori
    modal.onclick = (e) => {
        if (e.target === modal) hideConfirm();
    };

    // ESC per chiudere
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            hideConfirm();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

function hideConfirm() {
    document.getElementById('confirmModal').style.display = 'none';
    confirmCallback = null;
}


// Alert personalizzato (solo messaggio)
function showAlert(message) {
    const modal = document.getElementById('confirmModal');
    const titleEl = document.getElementById('confirmTitle');
    const messageEl = document.getElementById('confirmMessage');
    const btnCancel = document.getElementById('btnCancelConfirm');
    const btnConfirm = document.getElementById('btnConfirmDelete');

    titleEl.textContent = 'Importazione completata';
    messageEl.textContent = message;

    // Nascondi bottone annulla, mostra solo OK
    btnCancel.style.display = 'none';
    btnConfirm.textContent = 'OK';
    btnConfirm.style.background = 'var(--text-primary)';

    modal.style.display = 'flex';

    btnConfirm.onclick = () => {
        hideConfirm();
        // Ripristina stile
        btnCancel.style.display = '';
        btnConfirm.textContent = 'Elimina';
        btnConfirm.style.background = '';
    };

    modal.onclick = (e) => {
        if (e.target === modal) {
            hideConfirm();
            btnCancel.style.display = '';
            btnConfirm.textContent = 'Elimina';
            btnConfirm.style.background = '';
        }
    };
}