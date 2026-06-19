import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { authenticate, requireRole } from '../middleware/auth.js'
import prisma from '../utils/prisma.js'
import { notifyTicketCreated, notifyTicketUpdated } from '../services/notifications.js'

export const ticketsRouter = Router()
ticketsRouter.use(authenticate)

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, process.env.UPLOAD_DIR || './uploads'),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
  },
})
const upload = multer({ storage, limits: { fileSize: Number(process.env.MAX_FILE_SIZE) || 10485760 } })

// GET /api/tickets — список (клиент видит свои, сисадмин/админ — все)
ticketsRouter.get('/', async (req, res, next) => {
  try {
    const { status, priority, assigneeId, page = 1, limit = 20 } = req.query
    const isStaff = ['SYSADMIN', 'ADMIN'].includes(req.user.role)
    const where = {
      ...(isStaff ? {} : { creatorId: req.user.id }),
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(assigneeId ? { assigneeId } : {}),
    }
    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          creator: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true } },
          _count: { select: { comments: true } },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.ticket.count({ where }),
    ])
    res.json({ tickets, total, page: Number(page), limit: Number(limit) })
  } catch (err) { next(err) }
})

// POST /api/tickets
ticketsRouter.post('/', async (req, res, next) => {
  try {
    const { title, description, priority = 'MEDIUM' } = req.body
    if (!title || !description) {
      return res.status(400).json({ error: 'title и description обязательны' })
    }
    const ticket = await prisma.ticket.create({
      data: { title, description, priority, creatorId: req.user.id },
      include: { creator: { select: { id: true, name: true, email: true } } },
    })
    await notifyTicketCreated(ticket, req.user)
    res.status(201).json(ticket)
  } catch (err) { next(err) }
})

// GET /api/tickets/:id
ticketsRouter.get('/:id', async (req, res, next) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true } },
        comments: {
          include: { author: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
        attachments: true,
      },
    })
    if (!ticket) return res.status(404).json({ error: 'Тикет не найден' })
    const isOwner = ticket.creatorId === req.user.id
    const isStaff = ['SYSADMIN', 'ADMIN'].includes(req.user.role)
    if (!isOwner && !isStaff) return res.status(403).json({ error: 'Нет доступа' })
    res.json(ticket)
  } catch (err) { next(err) }
})

// PATCH /api/tickets/:id — обновить статус/приоритет/назначить (только staff)
ticketsRouter.patch('/:id', requireRole('SYSADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const { status, priority, assigneeId } = req.body
    const data = {}
    if (status) data.status = status
    if (priority) data.priority = priority
    if (assigneeId !== undefined) data.assigneeId = assigneeId
    if (status === 'CLOSED') data.closedAt = new Date()

    const ticket = await prisma.ticket.update({
      where: { id: req.params.id },
      data,
      include: { creator: true },
    })
    await notifyTicketUpdated(ticket, ticket.creator)
    res.json(ticket)
  } catch (err) { next(err) }
})

// POST /api/tickets/:id/comments
ticketsRouter.post('/:id/comments', async (req, res, next) => {
  try {
    const { text, isInternal = false } = req.body
    if (!text) return res.status(400).json({ error: 'Текст обязателен' })
    const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id } })
    if (!ticket) return res.status(404).json({ error: 'Тикет не найден' })
    const isStaff = ['SYSADMIN', 'ADMIN'].includes(req.user.role)
    if (!isStaff && ticket.creatorId !== req.user.id) {
      return res.status(403).json({ error: 'Нет доступа' })
    }
    const comment = await prisma.ticketComment.create({
      data: {
        ticketId: req.params.id,
        authorId: req.user.id,
        text,
        isInternal: isStaff ? isInternal : false,
      },
      include: { author: { select: { id: true, name: true, role: true } } },
    })
    res.status(201).json(comment)
  } catch (err) { next(err) }
})

// POST /api/tickets/:id/attachments
ticketsRouter.post('/:id/attachments', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Файл не загружен' })
    const attachment = await prisma.ticketAttachment.create({
      data: {
        ticketId: req.params.id,
        filename: req.file.originalname,
        path: req.file.filename,
        size: req.file.size,
      },
    })
    res.status(201).json(attachment)
  } catch (err) { next(err) }
})
