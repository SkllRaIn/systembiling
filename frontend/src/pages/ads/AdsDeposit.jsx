import { useEffect, useState } from 'react'
import api from '../../lib/api.js'

const PRESETS = [1000, 3000, 5000, 10000, 25000, 50000]

export default function AdsDeposit() {
  const [account, setAccount] = useState(null)
  const [amount, setAmount] = useState('')
  const [provider, setProvider] = useState('yukassa')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/ads/account').then((r) => setAccount(r.data))
  }, [])

  const handleDeposit = async () => {
    if (!amount || Number(amount) <= 0) return
    setSubmitting(true)
    setError('')
    setResult(null)
    try {
      const { data } = await api.post('/ads/deposit', { amount: Number(amount), provider })
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при создании платежа')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Пополнение баланса</h1>
      <p className="text-gray-400 text-sm mb-8">Средства зачисляются после подтверждения платежа</p>

      {account && (
        <div className="card p-5 mb-6">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Текущий баланс</p>
          <p className="text-3xl font-bold text-green-600">{Number(account.balance).toLocaleString('ru')} ₽</p>
        </div>
      )}

      <div className="card p-6">
        <div className="mb-5">
          <label className="label">Быстрый выбор суммы</label>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setAmount(String(p))}
                className={`rounded-lg border text-sm py-2 font-medium transition-colors ${
                  amount === String(p)
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {p.toLocaleString('ru')} ₽
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="label">Или введите сумму (₽)</label>
          <input
            type="number"
            min="100"
            step="100"
            className="input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Введите сумму"
          />
        </div>

        <div className="mb-6">
          <label className="label">Способ оплаты</label>
          <select className="input" value={provider} onChange={(e) => setProvider(e.target.value)}>
            <option value="yukassa">ЮKassa</option>
            <option value="robokassa">Robokassa</option>
            <option value="manual">Банковский перевод</option>
          </select>
        </div>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        {result ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-800 font-medium mb-1">Заявка создана!</p>
            <p className="text-green-600 text-sm mb-3">Сумма: {Number(amount).toLocaleString('ru')} ₽</p>
            <p className="text-xs text-green-600">ID платежа: {result.deposit?.id}</p>
            <button
              onClick={() => { setResult(null); setAmount('') }}
              className="btn-secondary mt-3 text-sm"
            >
              Создать ещё один платёж
            </button>
          </div>
        ) : (
          <button
            onClick={handleDeposit}
            disabled={submitting || !amount || Number(amount) <= 0}
            className="btn-primary w-full justify-center"
          >
            {submitting ? 'Создание платежа...' : `Пополнить на ${amount ? Number(amount).toLocaleString('ru') + ' ₽' : '...'}`}
          </button>
        )}
      </div>
    </div>
  )
}
