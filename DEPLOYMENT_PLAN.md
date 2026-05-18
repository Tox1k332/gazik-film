# План деплоя и модернизации FilmHaven

## Текущее состояние

Приложение работает полностью на клиенте:
- Данные TMDB API загружаются напрямую в браузере
- "Авторизация" и "история просмотров" хранятся в localStorage браузера
- Обсуждения хранятся в localStorage одного браузера

---

## Архитектура после модернизации

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│ Database    │
│   (Vite/    │     │   (Node.js) │     │ (PostgreSQL)│
│   Vue.js)   │◀────│   (Express) │◀────│             │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  TMDB API   │
                    │  (внешний)  │
                    └─────────────┘
```

---

## 1. Backend

### Технология: Node.js + Express (или Fastify)

**Почему:**
- JavaScript на фронтенде и бэкенде — один язык
- Огромная экосистема npm-пакетов
- Легко деплоить (Vercel, Railway, Render, DigitalOcean)
- Отлично подходит для REST API

**Альтернативы:**
- Python (Django/FastAPI) — если планируется ML/AI
- Go — для высокой производительности
- PHP (Laravel) — если нужен классический стек

### Структура API

```javascript
// server.js (пример)
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/discussions', require('./routes/discussions'));
app.use('/api/history', require('./routes/history'));
app.use('/api/tmdb', require('./routes/tmdb')); // проксирование

app.listen(3000, () => console.log('Server running on port 3000'));
```

### Endpoints для реализации

```javascript
// routes/auth.js
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getMe);

// routes/discussions.js
router.get('/', discussionsController.getAll);
router.post('/', authMiddleware, discussionsController.create);
router.get('/:id', discussionsController.getById);
router.post('/:id/reply', authMiddleware, discussionsController.addReply);

// routes/history.js
router.get('/', authMiddleware, historyController.get);
router.post('/', authMiddleware, historyController.add);
router.delete('/', authMiddleware, historyController.clear);
```

### Аутентификация

Использовать JWT (JSON Web Tokens):

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Требуется авторизация' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Неверный токен' });
  }
};
```

**Секрет хранить в .env:**
```
JWT_SECRET=your-super-secret-key-change-in-production
```

---

## 2. База данных

### Выбор: PostgreSQL

**Почему:**
- Надёжная, проверенная временем
- Отлично работает с Node.js (библиотека `pg` или `Prisma`)
- Поддерживает сложные запросы (JOIN, агрегации)
- Бесплатная (или очень дешёвая)

**Альтернативы:**
- MySQL — если нужен простой хостинг (часто дешевле)
- MongoDB — если данные неструктурированные (но PostgreSQL тоже подходит)
- SQLite — для начала (не для продакшена)

### Схема базы данных

```sql
-- Таблица пользователей
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица обсуждений
CREATE TABLE discussions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица ответов в обсуждениях
CREATE TABLE discussion_replies (
    id SERIAL PRIMARY KEY,
    discussion_id INTEGER REFERENCES discussions(id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица истории просмотров
CREATE TABLE view_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    movie_id INTEGER NOT NULL,
    movie_title VARCHAR(255),
    movie_poster TEXT,
    movie_type VARCHAR(20),
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица комментариев к фильмам
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    movie_id INTEGER NOT NULL,
    movie_type VARCHAR(20),
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### ORM: Prisma (рекомендуется)

```javascript
// schema.prisma
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  email     String   @unique
  password  String
  avatar    String?
  createdAt DateTime @default(now())
  
  discussions      Discussion[]
  discussionReplies DiscussionReply[]
  viewHistory     ViewHistory[]
  comments        Comment[]
}

