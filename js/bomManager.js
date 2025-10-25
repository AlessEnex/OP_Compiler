// Gestore della Distinta Base

class BomManager {
    constructor() {
        this.anno = null;
        this.commessa = null;
        this.codiceMacchina = null;
        this.descrizioneMacchina = null;
        this.sottoassiemi = []; // Array di sottoassiemi attivi
        this.articoli = []; // Database articoli
        this.phantom = []; // Database phantom
        this.sottoassiemiStandard = []; // Lista sottoassiemi standard
        this.dipendenze = []; // <-- AGGIUNGI QUESTA RIGA
        this.assiemi = []; // Database assiemi riutilizzabili
    }

    // Inizializza la commessa
    init(anno, commessa, codiceMacchina, descrizioneMacchina) {
        this.anno = anno;
        this.commessa = commessa;
        this.codiceMacchina = codiceMacchina;
        this.descrizioneMacchina = descrizioneMacchina;
    }

    // Carica i dati iniziali
    async loadData() {
        this.articoli = await loadJSON('data/articoli.json') || [];
        this.phantom = await loadJSON('data/phantom.json') || [];
        this.sottoassiemiStandard = await loadJSON('data/sottoassiemi.json') || [];
        this.dipendenze = await loadJSON('data/dipendenze.json') || [];
        this.assiemi = await loadJSON('data/assiemi.json') || [];
        
        // 🔧 Sanifica i dati convertendo tutto in stringhe
        this.articoli = this.articoli.map(art => ({
            ...art,
            codice: String(art.codice || ''),
            descrizione: String(art.descrizione || ''),
            descrizione_aggiuntiva: String(art.descrizione_aggiuntiva || '')  // <-- AGGIUNGI
        }));
        
        this.phantom = this.phantom.map(p => ({
            ...p,
            codice: String(p.codice || ''),
            descrizione: String(p.descrizione || '')
        }));
    }

    // Inizializza tutti i sottoassiemi standard
    initSottoassiemi() {
        this.sottoassiemi = this.sottoassiemiStandard.map(sa => ({
            progressivo: sa.progressivo,
            descrizione: sa.descrizione,
            codice: generateOPCode(this.anno, this.commessa, sa.progressivo),
            articoli: [], // Array di articoli in questo sottoassieme
            gruppiAssiemi: [], // Array di gruppi assieme
            expanded: false,
            completed: false  // <-- AGGIUNGI QUESTA RIGA
        }));
    }

    // Rimuove un sottoassieme
    removeSottoassieme(progressivo) {
        this.sottoassiemi = this.sottoassiemi.filter(sa => sa.progressivo !== progressivo);
        
        // ✅ Ricalcola le dipendenze dopo aver eliminato il sottoassieme
        this.recalculateAllDependencies();
    }

    // Trova un articolo nel database (o restituisce info minime se non trovato)
    findArticolo(codice) {
        const articolo = this.articoli.find(a => a.codice === codice);
        if (articolo) {
            return { ...articolo, trovato: true };
        }
        // Articolo non trovato - restituisce struttura minima con warning
        return {
            codice: codice,
            descrizione: '⚠️ ARTICOLO NON TROVATO',
            categoria: 'UNKNOWN',
            trovato: false
        };
    }

    // Trova un phantom nel database
    findPhantom(codice) {
        return this.phantom.find(p => p.codice === codice);
    }

    // Esplode un phantom ricorsivamente
    explodePhantom(phantom, variante, progressivoSottoassieme, parentVariant = null) {
        const phantomData = this.findPhantom(phantom.codice || phantom);
        if (!phantomData) {
            console.error(`Phantom ${phantom.codice || phantom} non trovato!`);
            return;
        }

        const variantData = phantomData.varianti[variante];
        if (!variantData) {
            console.error(`Variante ${variante} non trovata per phantom ${phantomData.codice}!`);
            return;
        }

        // Aggiungi articoli fissi
        phantomData.articoli_fissi.forEach(item => {
            const articolo = this.findArticolo(item.codice);
            this.addArticoloInternal(progressivoSottoassieme, articolo, item.quantita, phantomData.codice, variante);
        });

        // Aggiungi articoli della variante
        variantData.articoli.forEach(item => {
            if (item.tipo === 'phantom') {
                // È un phantom annidato - chiedi variante (questo verrà gestito dall'UI)
                // Per ora lo segniamo come "da esplodere"
                console.log(`Phantom annidato trovato: ${item.codice} - richiede selezione variante`);
            } else {
                const articolo = this.findArticolo(item.codice);
                this.addArticoloInternal(progressivoSottoassieme, articolo, item.quantita, phantomData.codice, variante);
            }
        });
    }

