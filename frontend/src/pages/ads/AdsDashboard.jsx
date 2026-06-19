import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api.js'

export default function AdsDashboard() {
  const [account, setAccount] = useState(null)
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/ads/account'),
      api.get('/ads/campaigns?limit=5'),
    ]).then(([acc, camps]) => {
      setAccount(acc.data)
      setCampaigns(camps.data)
    }).finally(() => setLoading(false))
  }, [])

  const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE')
  const totalSpent = campaigns.reduce((s, c) => s + Number(c.spent), 0)

  const STATUS_COLOR = {
    DRAFT: 'bg-gray-100 text-gray-600',
    ACTIVE: 'bg-green-100 text-green-800',
    PAUSED: 'bg-yellow-100 text-yellow-800',
    FINISHED: 'bg-blue-100 text-blue-800',
  }
  const STATUS_LABEL = { DRAFT: 'Черновик', ACTIVE: 'Активна', PAUSED: 'Пауза', FINISHED: 'Завершена' }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Рекламный кабинет</h1>
      <p className="text-gray-400 text-sm mb-8">Управление рекламными кампаниями</p>

      {loading ? (
        <p className="text-gray-400 text-center py-12">Загрузка...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="card p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Баланс</p>
              <p className="text-3xl font-bold text-green-600">{Number(account?.balance || 0).toLocaleString('ru')} ₽</p>
              <Link to="/ads/deposit" className="text-xs text-brand-600 hover:underline mt-2 block">Пополнить →</Link>
            </div>
            <div className="card p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Активных кампаний</p>
              <p className="text-3xl font-bold text-blue-600">{activeCampaigns.length}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Потрачено (все время)</p>
              <p className="text-3xl font-bold text-gray-700">{totalSpent.toLocaleString('ru')} ₽</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Кампании</h2>
              <Link to="/ads/campaigns" className="text-sm text-brand-600 hover:underline">Все кампании →</Link>
            </div>
            {campaigns.length === 0 ? (
              <div className="card p-8 text-center text-gray-400 text-sm">
                Кампаний пока нет. <Link to="/ads/campaigns" className="text-brand-600 hover:underline">Создать первую</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {campaigns.map((c) => (
                  <div key={c.id} className="card p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium text-gray-900">{c.name}</p>
                        <span className={`badge ${STATUS_COLOR[c.status]}`}>{STATUS_LABEL[c.status]}</span>
                      </div>
                      <p className="text-xs text-gray-400">
                        Бюджет: {Number(c.budget).toLocaleString('ru')} ₽ · Потрачено: {Number(c.spent).toLocaleString('ru')} ₽
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
