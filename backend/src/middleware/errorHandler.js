// Централизованный обработчик ошибок. Должен быть подключён последним
// middleware'ом в src/index.js (app.use(errorHandler)).

const PRISMA_ERROR_STATUS = {
  P2002: 409, // unique constraint violation
  P2003: 409, // foreign key constraint violation
  P2025: 404, // record not found
}

const PRISMA_ERROR_MESSAGE = {
  P2002: 'Запись с такими данными уже существует',
  P2003: 'Связанная запись не найдена',
  P2025: 'Запись не найдена',
}

export const errorHandler = (err, req, res, _next) => {
  // Ошибки multer (загрузка файлов)
  if (err.name === 'MulterError') {
    const messages = {
      LIMIT_FILE_SIZE: 'Файл слишком большой',
      LIMIT_UNEXPECTED_FILE: 'Неожиданный файл в запросе',
    }
    return res.status(400).json({ error: messages[err.code] || 'Ошибка загрузки файла' })
  }

  // Известные коды ошибок Prisma (PrismaClientKnownRequestError)
  if (err.code && PRISMA_ERROR_STATUS[err.code]) {
    return res.status(PRISMA_ERROR_STATUS[err.code]).json({ error: PRISMA_ERROR_MESSAGE[err.code] })
  }

  // Ошибки валидации jsonwebtoken
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Токен недействителен или истёк' })
  }

  // Ошибки парсинга JSON-тела запроса
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Некорректный формат запроса' })
  }

  const status = err.status || err.statusCode || 500

  if (status >= 500) {
    console.error('[errorHandler]', err)
  }

  res.status(status).json({
    error: status >= 500 ? 'Внутренняя ошибка сервера' : (err.message || 'Ошибка запроса'),
  })
}