    // Aggiunge un articolo (interfaccia pubblica)
    addArticolo(progressivoSottoassieme, item, quantita = 1, variante = null) {
        // Controlla se è un phantom
        const phantom = this.findPhantom(item.codice);
        if (phantom) {
            // È un phantom - deve avere una variante
            if (!variante) {
                console.error('Tentativo di aggiungere phantom senza variante!');
                return false;
            }
            this.explodePhantom(phantom, variante, progressivoSottoassieme);
            return true;
        }

        // È un articolo normale
        this.addArticoloInternal(progressivoSottoassieme, item, quantita);
        
        // Applica dipendenze
        this.checkAndApplyDependencies(item.codice, quantita, progressivoSottoassieme);
        
        return true;
    }

    // Aggiunge un articolo (metodo interno)
    addArticoloInternal(progressivoSottoassieme, articolo, quantita = 1, phantomPadre = null, variantePadre = null) {
    const sottoassieme = this.sottoassiemi.find(sa => sa.progressivo === progressivoSottoassieme);
    if (!sottoassieme) return;

    // Controlla se l'articolo esiste già (stesso codice, phantom e variante)
    const existing = sottoassieme.articoli.find(a => 
        a.codice === articolo.codice && 
        a.phantomPadre === phantomPadre &&
        a.variantePadre === variantePadre
    );
    
    if (existing) {
        existing.quantita += quantita;
    } else {
        sottoassieme.articoli.push({
            ...articolo,
            quantita: quantita,
            phantomPadre: phantomPadre,
            variantePadre: variantePadre
        });
    }
    }


    // Controlla e applica dipendenze per un articolo appena aggiunto
    // Controlla e applica dipendenze per un articolo appena aggiunto
    // Applica tutte le dipendenze (calcola somme totali)
    checkAndApplyDependencies(codiceArticolo, quantita, progressivoSottoassiemeOrigine) {
        console.log('🔍 Controllo dipendenze per:', codiceArticolo);
        
        // Dopo aver modificato un articolo, ricalcola TUTTE le dipendenze
        this.recalculateAllDependencies();
    }

    // Aggiorna le quantità degli articoli generati da dipendenze
    // Aggiorna le quantità degli articoli generati da dipendenze
    updateDependenciesQuantity(codiceArticoloTrigger, nuovaQuantita, progressivoSottoassieme) {
        // Ricalcola tutte le dipendenze
        this.recalculateAllDependencies();
    }


