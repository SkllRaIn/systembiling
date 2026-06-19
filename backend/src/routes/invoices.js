import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth.js'
import prisma from '../utils/prisma.js'
import { notifyInvoicePaid } from '../services/notifications.js'

export const invoicesRouter = Router()
invoicesRouter.use(authenticate)

const generateNumber = () => {
  const d = new Date()
  return `INV-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}-${Date.now().toString(36).toUpperCase()}`
}

// GET /api/invoices
invoicesRouter.get('/', async (req, res, next) => {
  try {
    const isAdmin = ['ADMIN'].includes(req.user.role)
    const { status, page = 1, limit = 20 } = req.query
    const where = {
      ...(isAdmin ? {} : { userId: req.user.id }),
      ...(status ? { status } : {}),
    }
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.invoice.count({ where }),
    ])
    res.json({ invoices, total })
  } catch (err) { next(err) }
})

// POST /api/invoices — создать счёт (только admin)
invoicesRouter.post('/', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { userId, items, dueDate, notes } = req.body
    if (!userId || !items?.length) return res.status(400).json({ error: 'userId и items обязательны' })

    const total = items.reduce((sum, i) => sum + i.price * i.qty, 0)
    const invoice = await prisma.invoice.create({
      data: {
        number: generateNumber(),
        userId,
        totalAmount: total,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
        items: { create: items },
      },
      include: { items: true, user: true },
    })
    res.status(201).json(invoice)
  } catch (err) { next(err) }
})

// GET /api/invoices/subscriptions/my — подписки клиента
// ВАЖНО: должен быть ДО /:id
invoicesRouter.get('/subscriptions/my', async (req, res, next) => {
  try {
    const subs = await prisma.subscription.findMany({
      where: { userId: req.user.id },
      include: { service: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json(subs)
  } catch (err) { next(err) }
})

// GET /api/invoices/:id
invoicesRouter.get('/:id', async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { items: true, user: { select: { id: true, name: true, email: true } }, payment: true },
    })
    if (!invoice) return res.status(404).json({ error: 'Счёт не найден' })
    if (invoice.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Нет доступа' })
    }
    res.json(invoice)
  } catch (err) { next(err) }
})

// POST /api/invoices/:id/mark-paid — ручная отметка оплаты (admin)
invoicesRouter.post('/:id/mark-paid', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status: 'PAID', paidAt: new Date() },
      include: { user: true },
    })
    await notifyInvoicePaid(invoice, invoice.user)
    res.json(invoice)
  } catch (err) { next(err) }
})


