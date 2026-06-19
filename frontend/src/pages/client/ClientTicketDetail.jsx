import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../lib/api.js'

const STATUS_LABEL = { OPEN: 'Открыт', IN_PROGRESS: 'В работе', WAITING: 'Ожидание', CLOSED: 'Закрыт' }
const STATUS_COLOR = {
  OPEN: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  WAITING: 'bg-purple-100 text-purple-800',
  CLOSED: 'bg-gray-100 text-gray-600',
}

export default function ClientTicketDetail() {
  const { id } = useParams()
  const [ticket, setTicket] = useState(null)
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)

  const load = async () => {
    const { data } = await api.get(`/tickets/${id}`)
    setTicket(data)
  }
  useEffect(() => { load() }, [id])

  const sendComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    setSending(true)
    try {
      await api.post(`/tickets/${id}/comments`, { text: comment })
      setComment('')
      load()
    } finally {
      setSending(false)
    }
  }

  if (!ticket) return <div className="p-8 text-gray-400">Загрузка...</div>

  return (
    <div className="p-8 max-w-3xl">
      <Link to="/cabinet/tickets" className="text-sm text-brand-600 hover:underline mb-4 block">← Все тикеты</Link>

      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-mono text-gray-400">#{ticket.number}</span>
              <span className={`badge ${STATUS_COLOR[ticket.status]}`}>{STATUS_LABEL[ticket.status]}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{ticket.title}</h1>
          </div>
        </div>
        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
        {ticket.assignee && (
          <p className="text-sm text-gray-400 mt-4">Назначен: <span className="text-gray-700">{ticket.assignee.name}</span></p>
        )}
        <p className="text-xs text-gray-400 mt-2">Создан {new Date(ticket.createdAt).toLocaleString('ru')}</p>
      </div>

      <h2 className="font-semibold text-gray-900 mb-3">Комментарии ({ticket.comments?.filter(c => !c.isInternal).length || 0})</h2>
      <div className="space-y-3 mb-6">
        {ticket.comments?.filter(c => !c.isInternal).map((c) => (
          <div key={c.id} className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-sm text-gray-900">{c.author.name}</span>
              {['SYSADMIN', 'ADMIN'].includes(c.author.role) && (
                <span className="badge bg-brand-50 text-brand-700">Сисадмин</span>
              )}
              <span className="text-xs text-gray-400 ml-auto">{new Date(c.createdAt).toLocaleString('ru')}</span>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{c.text}</p>
          </div>
        ))}
      </div>

      {ticket.status !== 'CLOSED' && (
        <form onSubmit={sendComment} className="card p-4">
          <textarea
            rows={3}
            className="input resize-none mb-3"
            placeholder="Напишите комментарий..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button type="submit" disabled={sending} className="btn-primary">
            {sending ? 'Отправка...' : 'Отправить'}
          </button>
        </form>
      )}
    </div>
  )
}
