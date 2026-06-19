import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { authenticate } from '../middleware/auth.js'
import prisma from '../utils/prisma.js'
import { signAccess, signRefresh, verifyRefresh } from '../utils/jwt.js'

export const authRouter = Router()

// ─── Email transporter ────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.inzhenerim.ru',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'noreply@inzhenerim.ru',
    pass: process.env.SMTP_PASS,
  },
})

const SITE_URL = process.env.APP_URL || 'https://inzhenerim.ru'
const FROM_EMAIL = process.env.SMTP_FROM || 'noreply@inzhenerim.ru'

async function sendMail(to, subject, html) {
  await transporter.sendMail({ from: `"inzhenerim.ru" <${FROM_EMAIL}>`, to, subject, html })
}

// ─── Helpers ──────────────────────────────────────────────────
const PUBLIC_USER_FIELDS = {
  id: true, email: true, name: true, phone: true,
  role: true, telegramId: true, emailVerified: true, createdAt: true,
}

const refreshExpiryDate = () => {
  const days = Number(String(process.env.JWT_REFRESH_EXPIRES_IN || '30d').replace('d', ''))
  return new Date(Date.now() + (Number.isFinite(days) ? days : 30) * 24 * 60 * 60 * 1000)
}

const issueTokens = async (user) => {
  const payload = { sub: user.id, role: user.role }
  const accessToken = signAccess(payload)
  const refreshToken = signRefresh(payload)
  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt: refreshExpiryDate() },
  })
  return { accessToken, refreshToken }
}

// ─── POST /api/auth/register ──────────────────────────────────
authRouter.post('/register', async (req, res, next) => {
  try {
    const { email, password, name, phone } = req.body
    if (!email || !password || !name)
      return res.status(400).json({ error: 'Email, пароль и имя обязательны' })
    if (password.length < 6)
      return res.status(400).json({ error: 'Пароль должен быть не короче 6 символов' })

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing)
      return res.status(409).json({ error: 'Пользователь с таким email уже существует' })

    const passwordHash = await bcrypt.hash(password, 10)
    const verifyToken = crypto.randomBytes(32).toString('hex')
    const verifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email,
        passwordHash,
        name,
        phone: phone || null,
        emailVerified: false,
        emailVerifyToken: verifyToken,
        emailVerifyExpiry: verifyExpiry,
      },
      select: PUBLIC_USER_FIELDS,
    })

    // Отправляем письмо с подтверждением
    const verifyUrl = `${SITE_URL}/verify-email?token=${verifyToken}`
    await sendMail(email, 'Подтвердите email — inzhenerim.ru', `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;padding:32px;background:#fff">
        <div style="margin-bottom:24px">
          <span style="font-size:24px;font-weight:700;color:#111">inzhenerim<span style="color:#4F46E5">.ru</span></span>
        </div>
        <h1 style="font-size:22px;font-weight:700;color:#111;margin:0 0 12px">Подтвердите ваш email</h1>
        <p style="color:#555;line-height:1.6;margin:0 0 24px">
          Здравствуйте, <strong>${name}</strong>!<br>
          Нажмите кнопку ниже, чтобы подтвердить email-адрес и активировать аккаунт.
        </p>
        <a href="${verifyUrl}" style="display:inline-block;background:#4F46E5;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px">
          Подтвердить email
        </a>
        <p style="color:#999;font-size:12px;margin:24px 0 0;line-height:1.5">
          Ссылка действительна 24 часа. Если вы не регистрировались на inzhenerim.ru — просто проигнорируйте это письмо.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="color:#bbb;font-size:11px;margin:0">© ${new Date().getFullYear()} inzhenerim.ru · IT-аутсорсинг в Вологде</p>
      </div>
    `)

    res.status(201).json({ user, message: 'Письмо с подтверждением отправлено на ' + email })
  } catch (err) { next(err) }
})

// ─── POST /api/auth/verify-email ──────────────────────────────
authRouter.post('/verify-email', async (req, res, next) => {
  try {
    const { token } = req.body
    if (!token) return res.status(400).json({ error: 'Токен обязателен' })

    const user = await prisma.user.findFirst({
      where: { emailVerifyToken: token, emailVerifyExpiry: { gt: new Date() } },
    })
    if (!user) return res.status(400).json({ error: 'Ссылка недействительна или истекла' })

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerifyToken: null, emailVerifyExpiry: null },
    })

    res.json({ message: 'Email подтверждён' })
  } catch (err) { next(err) }
})

// ─── POST /api/auth/resend-verify ─────────────────────────────
authRouter.post('/resend-verify', async (req, res, next) => {
  try {
    const { email } = req.body
    const user = await prisma.user.findUnique({ where: { email } })
    // Не раскрываем, существует ли аккаунт
    if (!user || user.emailVerified) {
      return res.json({ message: 'Если аккаунт существует и не подтверждён — письмо отправлено' })
    }

    const verifyToken = crypto.randomBytes(32).toString('hex')
    const verifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifyToken: verifyToken, emailVerifyExpiry: verifyExpiry },
    })

    const verifyUrl = `${SITE_URL}/verify-email?token=${verifyToken}`
    await sendMail(email, 'Подтвердите email — inzhenerim.ru', `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;padding:32px;background:#fff">
        <h1 style="font-size:22px;font-weight:700;color:#111;margin:0 0 12px">Подтвердите ваш email</h1>
        <a href="${verifyUrl}" style="display:inline-block;background:#4F46E5;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600">
          Подтвердить email
        </a>
        <p style="color:#999;font-size:12px;margin:24px 0 0">Ссылка действительна 24 часа.</p>
      </div>
    `)

    res.json({ message: 'Если аккаунт существует и не подтверждён — письмо отправлено' })
  } catch (err) { next(err) }
})

