import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../lib/api.js'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const nav = useNavigate()

  const [form, setForm] = useState({ password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) return setError('Пароли не совпадают')
    if (form.password.length < 6) return setError('Пароль должен быть не короче 6 символов')
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password: form.password })
      setSuccess(true)
      setTimeout(() => nav('/login'), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Ссылка недействительна или истекла. Запросите новую.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md card p-8 shadow-lg text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Неверная ссылка</h2>
          <p className="text-gray-500 mb-6">Ссылка для сброса пароля отсутствует или повреждена.</p>
          <Link to="/forgot-password" className="btn-primary w-full justify-center py-3">
            Запросить новую ссылку
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">И</span>
          </div>
          <span className="font-bold text-xl text-gray-900">inzhenerim<span className="text-brand-500">.ru</span></span>
        </Link>

        <div className="card p-8 shadow-lg">
          {success ? (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-5">✅</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Пароль изменён!</h2>
              <p className="text-gray-500 mb-6">Перенаправляем вас на страницу входа...</p>
              <Link to="/login" className="btn-primary w-full justify-center py-3">
                Войти сейчас
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Новый пароль</h1>
                <p className="text-gray-500 text-sm">Придумайте надёжный пароль для вашего аккаунта.</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-5">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Новый пароль</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="input"
                    placeholder="Минимум 6 символов"
                    value={form.password}
                    onChange={set('password')}
                  />
                </div>
                <div>
                  <label className="label">Повторите пароль</label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    className={`input ${form.confirm && form.password !== form.confirm ? 'border-red-400' : ''}`}
                    placeholder="••••••••"
                    value={form.confirm}
                    onChange={set('confirm')}
                  />
                  {form.confirm && form.password !== form.confirm && (
                    <p className="text-xs text-red-500 mt-1">Пароли не совпадают</p>
                  )}
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base">
                  {loading ? (
                    <span className="flex items-center gap-2"><span className="animate-spin">⟳</span> Сохраняем...</span>
                  ) : 'Сохранить новый пароль'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
