# 📦 SISTEMA ASSIEMI - Guida Integrazione

## 🎯 Cosa è stato implementato

È stata creata una nuova funzionalità **Assiemi** che permette di creare gruppi riutilizzabili di articoli nella distinta base.

---

## 📁 File Creati

### Nuovi file:
1. **assiemi.html** - Pagina gestione assiemi
2. **assiemi-page.css** - Stili specifici pagina assiemi (da mettere in `/css/`)
3. **assiemi.js** - Logica gestione assiemi (da mettere in `/js/`)
4. **assiemi.json** - Database assiemi (da mettere in `/data/`)

### File Modificati:
1. **index.html** - Aggiunto link "Assiemi" nella home
2. **layout.css** - Aggiornato per supportare due link nell'header
3. **bomManager.js** - Aggiunti metodi per gestire assiemi
4. **ui.js** - Aggiunti rendering gruppi e modal assiemi

---

## 🚀 Installazione

### 1. Copia i nuovi file:
```
assiemi.html          → /[root]/
assiemi-page.css      → /css/  (include stili modal completi)
assiemi.js            → /js/
assiemi.json          → /data/
```

**IMPORTANTE:** Il file `assiemi-page.css` include tutti gli stili necessari per i modal, quindi è autonomo e non richiede dipendenze.css

### 2. Sostituisci i file modificati:
```
index.html            → /[root]/
layout.css            → /css/
bomManager.js         → /js/
ui.js                 → /js/
```

---

## 🎨 Funzionalità

### Pagina Assiemi (assiemi.html)
- **Crea assiemi**: Raggruppa articoli con quantità
- **Modifica/Elimina**: Gestisci assiemi esistenti
- **Disponibilità**: Scegli in quali sottoassiemi può essere usato
- **Filtro**: Cerca per nome o codice articolo
- **Export JSON**: Esporta configurazione

### Utilizzo nella BoM
1. Apri un sottoassieme
2. Clicca **"+ Assieme"** (a destra di "Parola chiave 2")
3. Seleziona l'assieme dalla lista
4. Indica la quantità
5. Gli articoli vengono espansi e raggruppati visivamente

### Caratteristiche Gruppi
- **Raggruppamento visivo**: Sfondo azzurro con bordo blu
- **Quantità gruppo**: Modifica la quantità dell'intero assieme
- **Articoli moltiplicati**: Le quantità si aggiornano automaticamente
- **Eliminazione gruppo**: Rimuove tutti gli articoli insieme
- **Export Excel**: Gli articoli vengono espansi (no nome assieme)

---

## 📊 Struttura Dati Assieme

```json
{
  "id": "ASS_EXAMPLE_001",
  "nome": "Kit Pressostato Standard",
  "articoli": [
    {
      "codice": "40C103F",
      "quantita": 2
    },
    {
      "codice": "25C310",
      "quantita": 1
    }
  ],
  "disponibile_in": "tutti"
}
```

**disponibile_in** può essere:
- `"tutti"` → Disponibile in tutti i sottoassiemi
- `["01", "05", "08"]` → Solo nei sottoassiemi specificati

---

## 🎯 Esempio Utilizzo

### 1. Crea Assieme
- Vai su **Assiemi** dalla home
- Clicca **"➕ Nuovo Assieme"**
- Nome: "Kit Valvole Standard"
- Aggiungi articoli: 40C103F (2x), 25C310 (1x)
- Disponibilità: Tutti o specifici OP
- Salva

### 2. Usa in BoM
- Torna alla BoM
- Apri sottoassieme (es: 05 - COMPRESSORE)
- Clicca **"+ Assieme"**
- Seleziona "Kit Valvole Standard"
- Quantità: 3
- Risultato: Gruppo con 40C103F (6x) e 25C310 (3x)

### 3. Export Excel
- Nel foglio "Distinte" compaiono:
  ```
  OP250001005, 40C103F, 6
  OP250001005, 25C310, 3
  ```
  (Nessuna menzione del nome assieme)

---

## 🔧 Note Tecniche

### BomManager - Nuovi Metodi:
- `getAssiemiDisponibili(progressivo)` - Filtra assiemi per sottoassieme
- `addAssieme(progressivo, id, qty)` - Aggiunge assieme espanso
- `removeGruppoAssieme(progressivo, gruppoId)` - Rimuove gruppo
- `updateQuantitaGruppoAssieme(progressivo, gruppoId, qty)` - Modifica quantità

### UI - Nuovi Metodi:
- `renderGruppoAssieme()` - Rendering box azzurro
- `renderArticoloSingolo()` - Rendering articolo normale
- `openAssiemeModal()` - Modal selezione assieme

### Struttura Sottoassieme:
```javascript
{
  progressivo: "05",
  codice: "OP250001005",
  articoli: [...],
  gruppiAssiemi: [
    {
      id: "ASS_xxx_timestamp",
      assiemeId: "ASS_EXAMPLE_001",
      nomeAssieme: "Kit Valvole",
      quantitaAssieme: 3
    }
  ]
}
```

### Struttura Articolo in Gruppo:
```javascript
{
  codice: "40C103F",
  quantita: 6,
  gruppoAssieme: "ASS_xxx_timestamp",  // ← Marca appartenenza
  ...
}
```

---

## ✅ Testing

1. ✅ Crea assieme con 3 articoli
2. ✅ Imposta disponibilità solo su OP specifici
3. ✅ Aggiungi assieme a sottoassieme (qty=2)
4. ✅ Verifica raggruppamento visivo
5. ✅ Modifica quantità gruppo
6. ✅ Esporta Excel (articoli espansi)
7. ✅ Elimina gruppo
8. ✅ Filtro ricerca assiemi

---

## 🎨 Design

- **Stile minimale** come Dipendenze
- **Box azzurri** per gruppi assiemi
- **Icona 📦** per identificare assiemi
- **Hover effects** su tutti i controlli
- **Responsive** su mobile

---

## 📝 Prossimi Sviluppi Possibili

- [ ] Modifica quantità singolo articolo nel gruppo
- [ ] Assiemi annidati (assieme dentro assieme)
- [ ] Import CSV assiemi
- [ ] Statistiche utilizzo assiemi
- [ ] Duplica assieme
- [ ] Template assiemi predefiniti

---

## 🐛 Troubleshooting

**Gli assiemi non compaiono nel modal:**
→ Verifica che `disponibile_in` includa il sottoassieme o sia "tutti"

**Export Excel non mostra articoli:**
→ Gli articoli sono già espansi in `exportFlat()`, funziona correttamente

**Gruppo non si aggiorna:**
→ Verifica che `refreshAllExpanded()` sia chiamato dopo modifiche

---

**Creato il:** 24 Ottobre 2025
**Versione:** 1.0
**Compatibilità:** BOM Builder v2.0+
