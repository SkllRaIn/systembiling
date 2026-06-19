import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../../lib/api.js'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState('loading') // loading | success | error

  useEffect(() => {
    if (!token) { setStatus('error'); return }
    api.post('/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [token])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">И</span>
          </div>
          <span className="font-bold text-xl text-gray-900">inzhenerim<span className="text-brand-500">.ru</span></span>
        </Link>

        <div className="card p-10 shadow-lg text-center">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <p className="text-gray-600">Проверяем ссылку...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-5">✅</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Email подтверждён!</h2>
              <p className="text-gray-500 mb-8">Аккаунт активирован. Теперь вы можете войти в систему.</p>
              <Link to="/login" className="btn-primary w-full justify-center py-3 text-base">
                Войти в кабинет
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-5">❌</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Ссылка недействительна</h2>
              <p className="text-gray-500 mb-8">
                Ссылка устарела или уже была использована.
                Попробуйте зарегистрироваться снова или обратитесь в поддержку.
              </p>
              <div className="space-y-3">
                <Link to="/register" className="btn-primary w-full justify-center py-3">
                  Зарегистрироваться снова
                </Link>
                <Link to="/login" className="btn-secondary w-full justify-center py-3">
                  Войти
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
