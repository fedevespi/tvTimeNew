# Toggle vista elenco/griglia in "Le mie liste"

## Contesto

Nella pagina `src/pages/MyLists.tsx` ("Le mie liste"), gli elementi delle tre
tab (Da vedere / In corso / Visto) sono oggi mostrati solo come elenco
verticale (`ListItem`: poster piccolo a sinistra, titolo e tipo a destra).

Si vuole aggiungere la possibilità di passare a una vista a griglia (2 colonne,
poster grande in alto e titolo sotto), con un toggle sempre visibile in cima
alla pagina.

## Requisiti

- Toggle unico per l'intera pagina (non per singola tab), posizionato in alto
  a destra, sulla stessa riga del titolo "Le mie liste".
- La preferenza di visualizzazione (elenco/griglia) viene salvata in
  `localStorage` e ripristinata ad ogni apertura dell'app, con lo stesso
  meccanismo di persistenza usato per il tema chiaro/scuro (`useTheme`).
- Vista griglia: 2 elementi per riga, poster grande + titolo sotto. Nessuna
  etichetta "Film"/"Serie TV" (a differenza della vista elenco, che la
  mantiene).
- Vista elenco: invariata rispetto ad oggi.

Fuori scope (nota per lavoro futuro, non implementato ora): separare, in
ciascuna sezione, prima le serie TV poi i film.

## Design

### Persistenza dello stato

Nuovo hook `useListViewMode()` in `src/hooks/useListViewMode.ts`:

- Stato locale (`useState<'list' | 'grid'>`) inizializzato leggendo
  `localStorage.getItem('tvtime-list-view')` (default `'list'`).
- `useEffect` che scrive il valore in `localStorage` ad ogni cambiamento,
  con la stessa chiave `tvtime-list-view`.
- Nessun `Context` globale: a differenza del tema (che deve applicare una
  classe CSS a `document.documentElement` ed essere letto da tutta l'app),
  la vista lista/griglia è consumata solo da `MyLists.tsx`, quindi un hook
  locale con persistenza in `localStorage` è sufficiente e più semplice.
- API dell'hook: `{ viewMode: 'list' | 'grid', setViewMode: (m: 'list' | 'grid') => void }`.

### Toggle UI

In `MyLists.tsx`, la riga del titolo diventa:

```
<div className="flex items-center justify-between mb-4">
  <h1 className="text-2xl font-bold ...">Le mie liste</h1>
  <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-1">
    <button> <List size={18} /> </button>
    <button> <LayoutGrid size={18} /> </button>
  </div>
</div>
```

- Icone da `lucide-react`: `List` (vista elenco) e `LayoutGrid` (vista
  griglia).
- Il pulsante attivo ha lo stile `bg-accent/20 text-accent`, coerente con lo
  stile già usato per le tab Da vedere/In corso/Visto; il pulsante inattivo è
  `text-slate-500 dark:text-slate-400` con `hover:` leggero.

### Vista griglia: componente `GridItem`

Nuovo componente `GridItem` in `MyLists.tsx` (accanto all'esistente
`ListItem`), stesso pattern di caricamento dati (fetch dettagli TMDB via
`useEffect`, `return null` finché non disponibili):

```
<Link to={path} className="group">
  <img
    src={posterUrl(details.poster_path, 'w342')}
    className="w-full aspect-[2/3] object-cover rounded-xl group-hover:opacity-80 transition-opacity"
    onError={...PLACEHOLDER_POSTER}
  />
  <p className="text-slate-900 dark:text-white text-sm mt-1.5 line-clamp-2">{title}</p>
</Link>
```

Stile ispirato alla griglia già presente in `src/pages/Search.tsx`, adattato a
2 colonne invece di 3-5.

### Rendering condizionale nella pagina

```
{viewMode === 'list' ? (
  <div className="space-y-3">
    {filtered.map(title => <ListItem key={title.id} item={title} />)}
  </div>
) : (
  <div className="grid grid-cols-2 gap-3">
    {filtered.map(title => <GridItem key={title.id} item={title} />)}
  </div>
)}
```

Il resto della pagina (tab, filtro per stato, messaggio "nessun titolo") resta
invariato.

## Testing

- Verifica manuale nel browser: cambio vista, refresh pagina (persistenza),
  cambio tab con vista griglia attiva, cambio tema chiaro/scuro con vista
  griglia attiva.
- Nessun test automatico esistente sul progetto per le pagine UI; non se ne
  aggiungono per questa modifica (coerente con lo stato attuale del repo).
