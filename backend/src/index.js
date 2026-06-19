import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { authRouter } from './routes/auth.js'
import { usersRouter } from './routes/users.js'
import { ticketsRouter } from './routes/tickets.js'
import { tasksRouter } from './routes/tasks.js'
import { invoicesRouter } from './routes/invoices.js'
import { servicesRouter } from './routes/services.js'
import { adsRouter } from './routes/ads.js'
import { paymentsRouter } from './routes/payments.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use('/uploads', express.static('uploads'))

app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
app.use('/api/tickets', ticketsRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/invoices', invoicesRouter)
app.use('/api/services', servicesRouter)
app.use('/api/ads', adsRouter)
app.use('/api/payments', paymentsRouter)

// Удобный алиас: GET /api/admin/stats -> GET /api/users/admin-stats
app.get('/api/admin/stats', (req, res) => {
  res.redirect(307, '/api/users/admin-stats')
})

app.get('/api/health', (_, res) => res.json({ ok: true }))

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`API запущен на порту ${PORT}`)
})
