import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../lib/api.js'

const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'WAITING', 'CLOSED']
const STATUS_LABEL = { OPEN: 'Открыт', IN_PROGRESS: 'В работе', WAITING: 'Ожидание', CLOSED: 'Закрыт' }
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const PRIORITY_LABEL = { LOW: 'Низкий', MEDIUM: 'Средний', HIGH: 'Высокий', CRITICAL: 'Критичный' }
const STATUS_COLOR = {
  OPEN: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  WAITING: 'bg-purple-100 text-purple-800',
  CLOSED: 'bg-gray-100 text-gray-600',
}

export default function TicketDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const [t, s] = await Promise.all([
      api.get(`/tickets/${id}`),
      api.get('/users/staff'),
    ])
    setTicket(t.data)
    setStaff(s.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const patch = async (data) => {
    const { data: updated } = await api.patch(`/tickets/${id}`, data)
    setTicket(updated)
  }

  const sendComment = async () => {
    if (!comment.trim()) return
    setSaving(true)
    try {
      await api.post(`/tickets/${id}/comments`, { text: comment, isInternal })
      setComment('')
      load()
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="p-8 text-gray-400">Загрузка...</p>
  if (!ticket) return <p className="p-8 text-red-500">Тикет не найден</p>

  return (
    <div className="p-8 max-w-4xl">
      <button onClick={() => nav('/staff/tickets')} className="text-sm text-gray-400 hover:text-gray-700 mb-4">
        ← Назад к очереди
      </button>

      <div className="flex items-start gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-mono text-gray-400">#{ticket.number}</span>
            <span className={`badge ${STATUS_COLOR[ticket.status]}`}>{STATUS_LABEL[ticket.status]}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
          <p className="text-sm text-gray-400 mt-1">
            От: <span className="text-gray-700">{ticket.creator?.name}</span> · {new Date(ticket.createdAt).toLocaleString('ru')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Description */}
        <div className="md:col-span-2">
          <div className="card p-5 mb-4">
            <h2 className="font-semibold text-gray-900 mb-3">Описание</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {/* Comments */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Комментарии ({ticket.comments?.length || 0})</h2>
            <div className="space-y-3 mb-4">
              {ticket.comments?.map((c) => (
                <div key={c.id} className={`p-3 rounded-lg ${c.isInternal ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{c.author?.name}</span>
                    <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString('ru')}</span>
                    {c.isInternal && <span className="badge bg-yellow-100 text-yellow-800">Внутренний</span>}
                  </div>
                  <p className="text-sm text-gray-700">{c.text}</p>
                </div>
              ))}
            </div>
            <textarea
              rows={3}
              className="input resize-none mb-2"
              placeholder="Написать комментарий..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} />
                Внутренний (только для сотрудников)
              </label>
              <button onClick={sendComment} disabled={saving || !comment.trim()} className="btn-primary">
                {saving ? 'Отправка...' : 'Отправить'}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar controls */}
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Статус</h3>
            <select
              className="input"
              value={ticket.status}
              onChange={(e) => patch({ status: e.target.value })}
            >
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>

          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Приоритет</h3>
            <select
              className="input"
              value={ticket.priority}
              onChange={(e) => patch({ priority: e.target.value })}
            >
              {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
            </select>
          </div>

          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Назначен</h3>
            <select
              className="input"
              value={ticket.assigneeId || ''}
              onChange={(e) => patch({ assigneeId: e.target.value || null })}
            >
              <option value="">— Не назначен</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {ticket.attachments?.length > 0 && (
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Вложения</h3>
              <div className="space-y-2">
                {ticket.attachments.map((a) => (
                  <a
                    key={a.id}
                    href={`/uploads/${a.path}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-brand-600 hover:underline"
                  >
                    📎 {a.filename}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