    // Ricalcola tutte le dipendenze in base agli articoli attivi
    recalculateAllDependencies() {
        console.log('🔄 Ricalcolo dipendenze...');
        
        // Mappa per raccogliere le quantità richieste: { "progressivo_sottoassieme": { "codice_articolo": quantità_totale } }
        const targetMap = {};
        
        // FASE 1: Calcola tutte le quantità richieste per ogni target
        this.dipendenze.forEach(dep => {
            // Normalizza targets: supporta sia formato vecchio che nuovo
            let targetsList = [];
            
            if (dep.targets && Array.isArray(dep.targets)) {
                // Nuovo formato: array di targets
                targetsList = dep.targets;
            } else if (dep.target) {
                // Vecchio formato: singolo target
                targetsList = [{ codice: dep.target, ratio: dep.ratio || 1 }];
            } else {
                console.warn('⚠️ Dipendenza senza target:', dep);
                return;
            }
            
            // Processa ogni target
            targetsList.forEach(targetItem => {
                const targetCode = targetItem.codice;
                const targetRatio = targetItem.ratio || 1;
                
                if (dep.sottoassieme_destinazione === 'SAME') {
                    // Per SAME, processa ogni sottoassieme separatamente
                    this.sottoassiemi.forEach(sottoassieme => {
                        let quantitaLocale = 0;
                        
                        sottoassieme.articoli.forEach(articolo => {
                            if (dep.trigger.includes(articolo.codice)) {
                                quantitaLocale += articolo.quantita;
                            }
                        });
                        
                        if (quantitaLocale > 0) {
                            const quantitaTarget = quantitaLocale * targetRatio;
                            const key = sottoassieme.progressivo;
                            
                            if (!targetMap[key]) targetMap[key] = {};
                            if (!targetMap[key][targetCode]) targetMap[key][targetCode] = 0;
                            
                            targetMap[key][targetCode] += quantitaTarget;
                            console.log(`  📍 SAME: ${targetCode} in ${sottoassieme.codice} +${quantitaTarget}x`);
                        }
                    });
                } else {
                    // Destinazione fissa
                    let quantitaTotale = 0;
                    
                    this.sottoassiemi.forEach(sottoassieme => {
                        sottoassieme.articoli.forEach(articolo => {
                            if (dep.trigger.includes(articolo.codice)) {
                                quantitaTotale += articolo.quantita;
                            }
                        });
                    });
                    
                    if (quantitaTotale > 0) {
                        const quantitaTarget = quantitaTotale * targetRatio;
                        const key = dep.sottoassieme_destinazione;
                        
                        if (!targetMap[key]) targetMap[key] = {};
                        if (!targetMap[key][targetCode]) targetMap[key][targetCode] = 0;
                        
                        targetMap[key][targetCode] += quantitaTarget;
                        console.log(`  📍 FIXED: ${targetCode} in OP ${key} +${quantitaTarget}x`);
                    }
                }
            });
        });
        
        console.log('📊 Mappa target calcolata:', targetMap);
        
        // FASE 2: Applica le quantità calcolate
        this.sottoassiemi.forEach(sottoassieme => {
            const targetsInThisSA = targetMap[sottoassieme.progressivo] || {};
            
            // Per ogni target richiesto in questo sottoassieme
            Object.keys(targetsInThisSA).forEach(targetCode => {
                const quantitaRichiesta = targetsInThisSA[targetCode];
                
                // Cerca se esiste già
                const existing = sottoassieme.articoli.find(a => 
                    a.codice === targetCode && 
                    a.phantomPadre === null &&
                    a.isFromDependency === true
                );
                
                if (existing) {
                    // Aggiorna quantità
                    existing.quantita = quantitaRichiesta;
                    console.log(`✏️ Aggiornato ${targetCode} in ${sottoassieme.codice}: ${quantitaRichiesta}x`);
                } else {
                    // Crea nuovo
                    const articoloTarget = this.findArticolo(targetCode);
                    sottoassieme.articoli.push({
                        ...articoloTarget,
                        quantita: quantitaRichiesta,
                        phantomPadre: null,
                        variantePadre: null,
                        isFromDependency: true
                    });
                    console.log(`✅ Aggiunto ${targetCode} in ${sottoassieme.codice}: ${quantitaRichiesta}x`);
                }
            });
            
            // Rimuovi target che non sono più richiesti
            const requiredCodes = Object.keys(targetsInThisSA);
            sottoassieme.articoli = sottoassieme.articoli.filter(a => {
                if (a.isFromDependency === true && a.phantomPadre === null) {
                    if (!requiredCodes.includes(a.codice)) {
                        console.log(`🗑️ Rimosso ${a.codice} da ${sottoassieme.codice} (non più richiesto)`);
                        return false;
                    }
                }
                return true;
            });
        });
        
        console.log('✅ Ricalcolo completato');
    }



    // Rimuove gli articoli generati da dipendenze quando rimuovi il trigger
    removeDependenciesArticles(codiceArticoloTrigger) {
        // Ricalcola tutte le dipendenze
        this.recalculateAllDependencies();
    }

    // Rimuove un articolo da un sottoassieme
    removeArticolo(progressivoSottoassieme, codiceArticolo, phantomPadre = null, gruppoAssieme = null) {
        const sottoassieme = this.sottoassiemi.find(sa => sa.progressivo === progressivoSottoassieme);
        if (!sottoassieme) return;

        sottoassieme.articoli = sottoassieme.articoli.filter(a => {
            if (a.codice !== codiceArticolo) return true;
            if (a.phantomPadre !== phantomPadre) return true;
            if (gruppoAssieme && a.gruppoAssieme !== gruppoAssieme) return true;
            if (!gruppoAssieme && a.gruppoAssieme) return true;
            return false;
        });
        
        // Ricalcola le dipendenze dopo la rimozione
        this.removeDependenciesArticles(codiceArticolo);
    }

