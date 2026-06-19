import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api.js'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      // Не раскрываем, существует ли email — показываем тот же экран
      setSent(true)
    } finally {
      setLoading(false)
    }
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
          {sent ? (
            <div className="text-center">
              <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-5">📬</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Проверьте почту</h2>
              <p className="text-gray-500 mb-6">
                Если аккаунт с адресом <strong className="text-gray-900">{email}</strong> существует,
                мы отправили ссылку для сброса пароля.
              </p>
              <p className="text-sm text-gray-400 mb-8">
                Ссылка действительна 1 час. Проверьте папку «Спам».
              </p>
              <Link to="/login" className="btn-primary w-full justify-center py-3">
                Вернуться ко входу
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Восстановление пароля</h1>
                <p className="text-gray-500 text-sm">
                  Введите email, указанный при регистрации — пришлём ссылку для создания нового пароля.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-5">
                  {error}
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
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base">
                  {loading ? (
                    <span className="flex items-center gap-2"><span className="animate-spin">⟳</span> Отправляем...</span>
                  ) : 'Отправить ссылку'}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-gray-500">
                <Link to="/login" className="text-brand-600 hover:underline">← Вернуться ко входу</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
