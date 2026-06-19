import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.js'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const register = useAuthStore((s) => s.register)
  const nav = useNavigate()

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const passwordStrength = (p) => {
    if (!p) return null
    if (p.length < 6) return { level: 0, label: 'Слишком короткий', color: 'bg-red-400' }
    if (p.length < 8 || !/[A-Z]/.test(p)) return { level: 1, label: 'Слабый', color: 'bg-orange-400' }
    if (!/[0-9]/.test(p)) return { level: 2, label: 'Средний', color: 'bg-yellow-400' }
    return { level: 3, label: 'Надёжный', color: 'bg-green-500' }
  }

  const strength = passwordStrength(form.password)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) return setError('Пароли не совпадают')
    if (!agreed) return setError('Необходимо принять политику обработки персональных данных')
    setError('')
    setLoading(true)
    try {
      await register(form.email, form.password, form.name, form.phone)
      // После регистрации показываем экран "проверьте почту"
      setEmailSent(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center justify-center gap-2 mb-8">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">И</span>
            </div>
            <span className="font-bold text-xl text-gray-900">inzhenerim<span className="text-brand-500">.ru</span></span>
          </Link>
          <div className="card p-8 shadow-lg text-center">
            <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-5">📬</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Подтвердите email</h2>
            <p className="text-gray-500 mb-6">
              Мы отправили письмо с подтверждением на адрес<br />
              <strong className="text-gray-900">{form.email}</strong>
            </p>
            <p className="text-sm text-gray-400 mb-6">
              Перейдите по ссылке в письме, чтобы активировать аккаунт.
              Не забудьте проверить папку «Спам».
            </p>
            <Link to="/login" className="btn-primary w-full justify-center py-3">
              Перейти ко входу
            </Link>
            <button
              className="mt-3 text-xs text-gray-400 hover:text-brand-600 transition-colors"
              onClick={() => { /* TODO: resend */ alert('Письмо отправлено повторно') }}
            >
              Не получили письмо? Отправить ещё раз
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">И</span>
          </div>
          <span className="font-bold text-xl text-gray-900">inzhenerim<span className="text-brand-500">.ru</span></span>
        </Link>

        <div className="card p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Создать аккаунт</h1>
          <p className="text-gray-500 text-sm mb-6">Зарегистрируйтесь, чтобы создавать заявки и отслеживать работы</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-5 flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Имя *</label>
              <input
                required
                className="input"
                placeholder="Иван Петров"
                value={form.name}
                onChange={set('name')}
              />
            </div>
            <div>
              <label className="label">Email *</label>
              <input
                type="email"
                required
                autoComplete="email"
                className="input"
                placeholder="ivan@company.ru"
                value={form.email}
                onChange={set('email')}
              />
              <p className="text-xs text-gray-400 mt-1">На этот адрес придёт письмо с подтверждением</p>
            </div>
            <div>
              <label className="label">Телефон</label>
              <input
                className="input"
                placeholder="+7 (900) 000-00-00"
                value={form.phone}
                onChange={set('phone')}
              />
            </div>
            <div>
              <label className="label">Пароль *</label>
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
              {strength && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.level ? strength.color : 'bg-gray-200'}`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${strength.level >= 2 ? 'text-green-600' : 'text-orange-500'}`}>
                    {strength.label}
                  </p>
                </div>
              )}
            </div>
            <div>
              <label className="label">Повторите пароль *</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                className={`input ${form.confirm && form.password !== form.confirm ? 'border-red-400 focus:ring-red-400' : ''}`}
                placeholder="••••••••"
                value={form.confirm}
                onChange={set('confirm')}
              />
              {form.confirm && form.password !== form.confirm && (
                <p className="text-xs text-red-500 mt-1">Пароли не совпадают</p>
              )}
            </div>

            {/* Privacy agreement */}
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 accent-brand-500 w-4 h-4 flex-shrink-0"
              />
              <span className="text-xs text-gray-500 leading-relaxed">
                Я принимаю{' '}
                <Link to="/privacy" target="_blank" className="text-brand-600 hover:underline font-medium">
                  политику обработки персональных данных
                </Link>{' '}
                и даю согласие на обработку своих персональных данных в соответствии с Федеральным законом № 152-ФЗ
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || !agreed}
              className="btn-primary w-full justify-center py-3 text-base"
            >
              {loading ? (
                <span className="flex items-center gap-2"><span className="animate-spin">⟳</span> Регистрируем...</span>
              ) : 'Создать аккаунт'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">
              Войти
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
