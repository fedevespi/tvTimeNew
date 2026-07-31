# tvBoss — Design System & Linee Guida UI

Ultimo aggiornamento: 2026-07-24

---

## Panoramica Estetica

`tvBoss` utilizza un design moderno, scuro di default (con override chiaro tramite toggle), basato su effetti **glassmorphism** (`backdrop-blur`), bordi sottili e traslucidi, angoli fortemente arrotondati (`rounded-xl` / `rounded-2xl`) e l'accent color arancione del logo (`#f97316` / `text-accent`).

Tutti i componenti visibili nell'applicazione devono rispettare rigorosamente questo linguaggio visivo.

---

## 🎨 Palette Colori e Token CSS

| Elemento | Tema Chiaro | Tema Scuro | Note / Classi Tailwind |
|---|---|---|---|
| **Sfondo Pagina** | `bg-slate-50` | `bg-slate-900` | Definito in `index.css` |
| **Card / Sezioni** | `bg-slate-100/80` | `bg-slate-800/80` | Con `backdrop-blur` |
| **Bordo Card** | `border-slate-200` | `border-slate-700/50` | `border border-slate-200 dark:border-slate-700/50` |
| **Testo Principale** | `text-slate-900` | `text-white` | `text-slate-900 dark:text-white` |
| **Testo Secondario** | `text-slate-500` | `text-slate-400` | `text-slate-500 dark:text-slate-400` |
| **Accent Color** | `#f97316` | `#f97316` | `bg-accent`, `text-accent`, `border-accent` |
| **Accent Soft** | `bg-accent/15` | `bg-accent/20` | Per sfondi di icone ed elementi attivi |
| **Pill / Hover** | `hover:bg-slate-200/50` | `hover:bg-slate-700/50` | Transizioni smooth |

---

## 📐 Struttura dei Componenti

### 1. Card e Contenitori Generici
I contenitori in tutte le pagine (Impostazioni, Dettagli, Liste, Info) seguono questa struttura standard:
```tsx
<div className="bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur rounded-xl border border-slate-200 dark:border-slate-700/50 p-4 shadow-sm transition-all">
  {/* Contenuto */}
</div>
```

### 2. Badge Icona (Icon Wrapper & Inline Icons)

**I tre trattamenti non sono interscambiabili: si scelgono in base al ruolo della
riga, non a gusto.** Questa sezione elencava le tre varianti come alternative
equivalenti, ed è stata la causa di errori ripetuti — chi scriveva una card nuova
prendeva quella sbagliata restando formalmente nelle regole.

**Nelle righe di Impostazioni si usa sempre l'icona inline.** Sono righe d'azione
tutte di pari livello (Modalità, Importazione, Installa app, App per Android): il
badge riquadrato ne farebbe risaltare una sull'altra senza motivo, e la rende
visivamente simile al blocco Account, che invece è una cosa diversa.

```tsx
{/* Icona Inline Diretta — DEFAULT per le righe di Impostazioni e dei form.
    Esempi: Modalità, Importazione, Installa app, App per Android. */}
<Icona size={20} className="text-accent shrink-0" />

{/* Wrapper Circolare — SOLO per l'identità dell'utente (blocco Account).
    Sta a indicare "questa è una persona", non un'azione: non riusarlo altrove. */}
<div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
  <Icona size={24} className="text-accent" />
</div>

{/* Wrapper Squadrato (rounded-xl) — per elementi in evidenza FUORI da
    Impostazioni. Nelle righe di Impostazioni non si usa. */}
<div className="p-2.5 bg-accent/15 rounded-xl flex items-center justify-center shrink-0">
  <Icona size={20} className="text-accent" />
</div>
```

### 3. Bottoni
- **Bottone Primario (Accent)**:
  ```tsx
  <button className="w-full py-3 px-4 bg-accent hover:bg-accent/90 active:scale-[0.98] text-white font-medium text-sm rounded-xl shadow-sm transition-all duration-200 flex items-center justify-center gap-2">
    <Icona size={18} />
    <span>Testo Bottone</span>
  </button>
  ```
- **Bottone Secondario / Neutro**:
  ```tsx
  <button className="w-full py-2.5 px-4 bg-slate-200/50 dark:bg-slate-700/50 hover:bg-slate-300/50 dark:hover:bg-slate-600/50 text-slate-800 dark:text-slate-200 font-medium text-xs rounded-xl border border-slate-200/60 dark:border-slate-700/60 transition-all duration-200 flex items-center justify-center gap-2">
    <Icona size={16} />
    <span>Testo Bottone</span>
  </button>
  ```

### 4. Area di Dropzone / Upload (Impostazioni e Form)
Le aree di caricamento o selezione file devono integrarsi perfettamente con lo stile dark/light dell'app:
```tsx
<div className="border-2 border-dashed border-slate-300/80 dark:border-slate-700/80 rounded-xl p-5 text-center cursor-pointer hover:border-accent hover:bg-accent/5 dark:hover:bg-accent/5 transition-all duration-200">
  <Upload size={28} className="text-slate-400 dark:text-slate-500 mx-auto mb-2" />
  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Titolo Upload</p>
  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Sottotitolo / Formati</p>
</div>
```

### 5. Box Statistiche / Griglie di Risultati
I micro-riquadri di conteggio o dettaglio interno usano uno sfondo coordinato e bordi traslucidi:
```tsx
<div className="p-3 bg-slate-200/50 dark:bg-slate-900/50 rounded-xl border border-slate-300/50 dark:border-slate-700/50 text-center">
  <div className="flex items-center justify-center gap-1.5 text-accent mb-1">
    <Icona size={16} />
    <span className="text-xs font-semibold uppercase tracking-wide">Label</span>
  </div>
  <span className="text-xl font-bold text-slate-900 dark:text-white">123</span>
</div>
```

### 6. Notifiche di Stato (Successo / Errore / Info)
Le notifiche o messaggi di errore inline usano angoli `rounded-xl`, bordi traslucidi e sfondi opachi adeguati:
- **Successo**: `bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl p-3.5 text-xs`
- **Errore**: `bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl p-3.5 text-xs`
- **Info / Warning**: `bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl p-3.5 text-xs`

---

## 📱 Regole di Responsività e Spaziatura

1. **Margini di Pagina**: Tutte le pagine principali usano `pb-20 px-4` per garantire la compatibilità con la bottom navigation bar fluttuante.
2. **Spaziatura Verticale**: Utilizzare `space-y-3` o `space-y-4` nei contenitori per mantenere una gerarchia pulita e uniforme.
3. **Transizioni**: Applicare sempre `transition-all duration-200` (o `duration-300`) sugli elementi interattivi (bottoni, card hover, toggle).
