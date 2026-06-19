import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.js'

const navItems = [
  { to: '/cabinet', label: '📊 Дашборд', end: true },
  { to: '/cabinet/invoices', label: '🧾 Счета и подписки' },
  { to: '/cabinet/tickets', label: '🎫 Мои тикеты' },
]

export default function ClientLayout() {
  const { user, logout } = useAuthStore()
  const nav = useNavigate()

  const handleLogout = async () => {
    await logout()
    nav('/')
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100">
          <span className="font-bold text-brand-600">inzhenerim.ru</span>
          <p className="text-xs text-gray-400 mt-1">Личный кабинет</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="btn-secondary w-full justify-center text-sm">
            Выйти
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
