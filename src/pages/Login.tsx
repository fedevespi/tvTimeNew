import { useState, type FormEvent } from 'react'
import { useAuth } from '@/lib/auth'
import { Link, useNavigate } from 'react-router-dom'

export function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await signIn(email, password)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-3 mb-8">
          <img src="/icon-180.png" alt="" className="w-16 h-16 rounded-2xl" />
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            tv<span className="text-accent">Boss</span>
          </h1>
        </div>
        <form onSubmit={handleSubmit} className="bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur rounded-2xl p-6 space-y-4 border border-slate-200 dark:border-slate-700/50">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Accedi</h2>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-slate-200/50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-accent/50 transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-slate-200/50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-accent/50 transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-accent text-white font-semibold hover:bg-accent-hover disabled:opacity-50 transition-colors"
          >
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </button>
          <p className="text-slate-500 dark:text-slate-400 text-sm text-center">
            Non hai un account?{' '}
            <Link to="/register" className="text-accent hover:text-accent-light transition-colors">Registrati</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
