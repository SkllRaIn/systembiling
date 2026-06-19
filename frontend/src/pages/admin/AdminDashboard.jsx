import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api.js'

const StatCard = ({ label, value, sub, color = 'text-gray-900', href }) => (
  <div className="card p-5">
    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
    <p className={`text-3xl font-bold ${color}`}>{value ?? '—'}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    {href && (
      <Link to={href} className="text-xs text-brand-600 hover:underline mt-2 inline-block">
        Подробнее →
      </Link>
    )}
  </div>
)

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stats')
      .then(({ data }) => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-gray-400 text-center py-20">Загрузка...</div>
  if (!stats) return <div className="p-8 text-red-400 text-center py-20">Не удалось загрузить статистику</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Дашборд</h1>
      <p className="text-gray-400 text-sm mb-8">Общая статистика системы</p>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Клиентов" value={stats.totalClients} href="/admin/users" />
        <StatCard label="Сотрудников" value={stats.totalStaff} />
        <StatCard
          label="Счетов к оплате"
          value={stats.pendingInvoices}
          color="text-yellow-600"
          href="/admin/invoices"
        />
        <StatCard
          label="Открытых тикетов"
          value={stats.openTickets}
          color="text-blue-600"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Выручка (всего)"
          value={`${Number(stats.totalRevenue || 0).toLocaleString('ru')} ₽`}
          color="text-green-700"
        />
        <StatCard
          label="Выручка (месяц)"
          value={`${Number(stats.monthRevenue || 0).toLocaleString('ru')} ₽`}
          color="text-green-600"
        />
        <StatCard label="Услуг активных" value={stats.activeServices} href="/admin/services" />
        <StatCard label="Задач в работе" value={stats.tasksInWork} />
      </div>

      {/* Recent registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">Последние регистрации</h2>
          <div className="card overflow-hidden">
            {stats.recentUsers?.length === 0 ? (
              <p className="p-5 text-gray-400 text-sm text-center">Нет данных</p>
            ) : (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {stats.recentUsers?.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`badge text-xs ${
                          u.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                          u.role === 'SYSADMIN' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>{u.role}</span>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(u.createdAt).toLocaleDateString('ru')}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="mt-2 text-right">
            <Link to="/admin/users" className="text-sm text-brand-600 hover:underline">
              Все пользователи →
            </Link>
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-gray-900 mb-3">Последние счета</h2>
          <div className="card overflow-hidden">
            {stats.recentInvoices?.length === 0 ? (
              <p className="p-5 text-gray-400 text-sm text-center">Нет данных</p>
            ) : (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {stats.recentInvoices?.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs text-gray-500">{inv.number}</p>
                        <p className="font-medium text-gray-900">{inv.user?.name}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-semibold text-gray-900">
                          {Number(inv.totalAmount).toLocaleString('ru')} ₽
                        </p>
                        <span className={`badge text-xs ${
                          inv.status === 'PAID' ? 'bg-green-100 text-green-700' :
                          inv.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {inv.status === 'PAID' ? 'Оплачен' : inv.status === 'PENDING' ? 'К оплате' : inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="mt-2 text-right">
            <Link to="/admin/invoices" className="text-sm text-brand-600 hover:underline">
              Все счета →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
