import { Link } from 'react-router-dom'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">И</span>
            </div>
            <span className="font-bold text-xl text-gray-900">inzhenerim<span className="text-brand-500">.ru</span></span>
          </Link>
          <Link to="/" className="text-sm text-gray-500 hover:text-brand-600 transition-colors">← На главную</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Политика обработки персональных данных</h1>
          <p className="text-gray-500 mb-8">Последнее обновление: {new Date().toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">1. Общие положения</h2>
              <p>
                Настоящая Политика обработки персональных данных (далее — Политика) описывает порядок сбора, хранения,
                использования и защиты персональных данных пользователей сервиса <strong>inzhenerim.ru</strong>
                (далее — Оператор).
              </p>
              <p className="mt-3">
                Оператор обрабатывает персональные данные в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ
                «О персональных данных» и иными нормативными правовыми актами Российской Федерации.
              </p>
              <p className="mt-3">
                Используя сервис inzhenerim.ru, пользователь выражает согласие с настоящей Политикой.
                Если пользователь не согласен с условиями Политики, использование сервиса должно быть прекращено.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. Оператор персональных данных</h2>
              <div className="bg-gray-50 rounded-xl p-5 space-y-1.5 text-sm">
                <p><strong>Наименование:</strong> ИП / ООО «Инженерим» (укажите реквизиты)</p>
                <p><strong>ИНН:</strong> 0000000000</p>
                <p><strong>Адрес:</strong> 160000, Россия, Вологодская обл., г. Вологда, ул. Примерная, д. 1</p>
                <p><strong>Email:</strong> <a href="mailto:privacy@inzhenerim.ru" className="text-brand-600 hover:underline">privacy@inzhenerim.ru</a></p>
                <p><strong>Телефон:</strong> +7 (8172) 00-00-00</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. Состав обрабатываемых персональных данных</h2>
              <p>Оператор обрабатывает следующие персональные данные:</p>
              <ul className="list-disc list-inside mt-3 space-y-1.5 text-sm">
                <li>Фамилия, имя, отчество</li>
                <li>Адрес электронной почты (email)</li>
                <li>Номер телефона</li>
                <li>IP-адрес, данные об устройстве и браузере (файлы cookie)</li>
                <li>Сведения, добавленные пользователем при создании заявок и в переписке</li>
                <li>Данные о платёжных операциях (без хранения реквизитов карт — передаются напрямую платёжным провайдерам)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. Цели обработки персональных данных</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-200 px-4 py-2.5 text-left font-semibold">Цель</th>
                      <th className="border border-gray-200 px-4 py-2.5 text-left font-semibold">Правовое основание</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Регистрация и аутентификация пользователя', 'Договор (ст. 6 п. 5 152-ФЗ)'],
                      ['Исполнение договора на оказание IT-услуг', 'Договор'],
                      ['Направление уведомлений по заявкам', 'Согласие пользователя'],
                      ['Восстановление доступа к аккаунту', 'Согласие пользователя'],
                      ['Выставление счетов и учёт платежей', 'Законодательство РФ (НК РФ)'],
                      ['Улучшение качества сервиса (аналитика)', 'Согласие пользователя'],
                    ].map(([goal, basis]) => (
                      <tr key={goal} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-4 py-2.5">{goal}</td>
                        <td className="border border-gray-200 px-4 py-2.5 text-gray-500">{basis}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">5. Порядок и сроки хранения</h2>
              <p>
                Персональные данные хранятся на серверах, расположенных на территории Российской Федерации,
                в защищённых базах данных.
              </p>
              <ul className="list-disc list-inside mt-3 space-y-1.5 text-sm">
                <li>Данные аккаунта — до удаления аккаунта пользователем плюс 30 дней</li>
                <li>Данные о платёжных операциях — 5 лет в соответствии с законодательством о бухгалтерском учёте</li>
                <li>Токены восстановления пароля — 1 час с момента создания</li>
                <li>Токены подтверждения email — 24 часа с момента создания</li>
                <li>Журналы активности — 90 дней</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">6. Передача персональных данных третьим лицам</h2>
              <p>
                Оператор не передаёт персональные данные третьим лицам без согласия пользователя,
                за исключением случаев, предусмотренных законодательством РФ, и следующих случаев:
              </p>
              <ul className="list-disc list-inside mt-3 space-y-1.5 text-sm">
                <li>Платёжным провайдерам (ЮКасса, Робокасса) для обработки платежей</li>
                <li>Почтовым сервисам для отправки уведомлений (только email-адрес)</li>
                <li>Уполномоченным государственным органам по запросу в установленном законом порядке</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">7. Права субъекта персональных данных</h2>
              <p>Пользователь вправе:</p>
              <ul className="list-disc list-inside mt-3 space-y-1.5 text-sm">
                <li>Получить информацию об обработке своих персональных данных</li>
                <li>Потребовать уточнения, блокирования или уничтожения персональных данных</li>
                <li>Отозвать согласие на обработку персональных данных</li>
                <li>Обжаловать действия или бездействие Оператора в Роскомнадзор</li>
              </ul>
              <p className="mt-3">
                Для реализации своих прав направьте письменный запрос на{' '}
                <a href="mailto:privacy@inzhenerim.ru" className="text-brand-600 hover:underline">privacy@inzhenerim.ru</a>.
                Запрос будет рассмотрен в течение 30 дней.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">8. Меры защиты персональных данных</h2>
              <ul className="list-disc list-inside space-y-1.5 text-sm">
                <li>Пароли хранятся в виде хэшей (bcrypt)</li>
                <li>Соединение защищено протоколом HTTPS/TLS</li>
                <li>Доступ к данным ограничен по ролям (RBAC)</li>
                <li>Регулярное резервное копирование базы данных</li>
                <li>Мониторинг и аудит действий персонала</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">9. Файлы cookie</h2>
              <p>
                Сервис использует файлы cookie для обеспечения функциональности (аутентификация, настройки)
                и аналитики. Пользователь может отключить cookie в настройках браузера, однако это может
                повлиять на работу отдельных функций сервиса.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">10. Изменения Политики</h2>
              <p>
                Оператор вправе вносить изменения в настоящую Политику. При существенных изменениях
                пользователи будут уведомлены по email. Дата последнего обновления указана в начале документа.
                Продолжение использования сервиса после изменений означает согласие с обновлённой Политикой.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">11. Контакты</h2>
              <p>
                По вопросам обработки персональных данных обращайтесь по адресу:{' '}
                <a href="mailto:privacy@inzhenerim.ru" className="text-brand-600 hover:underline">privacy@inzhenerim.ru</a>
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white py-8 mt-8">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} inzhenerim.ru ·{' '}
          <Link to="/" className="hover:text-brand-600">На главную</Link>
        </div>
      </footer>
    </div>
  )
}
