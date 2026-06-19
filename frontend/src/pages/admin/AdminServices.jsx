import { useEffect, useState } from 'react'
import api from '../../lib/api.js'

const EMPTY_FORM = { name: '', description: '', price: '', period: '' }

export default function AdminServices() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [editing, setEditing] = useState(null)

  const load = async () => {
    setLoading(true)
    const { data } = await api.get('/services')
    setServices(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/services', { ...form, price: Number(form.price), period: form.period || undefined })
      setShowForm(false)
      setForm(EMPTY_FORM)
      load()
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (id, data) => {
    await api.patch(`/services/${id}`, data)
    setEditing(null)
    load()
  }

  const toggleActive = async (s) => {
    await api.patch(`/services/${s.id}`, { isActive: !s.isActive })
    load()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Услуги</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">+ Добавить услугу</button>
      </div>

      {showForm && (
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Новая услуга</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Название</label>
                <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Администрирование серверов" />
              </div>
              <div>
                <label className="label">Цена (₽)</label>
                <input required type="number" min="0" step="0.01" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="5000" />
              </div>
              <div>
                <label className="label">Период</label>
                <select className="input" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}>
                  <option value="">Без периода (разовая)</option>
                  <option value="monthly">Ежемесячно</option>
                  <option value="yearly">Ежегодно</option>
                  <option value="one-time">Единоразово</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Описание</label>
              <textarea rows={2} className="input resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Краткое описание услуги..." />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Сохранение...' : 'Создать'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Отмена</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-center py-12">Загрузка...</p>
      ) : services.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <p className="text-lg mb-1">Услуг нет</p>
          <p className="text-sm">Добавьте услуги, чтобы включать их в счета клиентам.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((s) => (
            <div key={s.id} className={`card p-5 ${!s.isActive ? 'opacity-60' : ''}`}>
              {editing === s.id ? (
                <ServiceEditForm service={s} onSave={(data) => handleUpdate(s.id, data)} onCancel={() => setEditing(null)} />
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900">{s.name}</p>
                      {!s.isActive && <span className="badge bg-gray-100 text-gray-500">Неактивна</span>}
                      {s.period && <span className="badge bg-blue-50 text-blue-700 capitalize">{s.period}</span>}
                    </div>
                    {s.description && <p className="text-sm text-gray-500 mb-1">{s.description}</p>}
                    <p className="text-lg font-bold text-gray-900">{Number(s.price).toLocaleString('ru')} ₽</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button onClick={() => setEditing(s.id)} className="btn-secondary text-xs px-3 py-1.5">Изменить</button>
                    <button onClick={() => toggleActive(s)} className={`text-xs px-3 py-1.5 btn ${s.isActive ? 'btn-secondary' : 'btn-primary'}`}>
                      {s.isActive ? 'Скрыть' : 'Активировать'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ServiceEditForm({ service, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: service.name,
    description: service.description || '',
    price: String(service.price),
    period: service.period || '',
  })

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Название</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Цена (₽)</label>
          <input type="number" min="0" step="0.01" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="label">Описание</label>
        <textarea rows={2} className="input resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSave({ ...form, price: Number(form.price) })} className="btn-primary text-sm">Сохранить</button>
        <button onClick={onCancel} className="btn-secondary text-sm">Отмена</button>
      </div>
    </div>
  )
}
