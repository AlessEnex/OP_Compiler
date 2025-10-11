// Import CSV

const CSVImporter = {
    csvData: [],
    csvValidated: false,
    modal: null,
    
    elements: {},

    setup() {
        this.modal = document.getElementById('csvModal');
        
        this.elements = {
            btnImport: document.getElementById('btnImportCSV'),
            btnClose: document.getElementById('btnCloseCsvModal'),
            btnCancel: document.getElementById('btnCancelCSV'),
            btnSelect: document.getElementById('btnSelectCSV'),
            fileInput: document.getElementById('csvFileInput'),
            dropZone: document.getElementById('csvDropZone'),
            btnClear: document.getElementById('btnClearCSV'),
            btnConfirm: document.getElementById('btnConfirmImportCSV'),
            fileName: document.getElementById('csvFileName'),
            previewContent: document.getElementById('csvPreviewContent'),
            preview: document.getElementById('csvPreview'),
            stats: document.getElementById('csvStats')
        };

        if (!this.elements.btnImport || !this.modal || !this.elements.btnConfirm) {
            console.warn('⚠️ Elementi CSV modal non trovati');
            return;
        }

        this.attachEvents();
    },

    attachEvents() {
        const { btnImport, btnClose, btnCancel, btnSelect, fileInput, dropZone, btnClear, btnConfirm } = this.elements;

        btnImport.addEventListener('click', () => {
            this.modal.style.display = 'flex';
            this.reset();
        });

        btnClose.addEventListener('click', () => this.close());
        btnCancel.addEventListener('click', () => this.close());
        
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });

        btnSelect.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.handleFile(file);
        });

        // Drag & drop
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.name.endsWith('.csv')) {
                this.handleFile(file);
            } else {
                alert('⚠️ Carica un file CSV');
            }
        });

        btnClear.addEventListener('click', () => this.reset());

        btnConfirm.addEventListener('click', () => {
            if (this.csvValidated && this.csvData.length > 0) {
                this.import();
                this.close();
            }
        });
    },

    close() {
        this.modal.style.display = 'none';
    },

    reset() {
        this.csvData = [];
        this.csvValidated = false;
        this.elements.fileInput.value = '';
        this.elements.dropZone.style.display = 'block';
        this.elements.preview.style.display = 'none';
    },

    async handleFile(file) {
        this.elements.fileName.textContent = file.name;
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target.result;
            await this.parseAndValidate(text);
        };
        reader.readAsText(file);
    },

    async parseAndValidate(csvText) {
        const parsed = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            trimHeaders: true,
            delimitersToGuess: [';', '\t', '|']
        });

        if (parsed.errors.length > 0) {
            alert('⚠️ Errore nel parsing del CSV');
            console.error(parsed.errors);
            return;
        }

        const rows = parsed.data;
        this.csvData = [];
        let validCount = 0;
        let errorCount = 0;
        let warningCount = 0;

        for (const row of rows) {
            const sottoassieme = String(row.sottoassieme || row.Sottoassieme || '').trim();
            const codice = String(row.codice || row.Codice || '').trim();
            const quantita = parseInt(row.quantita || row.Quantita || row.Quantità || 1);

            if (!sottoassieme || !codice) {
                errorCount++;
                continue;
            }

            const saExists = bomManager.sottoassiemi.find(sa => sa.progressivo === sottoassieme);
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

            this.csvData.push(validation);
        }

        this.renderPreview(this.csvData, validCount, errorCount, warningCount);
        this.csvValidated = errorCount === 0;

        this.elements.dropZone.style.display = 'none';
        this.elements.preview.style.display = 'block';
    },

    renderPreview(data, validCount, errorCount, warningCount) {
        const { previewContent, stats, btnConfirm } = this.elements;

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

        stats.innerHTML = `
            <div><strong>${data.length}</strong> righe totali</div>
            <div><strong>${validCount}</strong> valide</div>
            ${warningCount > 0 ? `<div style="color: #ff9500;"><strong>${warningCount}</strong> warning</div>` : ''}
            ${errorCount > 0 ? `<div style="color: #ff3b30;"><strong>${errorCount}</strong> errori</div>` : ''}
        `;

        // Abilita/disabilita bottone import
        if (errorCount > 0) {
            btnConfirm.disabled = true;
            btnConfirm.style.opacity = '0.5';
            btnConfirm.style.cursor = 'not-allowed';
        } else {
            btnConfirm.disabled = false;
            btnConfirm.style.opacity = '1';
            btnConfirm.style.cursor = 'pointer';
        }
    },

    import() {
        let importedCount = 0;
        let skippedCount = 0;

        this.csvData.forEach(item => {
            if (item.status === 'valid' || item.status === 'warning') {
                const sottoassieme = bomManager.sottoassiemi.find(sa => sa.progressivo === item.sottoassieme);
                
                if (sottoassieme) {
                    bomManager.addArticolo(sottoassieme.progressivo, item.articolo, item.quantita);
                    importedCount++;
                } else {
                    skippedCount++;
                }
            }
        });

        UI.refreshAllExpanded();

        alert(`Importazione completata!\n\n${importedCount} articoli importati${skippedCount > 0 ? `\n${skippedCount} saltati` : ''}`);
    }
};