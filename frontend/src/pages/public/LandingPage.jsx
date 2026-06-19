import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.js'
import { useState } from 'react'

const SERVICES = [
  {
    icon: '🖥️',
    title: 'Системное администрирование',
    desc: 'Обслуживание серверов Linux/Windows, настройка сервисов, мониторинг и резервное копирование.',
    price: 'от 3 000 ₽/мес',
    badge: 'Популярное',
  },
  {
    icon: '🌐',
    title: 'Сетевая инфраструктура',
    desc: 'Проектирование и настройка сетей, MikroTik, VPN, межсетевые экраны.',
    price: 'от 5 000 ₽',
    badge: null,
  },
  {
    icon: '☁️',
    title: 'Виртуализация',
    desc: 'Proxmox VE, настройка кластеров, миграция, резервное копирование VM.',
    price: 'от 8 000 ₽',
    badge: null,
  },
  {
    icon: '📧',
    title: 'Корпоративная почта',
    desc: 'Развёртывание и поддержка почтовых серверов, защита от спама, Roundcube.',
    price: 'от 4 000 ₽',
    badge: null,
  },
  {
    icon: '🔒',
    title: 'Информационная безопасность',
    desc: 'Аудит безопасности, настройка firewall, шифрование, политики доступа.',
    price: 'от 10 000 ₽',
    badge: null,
  },
  {
    icon: '📊',
    title: 'IT-аутсорсинг',
    desc: 'Полное обслуживание IT-инфраструктуры компании под ключ.',
    price: 'от 15 000 ₽/мес',
    badge: 'Выгодно',
  },
]

const STATS = [
  { value: '120+', label: 'Обслуживаемых клиентов' },
  { value: '8 лет', label: 'На рынке IT-услуг' },
  { value: '≤1 час', label: 'Время реакции на заявку' },
  { value: '99.9%', label: 'Uptime наших систем' },
]

const STEPS = [
  { n: '01', title: 'Заявка', text: 'Оставляете заявку или пишете напрямую — отвечаем в течение часа.' },
  { n: '02', title: 'Анализ', text: 'Проводим бесплатную диагностику и предлагаем оптимальное решение.' },
  { n: '03', title: 'Работа', text: 'Выполняем задачу в согласованные сроки с отчётом о результатах.' },
  { n: '04', title: 'Поддержка', text: 'Продолжаем мониторинг и поддержку после завершения работ.' },
]

