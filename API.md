# API Documentation - App Versions

API для управления версиями приложения с использованием Cloudflare Workers, Hono framework и Cloudflare D1.

## Base URL
```
http://localhost:5173 (dev - frontend)
http://localhost:8787 (dev - worker)
https://planer.m-k-mendykhan.workers.dev (production)
```

## Authentication

Приложение использует Firebase Authentication с обязательной проверкой email.

- **Публичные endpoints**: Доступны без авторизации
- **Защищенные endpoints**: Требуют JWT токен в заголовке `Authorization: Bearer <token>`

Для работы с защищенными endpoints необходимо:
1. Зарегистрироваться через `/register`
2. Подтвердить email
3. Войти через `/login`
4. Использовать полученный токен для API запросов

Подробности в [QUICK_START_AUTH.md](./QUICK_START_AUTH.md)

## Endpoints

### Public Endpoints (без авторизации)

#### 1. Get All Versions
Получить список всех версий приложения, отсортированных по дате релиза (новые первыми).

**Endpoint:** `GET /api/versions`  
**Auth:** Not required

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "version": "1.1.0",
      "description": "New features added",
      "released_at": "2025-11-09 14:42:00",
      "created_at": "2025-11-09 14:42:00",
      "updated_at": "2025-11-09 14:42:00"
    },
    {
      "id": 2,
      "version": "1.0.1",
      "description": "Bug fixes and improvements",
      "released_at": "2025-11-09 14:42:00",
      "created_at": "2025-11-09 14:42:00",
      "updated_at": "2025-11-09 14:42:00"
    }
  ],
  "count": 3,
  "meta": {
    "duration": 0.123,
    "rows_read": 3,
    "rows_written": 0
  }
}
```

#### 2. Get Latest Version
Получить последнюю версию приложения.

**Endpoint:** `GET /api/versions/latest`  
**Auth:** Not required

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "version": "1.1.0",
    "description": "New features added",
    "released_at": "2025-11-09 14:42:00",
    "created_at": "2025-11-09 14:42:00",
    "updated_at": "2025-11-09 14:42:00"
  }
}
```

#### 3. Get Specific Version
Получить информацию о конкретной версии по номеру версии.

**Endpoint:** `GET /api/versions/{version}`  
**Auth:** Not required  
**Example:** `GET /api/versions/1.0.0`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "version": "1.0.0",
    "description": "Initial release",
    "released_at": "2025-11-09 14:42:00",
    "created_at": "2025-11-09 14:42:00",
    "updated_at": "2025-11-09 14:42:00"
  }
}
```

**Error Response (404):**
```json
{
  "error": "Version not found",
  "version": "2.0.0"
}
```

#### 4. Test Endpoint
Тестовый публичный endpoint.

**Endpoint:** `GET /api/test`  
**Auth:** Not required

**Response:**
```json
{
  "name": "Malik",
  "message": "Public endpoint - no auth required"
}
```

### Protected Endpoints (требуется авторизация)

Все защищенные endpoints требуют JWT токен в заголовке:
```
Authorization: Bearer <your_firebase_token>
```

#### 1. Get User Profile
Получить профиль текущего авторизованного пользователя.

**Endpoint:** `GET /api/profile`  
**Auth:** Required  
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "This is a protected endpoint",
  "user": {
    "uid": "user_firebase_uid",
    "email": "user@example.com",
    "email_verified": true
  }
}
```

**Error Response (401 - No token):**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

**Error Response (403 - Email not verified):**
```json
{
  "error": "Email not verified",
  "message": "Please verify your email address before accessing the application"
}
```

## Error Responses

### 404 Not Found
```json
{
  "error": "Not Found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "Detailed error message"
}
```

## CORS
Все эндпоинты поддерживают CORS с использованием middleware Hono:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

## Features

### Hono Framework
API использует [Hono](https://hono.dev/) - легкий и быстрый web-framework для edge computing:
- ✅ Автоматическая обработка CORS через middleware
- ✅ Централизованная обработка ошибок
- ✅ Типобезопасный routing с TypeScript
- ✅ Модульная структура роутов
- ✅ Простая интеграция с Cloudflare Workers

## Testing

### Using curl

#### Public Endpoints
```bash
# Get all versions
curl https://planer.m-k-mendykhan.workers.dev/api/versions

# Get latest version
curl https://planer.m-k-mendykhan.workers.dev/api/versions/latest

# Get specific version
curl https://planer.m-k-mendykhan.workers.dev/api/versions/1.0.0

# Test endpoint
curl https://planer.m-k-mendykhan.workers.dev/api/test
```

#### Protected Endpoints
```bash
# Get user profile (требуется токен)
curl -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  https://planer.m-k-mendykhan.workers.dev/api/profile
```

### Using JavaScript (fetch)

#### Public Endpoints
```javascript
// Get all versions
const versions = await fetch('https://planer.m-k-mendykhan.workers.dev/api/versions')
  .then(res => res.json());
console.log(versions);

// Get latest version
const latest = await fetch('https://planer.m-k-mendykhan.workers.dev/api/versions/latest')
  .then(res => res.json());
console.log(latest);
```

#### Protected Endpoints
```javascript
// Get user profile (с авторизацией)
const token = localStorage.getItem('firebaseToken');

const profile = await fetch('https://planer.m-k-mendykhan.workers.dev/api/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
}).then(res => res.json());
console.log(profile);
```

#### Using utility functions (рекомендуется)
```javascript
import { authenticatedFetch, getUserProfile } from './utils/api';

// Вариант 1: напрямую
const response = await authenticatedFetch('/api/profile');
const data = await response.json();

// Вариант 2: готовая функция
const profile = await getUserProfile();
```

## Development

### Start local server
```bash
npm run dev
```

### Apply migrations
```bash
# Local
npx wrangler d1 migrations apply planer-db --local

# Remote
npx wrangler d1 migrations apply planer-db --remote
```

### Deploy
```bash
npm run deploy
```

