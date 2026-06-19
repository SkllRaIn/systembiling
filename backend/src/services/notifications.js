import nodemailer from 'nodemailer'
import TelegramBot from 'node-telegram-bot-api'

// ─── Transporter ──────────────────────────────────────────────

let transporter = null

const getTransporter = () => {
  if (transporter) return transporter
  if (!process.env.SMTP_HOST) return null

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: false }, // для самоподписанных сертификатов
  })

  return transporter
}

// ─── Telegram ─────────────────────────────────────────────────

let bot = null
if (process.env.TELEGRAM_BOT_TOKEN) {
  bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false })
}

// ─── Base template ────────────────────────────────────────────

const baseHtml = (title, body) => `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 24px; }
    .container { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
    .header { background: #0f172a; padding: 24px 32px; }
    .header span { color: #60a5fa; font-weight: 700; font-size: 18px; letter-spacing: -0.5px; }
    .header p { color: #94a3b8; font-size: 13px; margin: 4px 0 0; }
    .body { padding: 32px; color: #374151; font-size: 15px; line-height: 1.6; }
    .body h2 { font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 16px; }
    .info-box { background: #f8fafc; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 3px solid #60a5fa; }
    .info-box p { margin: 4px 0; font-size: 14px; }
    .info-box strong { color: #111827; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 500; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-yellow { background: #fef9c3; color: #854d0e; }
    .badge-blue { background: #dbeafe; color: #1e40af; }
    .footer { padding: 20px 32px; border-top: 1px solid #f0f0f0; text-align: center; color: #9ca3af; font-size: 12px; }
    a.btn { display: inline-block; margin-top: 16px; padding: 10px 24px; background: #2563eb; color: #fff !important; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span>inzhenerim.ru</span>
      <p>${title}</p>
    </div>
    <div class="body">
      ${body}
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} inzhenerim.ru · Это письмо отправлено автоматически
    </div>
  </div>
</body>
</html>
`

// ─── Low-level send ────────────────────────────────────────────

