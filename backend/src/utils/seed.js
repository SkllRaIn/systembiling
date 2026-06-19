import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Запуск seed...')

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@inzhenerim.ru'
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (existing) {
    console.log(`✅ Администратор уже существует: ${adminEmail}`)
  } else {
    const passwordHash = await bcrypt.hash(adminPassword, 10)
    const admin = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: adminEmail,
        passwordHash,
        name: 'Администратор',
        role: 'ADMIN',
        emailVerified: true,
      },
    })
    console.log(`✅ Создан администратор: ${admin.email}`)
  }

  // Создаём тестовые услуги если их нет
  const count = await prisma.service.count()
  if (count === 0) {
    await prisma.service.createMany({
      data: [
        { id: uuidv4(), name: 'Администрирование серверов', description: 'Мониторинг и поддержка серверной инфраструктуры', price: 15000, period: 'monthly' },
        { id: uuidv4(), name: 'Настройка рабочих мест', description: 'Установка ПО, настройка оборудования', price: 3000, period: 'one-time' },
        { id: uuidv4(), name: 'Техническая поддержка', description: 'Реагирование на инциденты 8×5', price: 8000, period: 'monthly' },
      ],
    })
    console.log('✅ Созданы тестовые услуги')
  }

  console.log('✅ Seed завершён')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
