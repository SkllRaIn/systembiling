import { useEffect, useState } from 'react'
import api from '../../lib/api.js'

const STATUS_COLOR = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ACTIVE: 'bg-green-100 text-green-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  FINISHED: 'bg-blue-100 text-blue-800',
}
const STATUS_LABEL = { DRAFT: 'Черновик', ACTIVE: 'Активна', PAUSED: 'Пауза', FINISHED: 'Завершена' }

const EMPTY_FORM = { name: '', budget: '', description: '', startDate: '', endDate: '' }

export default function AdsCampaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    const [camps, acc] = await Promise.all([
      api.get('/ads/campaigns'),
      api.get('/ads/account'),
    ])
    setCampaigns(camps.data)
    setAccount(acc.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await api.post('/ads/campaigns', {
        ...form,
        budget: Number(form.budget),
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      })
      setShowForm(false)
      setForm(EMPTY_FORM)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка создания')
    } finally {
      setSubmitting(false)
    }
  }

  const updateStatus = async (id, status) => {
    await api.patch(`/ads/campaigns/${id}`, { status })
    load()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Кампании</h1>
          {account && (
            <p className="text-sm text-gray-400 mt-0.5">
              Баланс: <span className="text-green-600 font-medium">{Number(account.balance).toLocaleString('ru')} ₽</span>
            </p>
          )}
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">+ Новая кампания</button>
      </div>

      {showForm && (
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Создать кампанию</h2>
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Название кампании</label>
                <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Летняя акция" />
              </div>
              <div>
                <label className="label">Бюджет (₽)</label>
                <input required type="number" min="1" className="input" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="10000" />
              </div>
              <div>
                <label className="label">Дата начала</label>
                <input type="date" className="input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div>
                <label className="label">Дата окончания</label>
                <input type="date" className="input" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Описание</label>
              <textarea rows={2} className="input resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Краткое описание..." />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Создание...' : 'Создать'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Отмена</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-center py-12">Загрузка...</p>
      ) : campaigns.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <p className="text-lg mb-1">Кампаний нет</p>
          <p className="text-sm">Создайте первую рекламную кампанию.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div key={c.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900">{c.name}</p>
                    <span className={`badge ${STATUS_COLOR[c.status]}`}>{STATUS_LABEL[c.status]}</span>
                  </div>
                  {c.description && <p className="text-sm text-gray-500 mb-2">{c.description}</p>}
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>Бюджет: <span className="font-medium text-gray-700">{Number(c.budget).toLocaleString('ru')} ₽</span></span>
                    <span>Потрачено: <span className="font-medium text-gray-700">{Number(c.spent).toLocaleString('ru')} ₽</span></span>
                    {c.startDate && <span>Старт: {new Date(c.startDate).toLocaleDateString('ru')}</span>}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  {c.status === 'DRAFT' && (
                    <button onClick={() => updateStatus(c.id, 'ACTIVE')} className="btn-primary text-xs px-3 py-1.5">Запустить</button>
                  )}
                  {c.status === 'ACTIVE' && (
                    <button onClick={() => updateStatus(c.id, 'PAUSED')} className="btn-secondary text-xs px-3 py-1.5">Пауза</button>
                  )}
                  {c.status === 'PAUSED' && (
                    <button onClick={() => updateStatus(c.id, 'ACTIVE')} className="btn-primary text-xs px-3 py-1.5">Возобновить</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