export default function LandingPage() {
  const { user } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)

  const dashboardLink = () => {
    if (!user) return '/login'
    if (user.role === 'ADS_MANAGER') return '/ads'
    if (['SYSADMIN', 'ADMIN'].includes(user.role)) return '/staff'
    return '/cabinet'
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">И</span>
            </div>
            <span className="font-bold text-xl text-gray-900">inzhenerim<span className="text-brand-500">.ru</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <a href="#services" className="hover:text-brand-600 transition-colors font-medium">Услуги</a>
            <a href="#how" className="hover:text-brand-600 transition-colors font-medium">Как работаем</a>
            <a href="#contact" className="hover:text-brand-600 transition-colors font-medium">Контакты</a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Link to={dashboardLink()} className="btn-primary">Личный кабинет</Link>
            ) : (
              <>
                <Link to="/login" className="btn-secondary hidden sm:inline-flex">Войти</Link>
                <Link to="/register" className="btn-primary">Регистрация</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-brand-700 to-brand-500 text-white">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.3)_0%,_transparent_60%)]" />
        <div className="max-w-6xl mx-auto px-4 py-28 md:py-36 relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full text-sm font-medium mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            IT-аутсорсинг в Вологде — принимаем заявки
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.08] tracking-tight mb-6 max-w-3xl">
            Инфраструктура,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-100">
              которая работает
            </span>
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-xl mb-10 leading-relaxed">
            Системное администрирование, сети, виртуализация и корпоративная почта.
            Решаем задачи любой сложности быстро и надёжно.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="#contact" className="inline-flex items-center justify-center gap-2 bg-white text-brand-600 hover:bg-gray-100 font-semibold px-8 py-3.5 rounded-xl transition-colors text-base">
              Оставить заявку →
            </a>
            <a href="#services" className="inline-flex items-center justify-center gap-2 border border-white/30 text-white hover:bg-white/10 font-medium px-8 py-3.5 rounded-xl transition-colors text-base">
              Смотреть услуги
            </a>
          </div>
        </div>

        {/* Stats bar */}
        <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white">{s.value}</div>
                <div className="text-xs md:text-sm text-white/50 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-14">
            <p className="text-brand-600 font-semibold text-sm uppercase tracking-widest mb-3">Что мы делаем</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-3">Наши услуги</h2>
            <p className="text-gray-500 text-lg max-w-xl">Всё необходимое для бесперебойной работы вашей IT-инфраструктуры.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((s) => (
              <div key={s.title} className="bg-white rounded-2xl border border-gray-200 p-7 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center text-2xl group-hover:bg-brand-100 transition-colors">
                    {s.icon}
                  </div>
                  {s.badge && (
                    <span className="text-xs font-semibold bg-brand-500 text-white px-2.5 py-1 rounded-full">{s.badge}</span>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">{s.title}</h3>
                <p className="text-sm text-gray-500 mb-5 leading-relaxed">{s.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-brand-600 font-bold">{s.price}</span>
                  <a href="#contact" className="text-xs text-gray-400 hover:text-brand-600 transition-colors">Заказать →</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How we work */}
      <section id="how" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-14">
            <p className="text-brand-600 font-semibold text-sm uppercase tracking-widest mb-3">Процесс</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-3">Как мы работаем</h2>
            <p className="text-gray-500 text-lg">Прозрачный процесс от заявки до результата.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.n} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-1/2 w-full h-px bg-gray-200 z-0" />
                )}
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-brand-500 text-white rounded-full flex items-center justify-center font-bold text-sm mb-4">
                    {step.n}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-brand-500 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Готовы разобраться с вашей IT-инфраструктурой?
          </h2>
          <p className="text-white/70 mb-8 text-lg">
            Зарегистрируйтесь, создайте заявку прямо в кабинете и отслеживайте статус в реальном времени.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="inline-flex items-center justify-center bg-white text-brand-600 hover:bg-gray-100 font-semibold px-8 py-3.5 rounded-xl transition-colors">
              Создать аккаунт
            </Link>
            <a href="#contact" className="inline-flex items-center justify-center border border-white/30 text-white hover:bg-white/10 font-medium px-8 py-3.5 rounded-xl transition-colors">
              Написать нам
            </a>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-16 items-start">
          <div>
            <p className="text-brand-600 font-semibold text-sm uppercase tracking-widest mb-3">Контакты</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Оставить заявку</h2>
            <p className="text-gray-500 text-lg mb-8">Ответим в течение часа в рабочее время.</p>
            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-lg">📞</div>
                <div>
                  <div className="font-medium text-gray-900">Телефон</div>
                  <a href="tel:+78172000000" className="hover:text-brand-600">+7 (8172) 00-00-00</a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-lg">✉️</div>
                <div>
                  <div className="font-medium text-gray-900">Email</div>
                  <a href="mailto:info@inzhenerim.ru" className="hover:text-brand-600">info@inzhenerim.ru</a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-lg">📍</div>
                <div>
                  <div className="font-medium text-gray-900">Офис</div>
                  <span>Вологда, ул. Примерная, 1</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-lg">🕐</div>
                <div>
                  <div className="font-medium text-gray-900">Режим работы</div>
                  <span>Пн–Пт 9:00–18:00</span>
                </div>
              </div>
            </div>
          </div>
          <ContactForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-500 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">И</span>
            </div>
            <span className="font-semibold text-gray-600">inzhenerim.ru</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-brand-600 transition-colors">Политика конфиденциальности</Link>
            <Link to="/login" className="hover:text-brand-600 transition-colors">Войти</Link>
            <Link to="/register" className="hover:text-brand-600 transition-colors">Регистрация</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function ContactForm() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const data = Object.fromEntries(new FormData(e.target))
    // TODO: отправка на /api/contact или создание тикета
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)
    setSent(true)
    e.target.reset()
  }

  if (sent) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-10 flex flex-col items-center text-center shadow-sm">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl mb-4">✅</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Заявка принята!</h3>
        <p className="text-gray-500">Ответим в течение часа в рабочее время.</p>
        <button onClick={() => setSent(false)} className="mt-6 text-brand-600 text-sm hover:underline">
          Отправить ещё
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Имя *</label>
          <input name="name" required className="input" placeholder="Иван Петров" />
        </div>
        <div>
          <label className="label">Телефон</label>
          <input name="phone" className="input" placeholder="+7 (900) 000-00-00" />
        </div>
      </div>
      <div>
        <label className="label">Email *</label>
        <input name="email" type="email" required className="input" placeholder="ivan@company.ru" />
      </div>
      <div>
        <label className="label">Услуга</label>
        <select name="service" className="input">
          <option value="">Выберите услугу</option>
          {SERVICES.map(s => <option key={s.title} value={s.title}>{s.title}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Описание задачи *</label>
        <textarea name="message" required rows={4} className="input resize-none" placeholder="Что нужно сделать? Опишите подробнее..." />
      </div>
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" required className="mt-0.5 accent-brand-500" />
        <span className="text-xs text-gray-500">
          Отправляя форму, я принимаю{' '}
          <Link to="/privacy" target="_blank" className="text-brand-600 hover:underline">
            политику обработки персональных данных
          </Link>
        </span>
      </label>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5 text-base">
        {loading ? 'Отправляем...' : 'Отправить заявку'}
      </button>
    </form>
  )
}
