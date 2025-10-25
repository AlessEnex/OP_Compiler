# Theme System - Dark/Light Toggle

## Installazione

### 1. File da aggiungere alla cartella `/css`:
- `theme.css`

### 2. File da aggiungere alla cartella `/js`:
- `theme-toggle.js`

### 3. Aggiornare HTML
In OGNI pagina HTML, aggiungere nell'head PRIMA di tutti gli altri CSS:

```html
<head>
    <!-- Theme system (deve essere caricato per primo) -->
    <link rel="stylesheet" href="css/theme.css">
    <script src="js/theme-toggle.js"></script>
    
    <!-- Altri CSS... -->
</head>
```

## Caratteristiche

### Tema Dark (Default)
- Palette: Graphite + Lavender
- Background: `#0e0f11`
- Accent: `#b89cff` (lavender)
- Font: Inter + IBM Plex Mono

### Tema Light
- Background: `#f6f7f8`
- Accent: `#0a84ff` (blue)
- Font: Inter + IBM Plex Mono

### Toggle Button
- Posizionato automaticamente nell'header
- Switch animato con icone luna/sole
- Salva preferenza in localStorage
- Transizioni smooth

## Variabili CSS Disponibili

```css
/* Backgrounds */
--bg-primary
--bg-secondary
--bg-tertiary
--bg-elevated

/* Text */
--text-primary
--text-secondary
--text-tertiary

/* Borders */
--border-color
--separator

/* Accents */
--accent-blue
--accent-lavender
--accent-green
--accent-red

/* Shadows */
--shadow-sm
--shadow-md
--shadow-lg

/* Radius */
--radius-sm
--radius-md
--radius-lg
```

## Personalizzazione

### Cambiare tema default
In `theme-toggle.js`, modifica:
```javascript
this.theme = localStorage.getItem('theme') || 'light'; // invece di 'dark'
```

### Aggiungere nuovi colori
In `theme.css`, aggiungi variabili custom:
```css
:root[data-theme="dark"] {
  --custom-color: #ff00ff;
}

:root[data-theme="light"] {
  --custom-color: #00ff00;
}
```

### Disabilitare font Google
Rimuovi la riga import in `theme.css`:
```css
/* @import url('https://fonts.googleapis.com/css2?family=Inter...'); */
```

## Best Practices

1. Usa sempre variabili CSS per i colori
2. Non usare colori hardcoded (es: `#fff`, `black`)
3. Testa entrambi i temi
4. Usa `transition` per animazioni smooth
5. I font monospace usano IBM Plex Mono automaticamente

## Troubleshooting

**Toggle non appare:**
- Verifica che `theme-toggle.js` sia caricato
- Controlla console per errori
- Verifica che esista un elemento `header` o `.header-right`

**Tema non si salva:**
- Controlla localStorage nel browser
- Verifica che il sito non sia in modalità privata

**Colori sbagliati:**
- Verifica che `theme.css` sia caricato PRIMA degli altri CSS
- Controlla l'attributo `data-theme` sull'elemento `<html>`

## Compatibilità

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- IE11 non supportato
