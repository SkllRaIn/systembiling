import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api.js'

const STATUS_LABEL = { OPEN: 'Открыт', IN_PROGRESS: 'В работе', WAITING: 'Ожидание', CLOSED: 'Закрыт' }
const STATUS_COLOR = { OPEN: 'bg-blue-100 text-blue-800', IN_PROGRESS: 'bg-yellow-100 text-yellow-800', WAITING: 'bg-purple-100 text-purple-800', CLOSED: 'bg-gray-100 text-gray-600' }
const PRIORITY_COLOR = { LOW: 'bg-green-100 text-green-800', MEDIUM: 'bg-yellow-100 text-yellow-800', HIGH: 'bg-orange-100 text-orange-800', CRITICAL: 'bg-red-100 text-red-800' }
const PRIORITY_LABEL = { LOW: 'Низкий', MEDIUM: 'Средний', HIGH: 'Высокий', CRITICAL: 'Критичный' }

export default function TicketQueue() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ status: '', priority: '' })

  const load = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filter.status) params.set('status', filter.status)
    if (filter.priority) params.set('priority', filter.priority)
    const { data } = await api.get(`/tickets?${params}`)
    setTickets(data.tickets)
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Очередь тикетов</h1>

      <div className="flex gap-3 mb-6">
        <select className="input w-auto" value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
          <option value="">Все статусы</option>
          <option value="OPEN">Открытые</option>
          <option value="IN_PROGRESS">В работе</option>
          <option value="WAITING">Ожидание</option>
          <option value="CLOSED">Закрытые</option>
        </select>
        <select className="input w-auto" value={filter.priority} onChange={(e) => setFilter({ ...filter, priority: e.target.value })}>
          <option value="">Все приоритеты</option>
          <option value="CRITICAL">Критичный</option>
          <option value="HIGH">Высокий</option>
          <option value="MEDIUM">Средний</option>
          <option value="LOW">Низкий</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-400">Загрузка...</p>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Тикет</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Клиент</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Приоритет</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Статус</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Назначен</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Создан</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/staff/tickets/${t.id}`} className="text-brand-600 hover:underline font-medium">#{t.number} {t.title}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{t.creator?.name}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${PRIORITY_COLOR[t.priority]}`}>{PRIORITY_LABEL[t.priority]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${STATUS_COLOR[t.status]}`}>{STATUS_LABEL[t.status]}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{t.assignee?.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(t.createdAt).toLocaleDateString('ru')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {tickets.length === 0 && (
            <p className="text-center text-gray-400 py-8">Тикетов нет.</p>
          )}
        </div>
      )}
    </div>
  )
}
