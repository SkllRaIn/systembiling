import { verifyAccess } from '../utils/jwt.js'
import prisma from '../utils/prisma.js'

export const authenticate = async (req, res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Не авторизован' })
  }
  try {
    const payload = verifyAccess(header.slice(7))
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user || !user.isActive) return res.status(401).json({ error: 'Пользователь не найден' })
    req.user = user
    next()
  } catch {
    return res.status(401).json({ error: 'Токен недействителен' })
  }
}

export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ error: 'Недостаточно прав' })
  }
  next()
}
