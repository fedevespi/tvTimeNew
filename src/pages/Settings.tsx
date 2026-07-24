import { useAuth } from '@/lib/auth'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/hooks/useTheme'
import { Settings as SettingsIcon, User, LogOut, ChevronRight, Sun, Moon } from 'lucide-react'

export function Settings() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="pb-20 px-4">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon size={28} className="text-accent" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Impostazioni</h1>
      </div>

      <div className="space-y-3">
        <div className="bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur rounded-xl border border-slate-200 dark:border-slate-700/50 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
              <User size={24} className="text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-slate-900 dark:text-white font-medium">{user?.email}</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Account</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur rounded-xl border border-slate-200 dark:border-slate-700/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon size={20} className="text-accent" /> : <Sun size={20} className="text-accent" />}
              <div>
                <p className="text-slate-900 dark:text-white font-medium">Modalità</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{theme === 'dark' ? 'Notte' : 'Giorno'}</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${
                theme === 'dark' ? 'bg-accent' : 'bg-slate-300'
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur rounded-xl border border-slate-200 dark:border-slate-700/50 divide-y divide-slate-200/50 dark:divide-slate-700/50">
          <button
            onClick={() => navigate('/info')}
            className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-200/30 dark:hover:bg-slate-700/30 transition-colors rounded-t-xl"
          >
            <span className="text-slate-900 dark:text-white flex-1">Informazioni</span>
            <ChevronRight size={18} className="text-slate-500 dark:text-slate-400" />
          </button>

          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-200/30 dark:hover:bg-slate-700/30 transition-colors rounded-b-xl"
          >
            <LogOut size={20} className="text-red-400" />
            <span className="text-red-400 font-medium">Esci</span>
          </button>
        </div>
      </div>
    </div>
  )
}