model Discussion {
  id        Int      @id @default(autoincrement())
  title     String
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
  
  replies   DiscussionReply[]
}
```

**Почему Prisma:**
- Простой синтаксис
- Автогенерация типов для TypeScript
- Легко читать и поддерживать
- Хорошая документация

**Установка:**
```bash
npm install prisma @prisma/client
npx prisma init
```

---

## 3. Хостинг

### Вариант 1: Railway (рекомендуется для начала)

**Плюсы:**
- Бесплатный тариф для начала
- Автоматический деплой из GitHub
- Встроенная поддержка PostgreSQL
- Простота настройки

**Цены:**
- Бесплатно: 500 часов, 1GB RAM
- $5/мес: больше ресурсов

**Деплой:**
1. Подключить GitHub репозиторий
2. Выбрать "Node.js" шаблон
3. Добавить переменные окружения
4. Deploy!

### Вариант 2: Render

**Плюсы:**
- Бесплатный тариф для веб-сервисов
- PostgreSQL тоже бесплатно
- Автоматический деплой

### Вариант 3: DigitalOcean

**Плюсы:**
- Полный контроль
- $4/мес за VPS (Droplet)
- Можно развернуть всё самому

### Вариант 4: Vercel (Frontend)

Для фронтенда — идеально:
- Бесплатно
- CDN по всему миру
- Автоматический деплой из GitHub
- Поддержка Vue.js

---

## 4. Схема деплоя

### Вариант А: Railway (всё в одном)

```
Frontend → Vercel (static hosting)
Backend  → Railway (Node.js)
DB       → Railway (PostgreSQL)
```

### Вариант Б: Полный VPS

```
DigitalOcean Droplet ($4-10/мес)
├── Nginx (reverse proxy)
├── Backend (Node.js + PM2)
├── Frontend (Static files)
└── PostgreSQL
```

---

## 5. Конфигурация .env

```env
# Backend
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-key-min-32-chars

# Database
DATABASE_URL=postgresql://user:password@host:5432/filmhaven

# Frontend
VITE_API_URL=https://your-backend-domain.com/api
VITE_TMDB_API_KEY=your-tmdb-api-key

# Для разработки
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/filmhaven_dev
```

---

## 6. Шаги реализации

### Фаза 1: Подготовка (1-2 дня)
1. Создать GitHub репозиторий
2. Настроить линтер и тесты
3. Настроить CI/CD (GitHub Actions)

### Фаза 2: Backend (3-5 дней)
1. Инициализировать Node.js проект
2. Подключить PostgreSQL через Prisma
3. Создать модели данных
4. Реализовать API эндпоинты
5. Настроить JWT аутентификацию
6. Перенести логику из localStorage в БД

### Фаза 3: Frontend (3-5 дней)
1. Обновить axios для работы с бэкендом
2. Заменить localStorage на API вызовы
3. Добавить обработку ошибок
4. Оптимизировать билд

### Фаза 4: Деплой (1-2 дня)
1. Задеплоить базу данных
2. Задеплоить бэкенд
3. Задеплоить фронтенд
4. Настроить домен (опционально)

---

## 7. Технологический стек

| Компонент | Технология |
|-----------|------------|
| Frontend | Vue.js 3 + Vite |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT |
| Hosting (Frontend) | Vercel |
| Hosting (Backend) | Railway / Render / DigitalOcean |
| CI/CD | GitHub Actions |

---

## 8. Примеры кода

### Подключение к БД

```javascript
// lib/prisma.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
```

### Контроллер пользователя

```javascript
// controllers/userController.js
const prisma = require('../lib/prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] }
  });

  if (existingUser) {
    return res.status(400).json({ error: 'Пользователь уже существует' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { username, email, password: hashedPassword }
  });

  const token = jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
};
```

### Проксирование TMDB API

```javascript
// routes/tmdb.js
const express = require('express');
const router = express.Router();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

router.get('/movie/popular', async (req, res) => {
  const { page = 1 } = req.query;
  
  const response = await fetch(
    `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=ru-RU&page=${page}`
  );
  
  const data = await response.json();
  res.json(data);
});

// другие эндпоинты аналогично
```

---

## 9. Тестирование

### Backend тесты (Jest + Supertest)

```javascript
// tests/auth.test.js
const request = require('supertest');
const app = require('../app');

describe('POST /api/auth/register', () => {
  it('should create new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ username: 'test', email: 'test@test.com', password: 'password123' });
    
    expect(response.status).toBe(201);
    expect(response.body.token).toBeDefined();
  });
});
```

### Запуск тестов
```bash
npm run test
```

---

## 10. Мониторинг и логирование

### Для продакшена

1. **Sentry** — отслеживание ошибок (бесплатно для начала)
2. **Logtail** или **Papertrail** — логи
3. **UptimeRobot** — проверка доступности

```javascript
// app.js
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });

app.use(Sentry.Handlers.errorHandler());
```

---

## Резюме

Для старта достаточно:
1. **Railway** для бэкенда + БД ($0-5/мес)
2. **Vercel** для фронтенда ($0)
3. **PostgreSQL** через Prisma
4. **Node.js + Express** для API

Общая стоимость старта: **$0-10/мес**