import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth.js'
import prisma from '../utils/prisma.js'

export const tasksRouter = Router()
tasksRouter.use(authenticate)
tasksRouter.use(requireRole('SYSADMIN', 'ADS_MANAGER', 'ADMIN'))

// GET /api/tasks — канбан (все колонки)
tasksRouter.get('/', async (req, res, next) => {
  try {
    const { assigneeId, status } = req.query
    const where = {
      ...(assigneeId ? { assigneeId } : {}),
      ...(status ? { status } : {}),
      // ADS_MANAGER видит только свои таски
      ...(req.user.role === 'ADS_MANAGER' ? { assigneeId: req.user.id } : {}),
    }
    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, role: true } },
        creator: { select: { id: true, name: true } },
      },
      orderBy: [{ status: 'asc' }, { position: 'asc' }],
    })
    // Группировка по статусу для удобства фронта
    const board = {
      TODO: tasks.filter(t => t.status === 'TODO'),
      IN_WORK: tasks.filter(t => t.status === 'IN_WORK'),
      REVIEW: tasks.filter(t => t.status === 'REVIEW'),
      DONE: tasks.filter(t => t.status === 'DONE'),
    }
    res.json(board)
  } catch (err) { next(err) }
})

// POST /api/tasks
tasksRouter.post('/', async (req, res, next) => {
  try {
    const { title, description, priority, dueDate, assigneeId, tags, ticketId } = req.body
    if (!title) return res.status(400).json({ error: 'title обязателен' })
    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId: assigneeId || null,
        tags: tags || [],
        ticketId: ticketId || null,
        creatorId: req.user.id,
      },
      include: {
        assignee: { select: { id: true, name: true, role: true } },
      },
    })
    res.status(201).json(task)
  } catch (err) { next(err) }
})

// PATCH /api/tasks/reorder — массовое обновление позиций при drag-and-drop
// ВАЖНО: этот роут должен быть ДО /:id, иначе Express поймает /reorder как id
tasksRouter.patch('/reorder', async (req, res, next) => {
  try {
    const { updates } = req.body // [{ id, status, position }]
    if (!Array.isArray(updates)) return res.status(400).json({ error: 'updates должен быть массивом' })
    await prisma.$transaction(
      updates.map(u =>
        prisma.task.update({
          where: { id: u.id },
          data: { status: u.status, position: u.position },
        })
      )
    )
    res.json({ ok: true })
  } catch (err) { next(err) }
})

// PATCH /api/tasks/:id — переместить, назначить, изменить
tasksRouter.patch('/:id', async (req, res, next) => {
  try {
    const { status, position, assigneeId, title, description, priority, dueDate, tags } = req.body
    const data = {}
    if (status !== undefined) data.status = status
    if (position !== undefined) data.position = position
    if (assigneeId !== undefined) data.assigneeId = assigneeId
    if (title !== undefined) data.title = title
    if (description !== undefined) data.description = description
    if (priority !== undefined) data.priority = priority
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null
    if (tags !== undefined) data.tags = tags

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data,
      include: { assignee: { select: { id: true, name: true, role: true } } },
    })
    res.json(task)
  } catch (err) { next(err) }
})

// DELETE /api/tasks/:id
tasksRouter.delete('/:id', requireRole('ADMIN'), async (req, res, next) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (err) { next(err) }
})


