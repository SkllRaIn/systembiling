import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api.js'

const STATUS_LABEL = { OPEN: 'Открыт', IN_PROGRESS: 'В работе', WAITING: 'Ожидание', CLOSED: 'Закрыт' }
const STATUS_COLOR = {
  OPEN: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  WAITING: 'bg-purple-100 text-purple-800',
  CLOSED: 'bg-gray-100 text-gray-600',
}
const PRIORITY_COLOR = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
}
const PRIORITY_LABEL = { LOW: 'Низкий', MEDIUM: 'Средний', HIGH: 'Высокий', CRITICAL: 'Критичный' }

export default function ClientTickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM' })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data } = await api.get('/tickets')
    setTickets(data.tickets)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/tickets', form)
      setShowForm(false)
      setForm({ title: '', description: '', priority: 'MEDIUM' })
      load()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Мои тикеты</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">+ Новый тикет</button>
      </div>

      {showForm && (
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Создать тикет</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="label">Тема</label>
              <input required className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Кратко опишите проблему" />
            </div>
            <div>
              <label className="label">Описание</label>
              <textarea required rows={4} className="input resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Подробно опишите ситуацию..." />
            </div>
            <div>
              <label className="label">Приоритет</label>
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="LOW">Низкий</option>
                <option value="MEDIUM">Средний</option>
                <option value="HIGH">Высокий</option>
                <option value="CRITICAL">Критичный</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Отправка...' : 'Создать'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Отмена</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-center py-12">Загрузка...</p>
      ) : tickets.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <p className="text-lg mb-2">Тикетов нет</p>
          <p className="text-sm">Создайте первый тикет, чтобы обратиться к сисадминам.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Link key={t.id} to={`/cabinet/tickets/${t.id}`} className="card p-5 flex items-start justify-between hover:shadow-md transition-shadow block">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-mono text-gray-400">#{t.number}</span>
                  <span className={`badge ${STATUS_COLOR[t.status]}`}>{STATUS_LABEL[t.status]}</span>
                  <span className={`badge ${PRIORITY_COLOR[t.priority]}`}>{PRIORITY_LABEL[t.priority]}</span>
                </div>
                <p className="font-medium text-gray-900">{t.title}</p>
                <p className="text-sm text-gray-400 mt-1">{t._count?.comments || 0} комментариев · {new Date(t.createdAt).toLocaleDateString('ru')}</p>
              </div>
              {t.assignee && (
                <span className="text-xs text-gray-400 whitespace-nowrap ml-4">→ {t.assignee.name}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
