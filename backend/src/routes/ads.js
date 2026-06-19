import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth.js'
import prisma from '../utils/prisma.js'

export const adsRouter = Router()
adsRouter.use(authenticate)
adsRouter.use(requireRole('ADS_MANAGER', 'ADMIN'))

const myAccount = async (userId) => {
  let acc = await prisma.adAccount.findUnique({ where: { userId } })
  if (!acc) acc = await prisma.adAccount.create({ data: { userId } })
  return acc
}

// GET /api/ads/account
adsRouter.get('/account', async (req, res, next) => {
  try {
    const acc = await myAccount(req.user.id)
    res.json(acc)
  } catch (err) { next(err) }
})

// GET /api/ads/campaigns
adsRouter.get('/campaigns', async (req, res, next) => {
  try {
    const acc = await myAccount(req.user.id)
    const { status } = req.query
    const campaigns = await prisma.campaign.findMany({
      where: { accountId: acc.id, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
    })
    res.json(campaigns)
  } catch (err) { next(err) }
})

// POST /api/ads/campaigns
adsRouter.post('/campaigns', async (req, res, next) => {
  try {
    const acc = await myAccount(req.user.id)
    const { name, budget, description, startDate, endDate } = req.body
    if (!name || !budget) return res.status(400).json({ error: 'name и budget обязательны' })
    if (Number(budget) > Number(acc.balance)) {
      return res.status(400).json({ error: 'Недостаточно средств на балансе' })
    }
    const campaign = await prisma.campaign.create({
      data: {
        accountId: acc.id,
        name,
        budget: Number(budget),
        description,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    })
    res.status(201).json(campaign)
  } catch (err) { next(err) }
})

// PATCH /api/ads/campaigns/:id
adsRouter.patch('/campaigns/:id', async (req, res, next) => {
  try {
    const acc = await myAccount(req.user.id)
    const existing = await prisma.campaign.findFirst({ where: { id: req.params.id, accountId: acc.id } })
    if (!existing) return res.status(404).json({ error: 'Кампания не найдена' })

    const { name, status, budget, description, startDate, endDate } = req.body
    const campaign = await prisma.campaign.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(status !== undefined && { status }),
        ...(budget !== undefined && { budget: Number(budget) }),
        ...(description !== undefined && { description }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      },
    })
    res.json(campaign)
  } catch (err) { next(err) }
})

// GET /api/ads/campaigns/:id/reports
adsRouter.get('/campaigns/:id/reports', async (req, res, next) => {
  try {
    const acc = await myAccount(req.user.id)
    const campaign = await prisma.campaign.findFirst({ where: { id: req.params.id, accountId: acc.id } })
    if (!campaign) return res.status(404).json({ error: 'Кампания не найдена' })
    const reports = await prisma.campaignReport.findMany({
      where: { campaignId: req.params.id },
      orderBy: { date: 'asc' },
    })
    const totals = reports.reduce((acc, r) => ({
      impressions: acc.impressions + r.impressions,
      clicks: acc.clicks + r.clicks,
      spent: Number(acc.spent) + Number(r.spent),
    }), { impressions: 0, clicks: 0, spent: 0 })
    res.json({ reports, totals })
  } catch (err) { next(err) }
})

// POST /api/ads/deposit — пополнение баланса (создаёт запись, платёж обрабатывается через webhook)
adsRouter.post('/deposit', async (req, res, next) => {
  try {
    const acc = await myAccount(req.user.id)
    const { amount, provider = 'yukassa' } = req.body
    if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'Некорректная сумма' })
    const deposit = await prisma.adDeposit.create({
      data: { accountId: acc.id, amount: Number(amount), provider },
    })
    // Здесь должна быть интеграция с платёжной системой — returnURL для redirect
    res.status(201).json({ deposit, paymentUrl: `/pay/${deposit.id}` })
  } catch (err) { next(err) }
})
