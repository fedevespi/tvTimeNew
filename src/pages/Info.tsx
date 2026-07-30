import { Link } from 'react-router-dom'

export function Info() {
  return (
    <div className="pb-20 px-4">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Informazioni</h1>

      <div className="space-y-6">
        <section className="bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur rounded-2xl p-5 border border-slate-200 dark:border-slate-700/50">
          <div className="flex items-center gap-3 mb-3">
            <img src="/icon-180.png" alt="" className="w-10 h-10 rounded-xl" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">tvBoss</h2>
          </div>
          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
            Una web app per tracciare film e serie TV: cosa hai visto, cosa vuoi vedere,
            e cosa c'è in circolazione. Ispirata a TV Show Time.
          </p>
        </section>

        <section className="bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur rounded-2xl p-5 border border-slate-200 dark:border-slate-700/50">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Dati e contenuti</h2>
          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-4">
            I dati relativi a film, serie TV, copertine, trame e cast sono forniti
            da The Movie Database (TMDB). Questo prodotto usa l'API di TMDB ma non
            è endorsement o certificato alcunché da TMDB.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <img
                src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
                alt="The Movie Database"
                className="h-8"
              />
            </a>
            <a
              href="https://www.themoviedb.org/documentation/api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent text-sm hover:text-accent-light transition-colors"
            >
              Documentazione API
            </a>
          </div>
        </section>

        <section className="bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur rounded-2xl p-5 border border-slate-200 dark:border-slate-700/50">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Technologie</h2>
          <ul className="text-slate-700 dark:text-slate-300 text-sm space-y-1">
            <li>React + TypeScript + Vite</li>
            <li>Supabase (autenticazione e database)</li>
            <li>TMDB API (dati film e serie TV)</li>
            <li>Tailwind CSS</li>
          </ul>
        </section>

        <div className="text-center">
          <Link to="/" className="text-accent text-sm hover:text-accent-light transition-colors">
            Torna alla Home
          </Link>
        </div>
      </div>
    </div>
  )
}
