import { Router } from 'express'
import prisma from '../utils/prisma.js'
import { notifyInvoicePaid } from '../services/notifications.js'

export const paymentsRouter = Router()

// POST /api/payments/webhook/yukassa — входящий webhook от ЮKassa
paymentsRouter.post('/webhook/yukassa', async (req, res, next) => {
  try {
    const event = req.body
    if (event.type !== 'payment.succeeded') return res.json({ ok: true })

    const { id: externalId, metadata, amount } = event.object
    const { invoiceId, adDepositId } = metadata || {}

    if (invoiceId) {
      const invoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'PAID', paidAt: new Date() },
        include: { user: true },
      })
      await prisma.payment.upsert({
        where: { invoiceId },
        create: { invoiceId, provider: 'yukassa', externalId, amount: amount.value, status: 'succeeded' },
        update: { status: 'succeeded', externalId },
      })
      await notifyInvoicePaid(invoice, invoice.user)
    }

    if (adDepositId) {
      const deposit = await prisma.adDeposit.update({
        where: { id: adDepositId },
        data: { status: 'paid' },
        include: { account: true },
      })
      await prisma.adAccount.update({
        where: { id: deposit.accountId },
        data: { balance: { increment: Number(amount.value) } },
      })
    }

    res.json({ ok: true })
  } catch (err) { next(err) }
})
