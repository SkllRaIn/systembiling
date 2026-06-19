import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { authenticate, requireRole } from '../middleware/auth.js'
import prisma from '../utils/prisma.js'
import { sendWelcomeEmail } from '../services/notifications.js'

export const usersRouter = Router()
usersRouter.use(authenticate)

// GET /api/users — только admin видит всех (с поиском)
usersRouter.get('/', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { role, page = 1, limit = 50, search } = req.query
    const where = {}
    if (role) where.role = role
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    })
    res.json(users)
  } catch (err) { next(err) }
})

// GET /api/users/staff — список сотрудников для назначения
usersRouter.get('/staff', requireRole('SYSADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const staff = await prisma.user.findMany({
      where: { role: { in: ['SYSADMIN', 'ADS_MANAGER', 'ADMIN'] }, isActive: true },
      select: { id: true, name: true, role: true },
    })
    res.json(staff)
  } catch (err) { next(err) }
})

// GET /api/admin/stats — статистика для дашборда (вынесено в usersRouter для простоты)
usersRouter.get('/admin-stats', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      totalClients,
      totalStaff,
      pendingInvoices,
      openTickets,
      activeServices,
      tasksInWork,
      totalRevenue,
      monthRevenue,
      recentUsers,
      recentInvoices,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CLIENT' } }),
      prisma.user.count({ where: { role: { in: ['SYSADMIN', 'ADS_MANAGER', 'ADMIN'] } } }),
      prisma.invoice.count({ where: { status: 'PENDING' } }),
      prisma.ticket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.service.count({ where: { isActive: true } }),
      prisma.task.count({ where: { status: 'IN_WORK' } }),
      prisma.invoice.aggregate({
        where: { status: 'PAID' },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.aggregate({
        where: { status: 'PAID', paidAt: { gte: firstDayOfMonth } },
        _sum: { totalAmount: true },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
      prisma.invoice.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          number: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
        },
      }),
    ])

    res.json({
      totalClients,
      totalStaff,
      pendingInvoices,
      openTickets,
      activeServices,
      tasksInWork,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      monthRevenue: monthRevenue._sum.totalAmount || 0,
      recentUsers,
      recentInvoices,
    })
  } catch (err) { next(err) }
})

// POST /api/users — создать пользователя (admin)
usersRouter.post('/', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { email, password, name, phone, role = 'CLIENT' } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, пароль и имя обязательны' })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Пароль должен быть не короче 6 символов' })
    }
    if (!['CLIENT', 'SYSADMIN', 'ADS_MANAGER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Недопустимая роль' })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ error: 'Пользователь с таким email уже существует' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email,
        passwordHash,
        name,
        phone: phone || null,
        role,
        emailVerified: true,
      },
      select: {
        id: true, email: true, name: true, role: true, phone: true, isActive: true, createdAt: true,
      },
    })

    // Отправить приветственное письмо
    await sendWelcomeEmail({ email, name, password }).catch(() => {})

    res.status(201).json(user)
  } catch (err) { next(err) }
})

// GET /api/users/:id/detail — детали пользователя (admin)
usersRouter.get('/:id/detail', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, number: true, totalAmount: true, status: true, createdAt: true },
        },
        ticketsCreated: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, number: true, title: true, status: true, priority: true, createdAt: true },
        },
        subscriptions: {
          include: { service: { select: { name: true, price: true, period: true } } },
        },
      },
    })
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' })

    const { passwordHash, ...safeUser } = user
    res.json({
      ...safeUser,
      tickets: safeUser.ticketsCreated,
    })
  } catch (err) { next(err) }
})

// POST /api/users/:id/reset-password — сброс пароля (admin)
usersRouter.post('/:id/reset-password', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { password } = req.body
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Пароль должен быть не короче 6 символов' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    await prisma.user.update({
      where: { id: req.params.id },
      data: { passwordHash },
    })

    // Инвалидировать все refresh-токены пользователя
    await prisma.refreshToken.deleteMany({ where: { userId: req.params.id } })

    res.json({ ok: true })
  } catch (err) { next(err) }
})

// PATCH /api/users/me — обновить свой профиль
// ВАЖНО: должен быть ДО /:id
usersRouter.patch('/me', async (req, res, next) => {
  try {
    const { name, phone, telegramId } = req.body
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(telegramId !== undefined && { telegramId }),
      },
      select: { id: true, email: true, name: true, phone: true, telegramId: true, role: true },
    })
    res.json(user)
  } catch (err) { next(err) }
})

// PATCH /api/users/:id — изменить роль/статус (admin)
usersRouter.patch('/:id', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { role, isActive, name, phone } = req.body
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(role !== undefined && { role }),
        ...(isActive !== undefined && { isActive }),
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
      },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    })
    res.json(user)
  } catch (err) { next(err) }
})
