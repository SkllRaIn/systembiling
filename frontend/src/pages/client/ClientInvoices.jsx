import { useEffect, useState } from 'react'
import api from '../../lib/api.js'

const STATUS_LABEL = { PENDING: 'Ожидает оплаты', PAID: 'Оплачен', CANCELLED: 'Отменён', REFUNDED: 'Возврат' }
const STATUS_COLOR = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
  REFUNDED: 'bg-blue-100 text-blue-800',
}

export default function ClientInvoices() {
  const [invoices, setInvoices] = useState([])
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [inv, sub] = await Promise.allSettled([
        api.get('/invoices'),
        api.get('/invoices/subscriptions/my'),
      ])
      setInvoices(inv.value?.data?.invoices || [])
      setSubs(sub.value?.data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="p-8 text-gray-400">Загрузка...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Счета и подписки</h1>

      {subs.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-gray-700 mb-3">Активные подписки</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {subs.map((s) => (
              <div key={s.id} className="card p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{s.service?.name}</p>
                  <p className="text-sm text-gray-400">{s.service?.period}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{Number(s.service?.price).toLocaleString('ru')} ₽</p>
                  <span className={`badge ${s.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {s.status === 'active' ? 'Активна' : 'Приостановлена'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="font-semibold text-gray-700 mb-3">История счетов</h2>
      {invoices.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">Счетов пока нет.</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Номер</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Дата</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Сумма</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Статус</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Срок оплаты</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-700">{inv.number}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(inv.createdAt).toLocaleDateString('ru')}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{Number(inv.totalAmount).toLocaleString('ru')} ₽</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${STATUS_COLOR[inv.status]}`}>{STATUS_LABEL[inv.status]}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('ru') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
