import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth.js'
import prisma from '../utils/prisma.js'

export const servicesRouter = Router()

// GET /api/services — публичный список услуг
servicesRouter.get('/', async (req, res, next) => {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    })
    res.json(services)
  } catch (err) { next(err) }
})

// POST /api/services — создать услугу (только admin)
servicesRouter.post('/', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { name, description, price, period } = req.body
    if (!name || !price) return res.status(400).json({ error: 'name и price обязательны' })
    const service = await prisma.service.create({ data: { name, description, price, period } })
    res.status(201).json(service)
  } catch (err) { next(err) }
})

// PATCH /api/services/:id
servicesRouter.patch('/:id', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const service = await prisma.service.update({
      where: { id: req.params.id },
      data: req.body,
    })
    res.json(service)
  } catch (err) { next(err) }
})
