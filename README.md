
# tamada
# 🎮 Event Games Backend

Backend-система с авторизацией и ограничением устройств для игр на мероприятия.

## 🚀 Возможности

- ✅ Регистрация и авторизация пользователей
- ✅ JWT токены для безопасности
- ✅ Хеширование паролей с bcrypt
- ✅ Ограничение до 2 устройств на пользователя
- ✅ Отслеживание устройств по отпечаткам
- ✅ PostgreSQL база данных через Prisma ORM
- ✅ Защищённые API маршруты
- ✅ Готовый фронтенд с формами авторизации

## 📋 Требования

- Node.js 16+ 
- PostgreSQL 12+
- npm или yarn

## 🔧 Установка

### 1. Установите зависимости

```bash
npm install
```

### 2. Настройте PostgreSQL

Создайте базу данных PostgreSQL:

```sql
CREATE DATABASE event_games_db;
```

### 3. Настройте переменные окружения

Создайте файл `.env` в корне проекта:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/event_games_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this"
PORT=3000
NODE_ENV=development
MAX_DEVICES_PER_USER=2
```

Замените `username` и `password` на ваши данные PostgreSQL.

### 4. Выполните миграции

```bash
npx prisma migrate dev --name init
```

Эта команда создаст таблицы в базе данных.

### 5. Генерация Prisma Client

```bash
npx prisma generate
```

### 6. Запустите сервер

```bash
# Development режим с auto-reload
npm run dev

# Или production режим
npm start
```

Сервер запустится на `http://localhost:3000`

## 📂 Структура проекта

```
backend/
├── controllers/           # Контроллеры (бизнес-логика)
│   ├── auth.controller.js
│   ├── device.controller.js
│   └── user.controller.js
│
├── middlewares/          # Middleware функции
│   └── auth.middleware.js
│
├── routes/               # Маршруты API
│   ├── auth.routes.js
│   ├── device.routes.js
│   └── user.routes.js
│
├── utils/                # Утилиты
│   └── device.utils.js
│
├── prisma/               # Prisma ORM
│   └── schema.prisma
│
├── public/               # Статический фронтенд
│   ├── auth.html
│   └── auth.js
│
├── .env                  # Переменные окружения
├── server.js             # Главный файл сервера
└── package.json
```

## 🔌 API Endpoints

### Авторизация

```
POST   /api/auth/register      - Регистрация
POST   /api/auth/login          - Вход
POST   /api/auth/logout         - Выход
GET    /api/auth/verify         - Проверка токена (защищён)
```

### Пользователь

```
GET    /api/user/profile        - Получить профиль (защищён)
```

### Устройства

```
GET    /api/devices             - Список устройств (защищён)
DELETE /api/devices/:deviceId   - Удалить устройство (защищён)
DELETE /api/devices/all/except-current - Удалить все кроме текущего (защищён)
```

## 📝 Примеры использования API

### Регистрация

```javascript
const response = await fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
    name: 'John Doe' // необязательно
  })
});

const data = await response.json();
console.log(data);
// { success: true, message: 'Регистрация успешна', user: {...} }
```

### Вход

```javascript
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include', // для cookie
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const data = await response.json();
console.log(data);
// { success: true, token: 'jwt-token', user: {...}, device: {...} }

// Сохраните токен для последующих запросов
localStorage.setItem('token', data.token);
```

### Получить профиль (защищённый маршрут)

```javascript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:3000/api/user/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  },
  credentials: 'include'
});

const data = await response.json();
console.log(data);
// { success: true, user: { id, email, name, devices: [...] } }
```

### Получить список устройств

```javascript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:3000/api/devices', {
  headers: {
    'Authorization': `Bearer ${token}`
  },
  credentials: 'include'
});

const data = await response.json();
console.log(data);
// { success: true, devices: [{id, deviceName, lastUsedAt, createdAt}] }
```

### Удалить устройство

```javascript
const token = localStorage.getItem('token');
const deviceId = 'device-uuid';

const response = await fetch(`http://localhost:3000/api/devices/${deviceId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  credentials: 'include'
});

const data = await response.json();
console.log(data);
// { success: true, message: 'Устройство удалено' }
```

## 🎯 Как работает ограничение устройств

1. При входе генерируется уникальный отпечаток устройства на основе User-Agent и IP
2. Система проверяет количество устройств пользователя
3. Если устройств >= 2 (MAX_DEVICES_PER_USER), блокируется вход с нового устройства
4. Пользователь должен удалить старое устройство, чтобы войти с нового

## 🛠️ Полезные команды

```bash
# Запустить dev сервер с auto-reload
npm run dev

# Открыть Prisma Studio (GUI для базы данных)
npm run prisma:studio

# Создать новую миграцию
npx prisma migrate dev --name migration_name

# Сбросить базу данных
npx prisma migrate reset

# Форматировать Prisma схему
npx prisma format
```

## 🔒 Безопасность

- Пароли хешируются с помощью bcrypt (10 раундов)
- JWT токены подписываются секретным ключом
- HTTP-only cookies для защиты от XSS
- CORS настроен для безопасности
- Защита от SQL-инъекций через Prisma

## 🧪 Тестирование

### Тестирование регистрации

1. Откройте `http://localhost:3000/auth.html`
2. Перейдите на вкладку "Регистрация"
3. Заполните форму и нажмите "Зарегистрироваться"
4. После успеха перейдите на вкладку "Вход"

### Тестирование входа

1. Введите email и пароль
2. Нажмите "Войти"
3. Откроется dashboard с вашим профилем и списком устройств

### Тестирование лимита устройств

1. Войдите с первого устройства (или браузера)
2. Войдите со второго устройства
3. Попробуйте войти с третьего устройства
4. Вы увидите ошибку с предложением удалить старое устройство

## 🐛 Устранение проблем

### Ошибка подключения к БД

```
Error: Can't reach database server
```

**Решение:**
- Проверьте, что PostgreSQL запущен
- Проверьте `DATABASE_URL` в `.env`
- Убедитесь, что база данных создана

### Ошибка миграции

```
Error: P1001: Can't reach database server
```

**Решение:**
```bash
npx prisma migrate reset
npx prisma migrate dev --name init
```

### JWT ошибка

```
Error: invalid signature
```

**Решение:**
- Проверьте `JWT_SECRET` в `.env`
- Очистите токены и войдите заново

## 📚 Дополнительно

- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [JWT.io](https://jwt.io/)
- [bcrypt NPM](https://www.npmjs.com/package/bcrypt)

## 📄 Лицензия

MIT License

## 👨‍💻 Автор

Event Games Backend - система авторизации для игрового проекта
