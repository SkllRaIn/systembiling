import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.js'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)
  const nav = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password)
      if (user.role === 'ADS_MANAGER') nav('/ads')
      else if (['SYSADMIN', 'ADMIN'].includes(user.role)) nav('/staff')
      else nav('/cabinet')
    } catch (err) {
      setError(err.response?.data?.error || 'Неверный email или пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">И</span>
          </div>
          <span className="font-bold text-xl text-gray-900">inzhenerim<span className="text-brand-500">.ru</span></span>
        </Link>

        <div className="card p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Вход в кабинет</h1>
          <p className="text-gray-500 text-sm mb-6">Введите данные вашего аккаунта</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-5 flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                className="input"
                placeholder="you@company.ru"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label" style={{marginBottom: 0}}>Пароль</label>
                <Link to="/forgot-password" className="text-xs text-brand-600 hover:underline">
                  Забыли пароль?
                </Link>
              </div>
              <input
                type="password"
                required
                autoComplete="current-password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base mt-2">
              {loading ? (
                <span className="flex items-center gap-2"><span className="animate-spin">⟳</span> Входим...</span>
              ) : 'Войти'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
            Нет аккаунта?{' '}
            <Link to="/register" className="text-brand-600 font-medium hover:underline">
              Зарегистрируйтесь
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} inzhenerim.ru · {' '}
          <Link to="/privacy" className="hover:underline">Политика конфиденциальности</Link>
        </p>
      </div>
    </div>
  )
}
