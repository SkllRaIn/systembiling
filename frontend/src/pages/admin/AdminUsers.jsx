import { useEffect, useState } from 'react'
import api from '../../lib/api.js'

const ROLES = ['CLIENT', 'SYSADMIN', 'ADS_MANAGER', 'ADMIN']
const ROLE_LABEL = {
  CLIENT: 'Клиент',
  SYSADMIN: 'Сисадмин',
  ADS_MANAGER: 'Менеджер рекламы',
  ADMIN: 'Администратор',
}
const ROLE_COLOR = {
  CLIENT: 'bg-gray-100 text-gray-700',
  SYSADMIN: 'bg-blue-100 text-blue-800',
  ADS_MANAGER: 'bg-purple-100 text-purple-800',
  ADMIN: 'bg-red-100 text-red-800',
}

const EMPTY_FORM = { name: '', email: '', password: '', phone: '', role: 'CLIENT' }

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterRole, setFilterRole] = useState('')
  const [search, setSearch] = useState('')

  // Create user modal
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState(EMPTY_FORM)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // Edit inline
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  // Reset password modal
  const [resetTarget, setResetTarget] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  // User detail drawer
  const [detailUser, setDetailUser] = useState(null)
  const [userDetail, setUserDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterRole) params.set('role', filterRole)
    if (search) params.set('search', search)
    const { data } = await api.get(`/users?${params}`)
    setUsers(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [filterRole])

  const handleSearch = (e) => {
    e.preventDefault()
    load()
  }

  const saveEdit = async () => {
    if (!editing) return
    setSaving(true)
    try {
      await api.patch(`/users/${editing.id}`, {
        role: editing.role,
        isActive: editing.isActive,
        name: editing.name,
        phone: editing.phone,
      })
      setEditing(null)
      load()
    } finally {
      setSaving(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreateError('')
    setCreating(true)
    try {
      await api.post('/users', createForm)
      setShowCreate(false)
      setCreateForm(EMPTY_FORM)
      load()
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Ошибка создания')
    } finally {
      setCreating(false)
    }
  }

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) return
    setResetting(true)
    try {
      await api.post(`/users/${resetTarget.id}/reset-password`, { password: newPassword })
      setResetDone(true)
    } finally {
      setResetting(false)
    }
  }

  const openDetail = async (u) => {
    setDetailUser(u)
    setDetailLoading(true)
    try {
      const { data } = await api.get(`/users/${u.id}/detail`)
      setUserDetail(data)
    } finally {
      setDetailLoading(false)
    }
  }

  const closeDetail = () => {
    setDetailUser(null)
    setUserDetail(null)
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Пользователи</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          + Создать пользователя
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <input
            className="input flex-1"
            placeholder="Поиск по имени или email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn-secondary px-4">Найти</button>
        </form>
        <select
          className="input w-48"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="">Все роли</option>
          {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
        </select>
      </div>

      {/* Create user modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="font-bold text-lg text-gray-900 mb-4">Новый пользователь</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="label">Имя *</label>
                <input
                  required
                  className="input"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="Иван Петров"
                />
              </div>
              <div>
                <label className="label">Email *</label>
                <input
                  required
                  type="email"
                  className="input"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="ivan@example.com"
                />
              </div>
              <div>
                <label className="label">Пароль *</label>
                <input
                  required
                  type="password"
                  className="input"
                  minLength={6}
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Минимум 6 символов"
                />
              </div>
              <div>
                <label className="label">Телефон</label>
                <input
                  type="tel"
                  className="input"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  placeholder="+7 999 000 00 00"
                />
              </div>
              <div>
                <label className="label">Роль</label>
                <select
                  className="input"
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                >
                  {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                </select>
              </div>
              {createError && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{createError}</p>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={creating} className="btn-primary flex-1">
                  {creating ? 'Создание...' : 'Создать'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setCreateError('') }}
                  className="btn-secondary flex-1"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="font-bold text-lg text-gray-900 mb-1">Сброс пароля</h2>
            <p className="text-sm text-gray-500 mb-4">{resetTarget.name} ({resetTarget.email})</p>
            {resetDone ? (
              <div className="text-center py-4">
                <p className="text-green-600 font-medium mb-4">✅ Пароль успешно изменён</p>
                <button
                  onClick={() => { setResetTarget(null); setNewPassword(''); setResetDone(false) }}
                  className="btn-primary w-full"
                >
                  Закрыть
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="label">Новый пароль</label>
                  <input
                    type="password"
                    className="input"
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Минимум 6 символов"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleResetPassword}
                    disabled={resetting || newPassword.length < 6}
                    className="btn-primary flex-1"
                  >
                    {resetting ? 'Сохранение...' : 'Сменить пароль'}
                  </button>
                  <button
                    onClick={() => { setResetTarget(null); setNewPassword('') }}
                    className="btn-secondary flex-1"
                  >
                    Отмена
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* User detail drawer */}
      {detailUser && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg text-gray-900">{detailUser.name}</h2>
                <p className="text-sm text-gray-400">{detailUser.email}</p>
              </div>
              <button onClick={closeDetail} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <div className="p-6">
              {detailLoading ? (
                <p className="text-gray-400 text-center py-8">Загрузка...</p>
              ) : userDetail ? (
                <div className="space-y-6">
                  {/* Info */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Роль</p>
                      <span className={`badge ${ROLE_COLOR[detailUser.role]}`}>{ROLE_LABEL[detailUser.role]}</span>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Телефон</p>
                      <p className="text-gray-900">{detailUser.phone || '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Статус</p>
                      <span className={`badge ${detailUser.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {detailUser.isActive ? 'Активен' : 'Заблокирован'}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Зарегистрирован</p>
                      <p className="text-gray-900">{new Date(detailUser.createdAt).toLocaleDateString('ru')}</p>
                    </div>
                  </div>

                  {/* Invoices */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                      Счета ({userDetail.invoices?.length || 0})
                    </h3>
                    {userDetail.invoices?.length === 0 ? (
                      <p className="text-xs text-gray-400">Нет счетов</p>
                    ) : (
                      <div className="space-y-1">
                        {userDetail.invoices.map((inv) => (
                          <div key={inv.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                            <span className="font-mono text-xs text-gray-500">{inv.number}</span>
                            <span className="font-medium">{Number(inv.totalAmount).toLocaleString('ru')} ₽</span>
                            <span className={`badge text-xs ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {inv.status === 'PAID' ? 'Оплачен' : 'К оплате'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tickets */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                      Тикеты ({userDetail.tickets?.length || 0})
                    </h3>
                    {userDetail.tickets?.length === 0 ? (
                      <p className="text-xs text-gray-400">Нет тикетов</p>
                    ) : (
                      <div className="space-y-1">
                        {userDetail.tickets.map((t) => (
                          <div key={t.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                            <span className="text-gray-500 font-mono text-xs">#{t.number}</span>
                            <span className="flex-1 px-2 truncate">{t.title}</span>
                            <span className={`badge text-xs ${
                              t.status === 'OPEN' ? 'bg-blue-100 text-blue-700' :
                              t.status === 'CLOSED' ? 'bg-gray-100 text-gray-600' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>{t.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Subscriptions */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                      Подписки ({userDetail.subscriptions?.length || 0})
                    </h3>
                    {userDetail.subscriptions?.length === 0 ? (
                      <p className="text-xs text-gray-400">Нет подписок</p>
                    ) : (
                      <div className="space-y-1">
                        {userDetail.subscriptions.map((s) => (
                          <div key={s.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                            <span>{s.service?.name}</span>
                            <span className={`badge text-xs ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                              {s.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-gray-400 text-center py-12">Загрузка...</p>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Пользователь</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Роль</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Статус</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Дата</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <button
                      onClick={() => openDetail(u)}
                      className="text-left hover:underline"
                    >
                      <p className="font-medium text-gray-900">{u.name}</p>
                      <p className="text-gray-400 text-xs">{u.email}</p>
                      {u.phone && <p className="text-gray-400 text-xs">{u.phone}</p>}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    {editing?.id === u.id ? (
                      <select
                        className="input w-auto text-xs"
                        value={editing.role}
                        onChange={(e) => setEditing({ ...editing, role: e.target.value })}
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                      </select>
                    ) : (
                      <span className={`badge ${ROLE_COLOR[u.role]}`}>{ROLE_LABEL[u.role]}</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {editing?.id === u.id ? (
                      <select
                        className="input w-auto text-xs"
                        value={editing.isActive ? 'active' : 'blocked'}
                        onChange={(e) => setEditing({ ...editing, isActive: e.target.value === 'active' })}
                      >
                        <option value="active">Активен</option>
                        <option value="blocked">Заблокирован</option>
                      </select>
                    ) : (
                      <span className={`badge ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {u.isActive ? 'Активен' : 'Заблокирован'}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {new Date(u.createdAt).toLocaleDateString('ru')}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {editing?.id === u.id ? (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={saveEdit}
                          disabled={saving}
                          className="btn-primary text-xs px-3 py-1.5"
                        >
                          {saving ? '...' : 'Сохранить'}
                        </button>
                        <button
                          onClick={() => setEditing(null)}
                          className="btn-secondary text-xs px-3 py-1.5"
                        >
                          Отмена
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditing({ id: u.id, role: u.role, isActive: u.isActive, name: u.name, phone: u.phone })}
                          className="btn-secondary text-xs px-3 py-1.5"
                        >
                          Изменить
                        </button>
                        <button
                          onClick={() => { setResetTarget(u); setNewPassword(''); setResetDone(false) }}
                          className="text-xs px-3 py-1.5 rounded-lg border border-orange-200 text-orange-600 hover:bg-orange-50 transition-colors"
                        >
                          Пароль
                        </button>
                        <button
                          onClick={() => openDetail(u)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          Детали
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <p className="text-center text-gray-400 py-8 text-sm">Пользователей не найдено</p>
          )}
        </div>
      )}
    </div>
  )
}
