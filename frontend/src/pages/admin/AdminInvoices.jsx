import { useEffect, useState } from 'react'
import api from '../../lib/api.js'

const STATUS_COLOR = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
  REFUNDED: 'bg-red-100 text-red-800',
}
const STATUS_LABEL = { PENDING: 'К оплате', PAID: 'Оплачен', CANCELLED: 'Отменён', REFUNDED: 'Возврат' }

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ userId: '', dueDate: '', notes: '', items: [{ name: '', qty: 1, price: '' }] })
  const [submitting, setSubmitting] = useState(false)
  const [marking, setMarking] = useState(null)

  const load = async () => {
    setLoading(true)
    const { data } = await api.get(`/invoices${filterStatus ? `?status=${filterStatus}` : ''}`)
    setInvoices(data.invoices)
    setLoading(false)
  }

  useEffect(() => { load() }, [filterStatus])

  const openForm = async () => {
    if (users.length === 0) {
      const { data } = await api.get('/users?role=CLIENT&limit=100')
      setUsers(data)
    }
    setShowForm(true)
  }

  const addItem = () => setForm({ ...form, items: [...form.items, { name: '', qty: 1, price: '' }] })
  const updateItem = (i, field, val) => {
    const items = [...form.items]
    items[i] = { ...items[i], [field]: val }
    setForm({ ...form, items })
  }
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) })

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/invoices', {
        userId: form.userId,
        dueDate: form.dueDate || undefined,
        notes: form.notes || undefined,
        items: form.items.map((it) => ({ name: it.name, qty: Number(it.qty), price: Number(it.price) })),
      })
      setShowForm(false)
      setForm({ userId: '', dueDate: '', notes: '', items: [{ name: '', qty: 1, price: '' }] })
      load()
    } finally {
      setSubmitting(false)
    }
  }

  const markPaid = async (id) => {
    setMarking(id)
    try {
      await api.post(`/invoices/${id}/mark-paid`)
      load()
    } finally {
      setMarking(null)
    }
  }

  const total = (items) => items?.reduce((s, i) => s + Number(i.price) * i.qty, 0) || 0

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Счета</h1>
        <div className="flex gap-3">
          <select className="input w-auto" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Все статусы</option>
            {Object.keys(STATUS_LABEL).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
          <button onClick={openForm} className="btn-primary">+ Создать счёт</button>
        </div>
      </div>

      {showForm && (
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Новый счёт</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Клиент</label>
                <select required className="input" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
                  <option value="">Выберите клиента</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Срок оплаты</label>
                <input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Позиции</label>
              <div className="space-y-2">
                {form.items.map((item, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input required placeholder="Название" className="input flex-1" value={item.name} onChange={(e) => updateItem(i, 'name', e.target.value)} />
                    <input required type="number" min="1" placeholder="Кол-во" className="input w-20" value={item.qty} onChange={(e) => updateItem(i, 'qty', e.target.value)} />
                    <input required type="number" min="0" placeholder="Цена ₽" className="input w-28" value={item.price} onChange={(e) => updateItem(i, 'price', e.target.value)} />
                    {form.items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 px-2">✕</button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={addItem} className="text-sm text-brand-600 hover:underline mt-2">+ Добавить позицию</button>
            </div>
            <div>
              <label className="label">Примечание</label>
              <textarea rows={2} className="input resize-none" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <p className="text-sm text-gray-600">
              Итого: <span className="font-semibold">{total(form.items).toLocaleString('ru')} ₽</span>
            </p>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Создание...' : 'Создать'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Отмена</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-center py-12">Загрузка...</p>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Номер</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Клиент</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Сумма</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Статус</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Дата</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono text-xs text-gray-600">{inv.number}</td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{inv.user?.name}</p>
                    <p className="text-xs text-gray-400">{inv.user?.email}</p>
                  </td>
                  <td className="px-5 py-3 font-semibold text-gray-900">{Number(inv.totalAmount).toLocaleString('ru')} ₽</td>
                  <td className="px-5 py-3">
                    <span className={`badge ${STATUS_COLOR[inv.status]}`}>{STATUS_LABEL[inv.status]}</span>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{new Date(inv.createdAt).toLocaleDateString('ru')}</td>
                  <td className="px-5 py-3 text-right">
                    {inv.status === 'PENDING' && (
                      <button
                        onClick={() => markPaid(inv.id)}
                        disabled={marking === inv.id}
                        className="btn-primary text-xs px-3 py-1.5"
                      >
                        {marking === inv.id ? '...' : 'Отметить оплаченным'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {invoices.length === 0 && (
            <p className="text-center text-gray-400 py-8 text-sm">Счетов не найдено</p>
          )}
        </div>
      )}
    </div>
  )
}