    // Modifica quantità di un articolo
    updateQuantita(progressivoSottoassieme, codiceArticolo, delta, phantomPadre = null, gruppoAssieme = null) {
        const sottoassieme = this.sottoassiemi.find(sa => sa.progressivo === progressivoSottoassieme);
        if (!sottoassieme) return;

        const articolo = sottoassieme.articoli.find(a => {
            if (a.codice !== codiceArticolo) return false;
            if (a.phantomPadre !== phantomPadre) return false;
            if (gruppoAssieme && a.gruppoAssieme !== gruppoAssieme) return false;
            if (!gruppoAssieme && a.gruppoAssieme) return false;
            return true;
        });
        
        if (!articolo) return;

        articolo.quantita += delta;
        if (articolo.quantita < 1) articolo.quantita = 1;
        
        // Aggiorna le dipendenze se questo articolo è un trigger
        this.updateDependenciesQuantity(codiceArticolo, articolo.quantita, progressivoSottoassieme);
    }

    // Imposta quantità diretta
    setQuantita(progressivoSottoassieme, codiceArticolo, quantita, phantomPadre = null, gruppoAssieme = null) {
        const sottoassieme = this.sottoassiemi.find(sa => sa.progressivo === progressivoSottoassieme);
        if (!sottoassieme) return;

        const articolo = sottoassieme.articoli.find(a => {
            if (a.codice !== codiceArticolo) return false;
            if (a.phantomPadre !== phantomPadre) return false;
            if (gruppoAssieme && a.gruppoAssieme !== gruppoAssieme) return false;
            if (!gruppoAssieme && a.gruppoAssieme) return false;
            return true;
        });
        
        if (!articolo) return;

        articolo.quantita = Math.max(1, parseInt(quantita) || 1);
        
        // Aggiorna le dipendenze se questo articolo è un trigger
        this.updateDependenciesQuantity(codiceArticolo, articolo.quantita, progressivoSottoassieme);
    }

    // Esporta la BoM in formato flat per Excel
    exportFlat() {
        const output = [];
        
        // Prima aggiungi tutte le relazioni macchina → sottoassiemi
        this.sottoassiemi.forEach(sottoassieme => {
            if (sottoassieme.articoli.length > 0) {
                output.push({
                    padre: this.codiceMacchina,
                    figlio: sottoassieme.codice,
                    quantita: 1
                });
            }
        });
        
        // Poi aggiungi tutte le relazioni sottoassieme → articoli
        this.sottoassiemi.forEach(sottoassieme => {
            sottoassieme.articoli.forEach(articolo => {
                output.push({
                    padre: sottoassieme.codice,
                    figlio: articolo.codice,
                    quantita: articolo.quantita,
                    variantePadre: articolo.variantePadre || '',
                    varianteFiglio: ''
                });
            });
        });

        return output;
    }

    // Cerca articoli + phantom
    searchArticoli(query, type = 'codice') {
        if (type === 'codice') {
            const articoliResults = searchByCodice(this.articoli, query);
            const phantomResults = searchByCodice(this.phantom, query).map(p => ({...p, isPhantom: true}));
            return [...articoliResults, ...phantomResults];
        }
        return [];
    }

    searchArticoliByDescrizione(query1, query2) {
        const articoliResults = searchByDescrizione(this.articoli, query1, query2);
        const phantomResults = searchByDescrizione(this.phantom, query1, query2).map(p => ({...p, isPhantom: true}));
        
        // ✅ Unisci e ordina alfabeticamente per descrizione
        const allResults = [...articoliResults, ...phantomResults];
        allResults.sort((a, b) => a.descrizione.localeCompare(b.descrizione));
        
        return allResults.slice(0, 20);
    }

    // ========== GESTIONE ASSIEMI ==========

    // Ottiene assiemi disponibili per un sottoassieme specifico
    getAssiemiDisponibili(progressivoSottoassieme) {
        return this.assiemi.filter(assieme => {
            if (assieme.disponibile_in === 'tutti') return true;
            return assieme.disponibile_in.includes(progressivoSottoassieme);
        });
    }

