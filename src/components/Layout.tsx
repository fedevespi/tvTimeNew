import { useRef, useEffect, useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { Home, Compass, List, Info, LogOut, Settings } from 'lucide-react'

export function Layout() {
  const { user, signOut } = useAuth()
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/discover', label: 'Scopri', icon: Compass },
    { path: '/lists', label: 'Liste', icon: List },
  ]

  const navRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const [pill, setPill] = useState({ left: 0, width: 0 })

  // Le sotto-rotte mantengono attiva la voce padre (es. /lists/visto/movie → Liste)
  const activeIndex = navItems.findIndex(i =>
    i.path === '/'
      ? location.pathname === '/'
      : location.pathname === i.path || location.pathname.startsWith(`${i.path}/`)
  )

  useEffect(() => {
    const el = itemRefs.current[activeIndex]
    const nav = navRef.current
    if (el && nav) {
      const navRect = nav.getBoundingClientRect()
      const elRect = el.getBoundingClientRect()
      setPill({
        left: elRect.left - navRect.left,
        width: elRect.width,
      })
    }
  }, [activeIndex])

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <header className="bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700/50 px-4 py-2.5 flex items-center justify-between sticky top-0 z-30">
        <Link to="/" className="flex items-center gap-2">
          <img src="/icon-180.png" alt="" className="w-7 h-7 rounded-lg" />
          <span className="text-lg font-bold text-slate-900 dark:text-white">
            tv<span className="text-accent">Boss</span>
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <Link
            to="/info"
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <Info size={18} />
          </Link>
          {user && (
            <Link
              to="/settings"
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <Settings size={18} />
            </Link>
          )}
          {user ? (
            <button
              onClick={signOut}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <LogOut size={18} />
            </button>
          ) : (
            <Link to="/login" className="p-1.5 rounded-lg text-accent hover:text-accent-light transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto pt-4 pb-20">
        <Outlet />
      </main>

      {user && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
          <nav
            ref={navRef}
            className="relative flex items-center bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 rounded-full px-1.5 py-1.5 shadow-lg shadow-black/30"
          >
            <div
              className="absolute top-1.5 bottom-1.5 rounded-full bg-accent/15 transition-all duration-500 ease-[cubic-bezier(0.35,1.5,0.65,1)]"
              style={{ left: pill.left, width: pill.width }}
            />
            {navItems.map((item, i) => {
              const isActive = activeIndex === i
              return (
                <Link
                  key={item.path}
                  ref={el => { itemRefs.current[i] = el }}
                  to={item.path}
                  className={`relative z-10 flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full transition-colors duration-300 ${
                    isActive ? 'text-accent' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <item.icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                  <span className="text-[9px] font-medium leading-none">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </div>
  )
}