// ─── POST /api/auth/login ─────────────────────────────────────
authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ error: 'Email и пароль обязательны' })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.isActive)
      return res.status(401).json({ error: 'Неверный email или пароль' })

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid)
      return res.status(401).json({ error: 'Неверный email или пароль' })

    if (!user.emailVerified)
      return res.status(403).json({
        error: 'Email не подтверждён. Проверьте почту или запросите новое письмо.',
        code: 'EMAIL_NOT_VERIFIED',
      })

    const { accessToken, refreshToken } = await issueTokens(user)
    const { passwordHash, emailVerifyToken, emailVerifyExpiry, ...publicUser } = user

    res.json({ user: publicUser, accessToken, refreshToken })
  } catch (err) { next(err) }
})

// ─── POST /api/auth/forgot-password ───────────────────────────
authRouter.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Email обязателен' })

    const user = await prisma.user.findUnique({ where: { email } })
    // Всегда возвращаем 200 — не раскрываем существование аккаунта
    if (!user || !user.isActive) {
      return res.json({ message: 'Если аккаунт существует — письмо отправлено' })
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 час

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: resetToken, passwordResetExpiry: resetExpiry },
    })

    const resetUrl = `${SITE_URL}/reset-password?token=${resetToken}`
    await sendMail(email, 'Сброс пароля — inzhenerim.ru', `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;padding:32px;background:#fff">
        <div style="margin-bottom:24px">
          <span style="font-size:24px;font-weight:700;color:#111">inzhenerim<span style="color:#4F46E5">.ru</span></span>
        </div>
        <h1 style="font-size:22px;font-weight:700;color:#111;margin:0 0 12px">Сброс пароля</h1>
        <p style="color:#555;line-height:1.6;margin:0 0 24px">
          Здравствуйте, <strong>${user.name}</strong>!<br>
          Мы получили запрос на сброс пароля для вашего аккаунта. Нажмите кнопку ниже:
        </p>
        <a href="${resetUrl}" style="display:inline-block;background:#4F46E5;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px">
          Сбросить пароль
        </a>
        <p style="color:#999;font-size:12px;margin:24px 0 0;line-height:1.5">
          Ссылка действительна 1 час. Если вы не запрашивали сброс пароля — просто проигнорируйте это письмо.
          Ваш пароль не изменится.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="color:#bbb;font-size:11px;margin:0">© ${new Date().getFullYear()} inzhenerim.ru</p>
      </div>
    `)

    res.json({ message: 'Если аккаунт существует — письмо отправлено' })
  } catch (err) { next(err) }
})

// ─── POST /api/auth/reset-password ───────────────────────────
authRouter.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body
    if (!token || !password)
      return res.status(400).json({ error: 'Токен и новый пароль обязательны' })
    if (password.length < 6)
      return res.status(400).json({ error: 'Пароль должен быть не короче 6 символов' })

    const user = await prisma.user.findFirst({
      where: { passwordResetToken: token, passwordResetExpiry: { gt: new Date() } },
    })
    if (!user)
      return res.status(400).json({ error: 'Ссылка недействительна или истекла. Запросите новую.' })

    const passwordHash = await bcrypt.hash(password, 10)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordResetToken: null, passwordResetExpiry: null },
    })

    // Инвалидируем все refresh-токены (безопасность)
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } })

    res.json({ message: 'Пароль успешно изменён' })
  } catch (err) { next(err) }
})

// ─── POST /api/auth/refresh ───────────────────────────────────
authRouter.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken обязателен' })

    let payload
    try { payload = verifyRefresh(refreshToken) }
    catch { return res.status(401).json({ error: 'Refresh-токен недействителен' }) }

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } })
    if (!stored || stored.expiresAt < new Date())
      return res.status(401).json({ error: 'Refresh-токен истёк или не найден' })

    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user || !user.isActive)
      return res.status(401).json({ error: 'Пользователь не найден' })

    await prisma.refreshToken.delete({ where: { token: refreshToken } })
    const tokens = await issueTokens(user)
    res.json(tokens)
  } catch (err) { next(err) }
})

// ─── POST /api/auth/logout ────────────────────────────────────
authRouter.post('/logout', async (req, res, next) => {
  try {
    const { refreshToken } = req.body
    if (refreshToken) await prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
    res.status(204).end()
  } catch (err) { next(err) }
})

// ─── GET /api/auth/me ─────────────────────────────────────────
authRouter.get('/me', authenticate, async (req, res) => {
  const { passwordHash, emailVerifyToken, emailVerifyExpiry, passwordResetToken, passwordResetExpiry, ...publicUser } = req.user
  res.json(publicUser)
})