    // Aggiunge un assieme a un sottoassieme
    addAssieme(progressivoSottoassieme, assiemeId, quantitaAssieme = 1) {
        const sottoassieme = this.sottoassiemi.find(sa => sa.progressivo === progressivoSottoassieme);
        if (!sottoassieme) {
            console.error('Sottoassieme non trovato:', progressivoSottoassieme);
            return false;
        }

        const assieme = this.assiemi.find(a => a.id === assiemeId);
        if (!assieme) {
            console.error('Assieme non trovato:', assiemeId);
            return false;
        }

        // Crea un ID univoco per questo gruppo
        const gruppoId = `${assiemeId}_${Date.now()}`;

        // Aggiungi gruppo alla lista del sottoassieme di origine
        sottoassieme.gruppiAssiemi.push({
            id: gruppoId,
            assiemeId: assiemeId,
            nomeAssieme: assieme.nome,
            quantitaAssieme: quantitaAssieme
        });

        // Espandi gli articoli dell'assieme nei sottoassiemi corretti
        assieme.articoli.forEach(item => {
            const articolo = this.findArticolo(item.codice);
            const quantitaTotale = item.quantita * quantitaAssieme;
            
            // Determina OP destinazione
            let targetProgressivo = progressivoSottoassieme;
            if (item.op_destinazione && item.op_destinazione !== 'SAME') {
                targetProgressivo = item.op_destinazione;
            }
            
            // Trova il sottoassieme target
            const targetSottoassieme = this.sottoassiemi.find(sa => sa.progressivo === targetProgressivo);
            if (!targetSottoassieme) {
                console.warn(`Sottoassieme ${targetProgressivo} non trovato per articolo ${item.codice}`);
                return;
            }
            
            targetSottoassieme.articoli.push({
                ...articolo,
                quantita: quantitaTotale,
                gruppoAssieme: gruppoId,
                progressivoOrigine: progressivoSottoassieme, // Salva l'OP di origine del gruppo
                phantomPadre: null,
                variantePadre: null
            });
        });

        console.log(`✅ Assieme "${assieme.nome}" aggiunto a ${sottoassieme.codice}`);
        return true;
    }

    // Rimuove un gruppo assieme completo
    removeGruppoAssieme(progressivoSottoassieme, gruppoId) {
        // Rimuovi il gruppo dalla lista del sottoassieme di origine
        const sottoassiemeOrigine = this.sottoassiemi.find(sa => sa.progressivo === progressivoSottoassieme);
        if (sottoassiemeOrigine) {
            sottoassiemeOrigine.gruppiAssiemi = sottoassiemeOrigine.gruppiAssiemi.filter(g => g.id !== gruppoId);
        }

        // Rimuovi tutti gli articoli di questo gruppo da TUTTI i sottoassiemi
        this.sottoassiemi.forEach(sa => {
            sa.articoli = sa.articoli.filter(a => a.gruppoAssieme !== gruppoId);
        });

        console.log(`🗑️ Gruppo assieme ${gruppoId} rimosso`);
    }

    // Modifica quantità di un intero gruppo assieme
    updateQuantitaGruppoAssieme(progressivoSottoassieme, gruppoId, nuovaQuantita) {
        const sottoassieme = this.sottoassiemi.find(sa => sa.progressivo === progressivoSottoassieme);
        if (!sottoassieme) return;

        const gruppo = sottoassieme.gruppiAssiemi.find(g => g.id === gruppoId);
        if (!gruppo) return;

        const assieme = this.assiemi.find(a => a.id === gruppo.assiemeId);
        if (!assieme) return;

        const vecchiaQuantita = gruppo.quantitaAssieme;
        gruppo.quantitaAssieme = nuovaQuantita;

        // Ricalcola quantità di tutti gli articoli del gruppo in TUTTI i sottoassiemi
        assieme.articoli.forEach(item => {
            this.sottoassiemi.forEach(sa => {
                const articoloGruppo = sa.articoli.find(a => 
                    a.codice === item.codice && a.gruppoAssieme === gruppoId
                );
                
                if (articoloGruppo) {
                    articoloGruppo.quantita = item.quantita * nuovaQuantita;
                }
            });
        });

        console.log(`📝 Quantità gruppo ${gruppoId}: ${vecchiaQuantita} → ${nuovaQuantita}`);
    }

    // Modifica export per gestire assiemi (gli articoli sono già espansi)
    // Il metodo exportFlat() esistente funziona già correttamente!
}