export const sendEmail = async ({ to, subject, html }) => {
  const t = getTransporter()
  if (!t) {
    console.warn('[mail] SMTP не настроен, письмо не отправлено:', subject)
    return
  }
  try {
    await t.sendMail({
      from: `"inzhenerim.ru" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    })
    console.info(`[mail] Отправлено: ${subject} → ${to}`)
  } catch (err) {
    console.error('[mail] Ошибка отправки:', err.message)
  }
}

export const sendTelegram = async (chatId, text) => {
  if (!bot || !chatId) return
  try {
    await bot.sendMessage(chatId, text, { parse_mode: 'HTML' })
  } catch (err) {
    console.error('[telegram] Ошибка:', err.message)
  }
}

// ─── Welcome email (создание пользователя админом) ────────────

export const sendWelcomeEmail = async ({ email, name, password }) => {
  const siteUrl = process.env.CLIENT_URL || 'https://inzhenerim.ru'
  await sendEmail({
    to: email,
    subject: 'Добро пожаловать в inzhenerim.ru — данные для входа',
    html: baseHtml(
      'Добро пожаловать!',
      `
      <h2>Здравствуйте, ${name}!</h2>
      <p>Для вас создана учётная запись на платформе <strong>inzhenerim.ru</strong>.</p>
      <div class="info-box">
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Пароль:</strong> ${password}</p>
      </div>
      <p>Рекомендуем сменить пароль после первого входа.</p>
      <a href="${siteUrl}/login" class="btn">Войти в кабинет</a>
      `
    ),
  })
}

// ─── Ticket created ───────────────────────────────────────────

export const notifyTicketCreated = async (ticket, creator) => {
  const subject = `Новый тикет #${ticket.number}: ${ticket.title}`

  // Уведомить команду
  await sendEmail({
    to: process.env.SMTP_USER,
    subject,
    html: baseHtml(
      'Новый тикет',
      `
      <h2>Тикет #${ticket.number}</h2>
      <div class="info-box">
        <p><strong>Клиент:</strong> ${creator.name} (${creator.email})</p>
        <p><strong>Тема:</strong> ${ticket.title}</p>
        <p><strong>Приоритет:</strong> ${ticket.priority}</p>
      </div>
      <p>${ticket.description}</p>
      `
    ),
  })

  // Уведомить клиента
  await sendEmail({
    to: creator.email,
    subject: `Тикет #${ticket.number} принят`,
    html: baseHtml(
      'Тикет создан',
      `
      <h2>Здравствуйте, ${creator.name}!</h2>
      <p>Ваш тикет принят и будет обработан в ближайшее время.</p>
      <div class="info-box">
        <p><strong>Тема:</strong> ${ticket.title}</p>
        <p><strong>Номер:</strong> #${ticket.number}</p>
        <p><strong>Приоритет:</strong> ${ticket.priority}</p>
      </div>
      `
    ),
  })

  if (creator.telegramId) {
    await sendTelegram(
      creator.telegramId,
      `✅ Тикет <b>#${ticket.number}</b> создан. Ожидайте ответа.`
    )
  }
}

// ─── Ticket updated ───────────────────────────────────────────

export const notifyTicketUpdated = async (ticket, user) => {
  if (!user?.email) return

  const statusRu = {
    OPEN: 'Открыт',
    IN_PROGRESS: 'В работе',
    WAITING: 'Ожидание',
    CLOSED: 'Закрыт',
  }

  await sendEmail({
    to: user.email,
    subject: `Тикет #${ticket.number} обновлён`,
    html: baseHtml(
      'Обновление тикета',
      `
      <h2>Здравствуйте, ${user.name}!</h2>
      <p>Статус вашего тикета изменился.</p>
      <div class="info-box">
        <p><strong>Тикет:</strong> #${ticket.number} — ${ticket.title}</p>
        <p><strong>Новый статус:</strong> <span class="badge badge-blue">${statusRu[ticket.status] || ticket.status}</span></p>
      </div>
      `
    ),
  })

  if (user.telegramId) {
    await sendTelegram(
      user.telegramId,
      `🔄 Тикет <b>#${ticket.number}</b> → статус: <b>${statusRu[ticket.status] || ticket.status}</b>`
    )
  }
}

// ─── Invoice created ──────────────────────────────────────────

export const notifyInvoiceCreated = async (invoice, user) => {
  if (!user?.email) return

  const siteUrl = process.env.CLIENT_URL || 'https://inzhenerim.ru'

  await sendEmail({
    to: user.email,
    subject: `Счёт ${invoice.number} на оплату`,
    html: baseHtml(
      'Новый счёт',
      `
      <h2>Здравствуйте, ${user.name}!</h2>
      <p>Для вас выставлен счёт.</p>
      <div class="info-box">
        <p><strong>Номер счёта:</strong> ${invoice.number}</p>
        <p><strong>Сумма:</strong> ${Number(invoice.totalAmount).toLocaleString('ru')} ₽</p>
        ${invoice.dueDate ? `<p><strong>Срок оплаты:</strong> ${new Date(invoice.dueDate).toLocaleDateString('ru')}</p>` : ''}
      </div>
      <a href="${siteUrl}/cabinet/invoices" class="btn">Перейти к оплате</a>
      `
    ),
  })

  if (user.telegramId) {
    await sendTelegram(
      user.telegramId,
      `🧾 Новый счёт <b>${invoice.number}</b> на сумму <b>${Number(invoice.totalAmount).toLocaleString('ru')} ₽</b>`
    )
  }
}

// ─── Invoice paid ─────────────────────────────────────────────

export const notifyInvoicePaid = async (invoice, user) => {
  if (!user?.email) return

  await sendEmail({
    to: user.email,
    subject: `Счёт ${invoice.number} оплачен — спасибо!`,
    html: baseHtml(
      'Оплата получена',
      `
      <h2>Здравствуйте, ${user.name}!</h2>
      <p>Оплата получена. Спасибо!</p>
      <div class="info-box">
        <p><strong>Счёт:</strong> ${invoice.number}</p>
        <p><strong>Сумма:</strong> ${Number(invoice.totalAmount).toLocaleString('ru')} ₽</p>
        <p><strong>Статус:</strong> <span class="badge badge-green">Оплачен</span></p>
      </div>
      `
    ),
  })

  if (user.telegramId) {
    await sendTelegram(
      user.telegramId,
      `✅ Счёт <b>${invoice.number}</b> на <b>${Number(invoice.totalAmount).toLocaleString('ru')} ₽</b> — оплачен!`
    )
  }
}
