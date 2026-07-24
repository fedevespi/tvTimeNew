import { useState, useRef } from 'react'
import { useAuth } from '@/lib/auth'
import {
  parseFileToImportData,
  importDataToSupabase,
  ImportData,
  ImportProgress,
  UnresolvedItem,
} from '@/lib/importer'
import { UnresolvedTitlesModal } from './UnresolvedTitlesModal'
import {
  FolderArchive,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Film,
  Tv,
  RefreshCw,
  HelpCircle,
} from 'lucide-react'

export function ImportZipCard() {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [parsedData, setParsedData] = useState<ImportData | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [unresolvedItems, setUnresolvedItems] = useState<UnresolvedItem[]>([])
  const [showModal, setShowModal] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFileName(file.name)
    setError(null)
    setLoading(true)
    setParsedData(null)
    setProgress(null)
    setUnresolvedItems([])
    setShowModal(false)

    try {
      const data = await parseFileToImportData(file)
      if (data.movies.length === 0 && data.series.length === 0) {
        setError('Nessun film o serie TV trovata nel file selezionato. Assicurati che contenga file JSON validi.')
      } else {
        setParsedData(data)
      }
    } catch (err: unknown) {
      console.error(err)
      setError('Impossibile leggere il file ZIP/JSON. Verifica il formato del file.')
    } finally {
      setLoading(false)
    }
  }

  const handleStartImport = async () => {
    if (!user || !parsedData) return

    setLoading(true)
    setError(null)
    setUnresolvedItems([])

    try {
      const result = await importDataToSupabase(user.id, parsedData, p => {
        setProgress(p)
      })

      if (result.unresolvedItems && result.unresolvedItems.length > 0) {
        setUnresolvedItems(result.unresolvedItems)
        setShowModal(true)
      }
    } catch (err: unknown) {
      console.error(err)
      setError('Si è verificato un errore durante l\'importazione dei dati nel database.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setParsedData(null)
    setSelectedFileName(null)
    setProgress(null)
    setError(null)
    setUnresolvedItems([])
    setShowModal(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const percent = progress && progress.totalItems > 0
    ? Math.round((progress.processedItems / progress.totalItems) * 100)
    : 0

  return (
    <div className="bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur rounded-xl border border-slate-200 dark:border-slate-700/50 p-4 shadow-sm transition-all space-y-4">
      {/* Header section matching Settings Modalita card */}
      <div className="flex items-center gap-3">
        <FolderArchive size={20} className="text-accent shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-slate-900 dark:text-white font-medium">Importa Liste (ZIP / JSON)</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm truncate">Carica file TV Time da sincronizzare</p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".zip,.json,.txt"
        className="hidden"
        onChange={handleFileChange}
        disabled={loading && progress?.phase === 'resolving'}
      />

      {/* Upload Dropzone */}
      {!parsedData && !progress && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 ${
            loading
              ? 'border-accent/50 bg-accent/5'
              : 'border-slate-300/80 dark:border-slate-700/80 hover:border-accent hover:bg-accent/5'
          }`}
        >
          {loading ? (
            <div className="flex flex-col items-center gap-2 py-1">
              <Loader2 className="animate-spin text-accent" size={28} />
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                Lettura file in corso...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-1">
              <Upload className="text-slate-400 dark:text-slate-500 group-hover:text-accent transition-colors" size={28} />
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Clicca per selezionare un file ZIP o JSON
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Supporta ZIP con file JSON (movie, series/shows)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Parsed Preview */}
      {parsedData && !progress && (
        <div className="space-y-3">
          <div className="bg-slate-200/50 dark:bg-slate-900/50 rounded-xl p-3 text-xs flex justify-between items-center border border-slate-300/50 dark:border-slate-700/50">
            <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
              {selectedFileName}
            </span>
            <button
              onClick={handleReset}
              className="text-accent hover:text-accent/80 font-medium transition-colors"
            >
              Cambia file
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-200/50 dark:bg-slate-900/50 rounded-xl border border-slate-300/50 dark:border-slate-700/50 text-center">
              <div className="flex items-center justify-center gap-1.5 text-accent mb-1">
                <Film size={16} />
                <span className="text-xs font-semibold uppercase tracking-wide">Film</span>
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {parsedData.movies.length}
              </span>
            </div>

            <div className="p-3 bg-slate-200/50 dark:bg-slate-900/50 rounded-xl border border-slate-300/50 dark:border-slate-700/50 text-center">
              <div className="flex items-center justify-center gap-1.5 text-accent mb-1">
                <Tv size={16} />
                <span className="text-xs font-semibold uppercase tracking-wide">Serie TV</span>
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {parsedData.series.length}
              </span>
            </div>
          </div>

          <button
            onClick={handleStartImport}
            disabled={loading}
            className="w-full py-3 px-4 bg-accent hover:bg-accent/90 active:scale-[0.98] text-white font-medium text-sm rounded-xl shadow-sm transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Upload size={18} />
            <span>Avvia Importazione nel Database</span>
          </button>
        </div>
      )}

      {/* Progress & Results */}
      {progress && (
        <div className="space-y-3 pt-1">
          {progress.phase !== 'complete' ? (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
                <span className="truncate max-w-[220px]">{progress.message}</span>
                <span className="text-accent font-semibold">{percent}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700/60 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-accent h-full transition-all duration-300 rounded-full"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-500 font-semibold text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                <CheckCircle2 size={20} className="shrink-0" />
                <span>Importazione completata con successo!</span>
              </div>

              {progress.stats && (
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-3 bg-slate-200/50 dark:bg-slate-900/50 rounded-xl border border-slate-300/50 dark:border-slate-700/50">
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] uppercase font-medium">Film</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                      {progress.stats.moviesImported}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-200/50 dark:bg-slate-900/50 rounded-xl border border-slate-300/50 dark:border-slate-700/50">
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] uppercase font-medium">Serie</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                      {progress.stats.seriesImported}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-200/50 dark:bg-slate-900/50 rounded-xl border border-slate-300/50 dark:border-slate-700/50">
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] uppercase font-medium">Episodi</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                      {progress.stats.episodesImported}
                    </p>
                  </div>
                </div>
              )}

              {unresolvedItems.length > 0 && (
                <button
                  onClick={() => setShowModal(true)}
                  className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-medium text-xs rounded-xl shadow-sm transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <HelpCircle size={16} />
                  <span>Risolvi {unresolvedItems.length} titoli non trovati</span>
                </button>
              )}

              <button
                onClick={handleReset}
                className="w-full py-2.5 px-4 bg-slate-200/50 dark:bg-slate-700/50 hover:bg-slate-300/50 dark:hover:bg-slate-600/50 text-slate-800 dark:text-slate-200 font-medium text-xs rounded-xl border border-slate-200/60 dark:border-slate-700/60 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} />
                <span>Importa un altro file</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Unresolved Titles Popup Modal */}
      {showModal && unresolvedItems.length > 0 && user && (
        <UnresolvedTitlesModal
          userId={user.id}
          items={unresolvedItems}
          onClose={resolvedDelta => {
            setShowModal(false)
            setUnresolvedItems([])
            setProgress(prev => {
              if (!prev || !prev.stats) return prev
              return {
                ...prev,
                stats: {
                  moviesImported: prev.stats.moviesImported + resolvedDelta.movies,
                  seriesImported: prev.stats.seriesImported + resolvedDelta.series,
                  episodesImported: prev.stats.episodesImported + resolvedDelta.episodes,
                  notFoundCount: Math.max(0, prev.stats.notFoundCount - (resolvedDelta.movies + resolvedDelta.series)),
                },
              }
            })
          }}
        />
      )}
    </div>
  )
}
