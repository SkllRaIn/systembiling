import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.js'
import api from '../../lib/api.js'

export default function ClientDashboard() {
  const { user } = useAuthStore()
  const [invoices, setInvoices] = useState([])
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/invoices?limit=3'),
      api.get('/tickets?limit=3'),
    ]).then(([inv, tik]) => {
      setInvoices(inv.data.invoices)
      setTickets(tik.data.tickets)
    }).finally(() => setLoading(false))
  }, [])

  const pendingInvoices = invoices.filter((i) => i.status === 'PENDING')
  const openTickets = tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS')

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Добро пожаловать, {user?.name}!</h1>
      <p className="text-gray-400 text-sm mb-8">Личный кабинет клиента</p>

      {loading ? (
        <p className="text-gray-400 text-center py-12">Загрузка...</p>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="card p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Неоплаченных счетов</p>
              <p className="text-3xl font-bold text-yellow-600">{pendingInvoices.length}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Открытых тикетов</p>
              <p className="text-3xl font-bold text-blue-600">{openTickets.length}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Всего тикетов</p>
              <p className="text-3xl font-bold text-gray-700">{tickets.length}</p>
            </div>
          </div>

          {/* Recent invoices */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Последние счета</h2>
              <Link to="/cabinet/invoices" className="text-sm text-brand-600 hover:underline">Все счета →</Link>
            </div>
            {invoices.length === 0 ? (
              <div className="card p-6 text-center text-gray-400 text-sm">Счетов пока нет</div>
            ) : (
              <div className="space-y-2">
                {invoices.map((inv) => (
                  <div key={inv.id} className="card p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{inv.number}</p>
                      <p className="text-xs text-gray-400">{new Date(inv.createdAt).toLocaleDateString('ru')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-900">{Number(inv.totalAmount).toLocaleString('ru')} ₽</span>
                      <span className={`badge ${inv.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {inv.status === 'PAID' ? 'Оплачен' : 'К оплате'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent tickets */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Последние тикеты</h2>
              <Link to="/cabinet/tickets" className="text-sm text-brand-600 hover:underline">Все тикеты →</Link>
            </div>
            {tickets.length === 0 ? (
              <div className="card p-6 text-center text-gray-400 text-sm">
                Тикетов нет. <Link to="/cabinet/tickets" className="text-brand-600 hover:underline">Создать первый</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {tickets.map((t) => (
                  <Link key={t.id} to={`/cabinet/tickets/${t.id}`} className="card p-4 flex items-center justify-between hover:shadow-md transition-shadow block">
                    <div>
                      <span className="text-xs text-gray-400 font-mono mr-2">#{t.number}</span>
                      <span className="text-sm font-medium text-gray-900">{t.title}</span>
                    </div>
                    <span className={`badge ${t.status === 'OPEN' ? 'bg-blue-100 text-blue-800' : t.status === 'CLOSED' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-800'}`}>
                      {t.status === 'OPEN' ? 'Открыт' : t.status === 'CLOSED' ? 'Закрыт' : t.status === 'IN_PROGRESS' ? 'В работе' : 'Ожидание'}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
