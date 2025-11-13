# 📋 Инструкции по настройке авторизации

## ✅ Что было сделано

### Backend (Cloudflare Workers)
1. ✅ Настроена конфигурация Firebase Auth middleware
2. ✅ Созданы публичные и защищенные API маршруты
3. ✅ Добавлена проверка JWT токенов
4. ✅ Реализована проверка подтверждения email на уровне middleware
5. ✅ Настроено KV хранилище для кэширования публичных ключей Firebase

### Frontend (React + Material-UI)
1. ✅ Создан Firebase config с вашими credentials
2. ✅ Реализован Auth Context для управления состоянием
3. ✅ Созданы красивые формы Login и Register
4. ✅ Добавлена проверка email с автоматической отправкой письма
5. ✅ Реализован экран подтверждения email
6. ✅ JWT токены автоматически сохраняются в localStorage
7. ✅ Создана утилита для авторизованных API запросов

### Документация
1. ✅ AUTH_SETUP.md - полная документация по авторизации
2. ✅ QUICK_START_AUTH.md - быстрый старт
3. ✅ API.md - обновлена с информацией о защищенных endpoints
4. ✅ src/utils/api.ts - готовые функции для работы с API

## 🚀 Что нужно сделать перед деплоем

### ⚠️ ВАЖНО: Создайте KV Namespace

```bash
npx wrangler kv:namespace create PUBLIC_JWK_CACHE_KV
```

Вы получите что-то вроде:
```
{ binding = "PUBLIC_JWK_CACHE_KV", id = "abc123def456" }
```

### ⚠️ ВАЖНО: Обновите wrangler.jsonc

Откройте `wrangler.jsonc` и замените `YOUR_KV_ID_HERE` на полученный ID:

```jsonc
"kv_namespaces": [
  {
    "binding": "PUBLIC_JWK_CACHE_KV",
    "id": "abc123def456"  // ← Ваш реальный ID
  }
]
```

### Настройте Firebase Console

1. Откройте https://console.firebase.google.com/project/planer-246d3/authentication
2. В разделе **Sign-in method**:
   - Включите **Email/Password**
3. В разделе **Settings** → **Authorized domains**:
   - Убедитесь, что добавлен `planer.m-k-mendykhan.workers.dev`
4. В разделе **Templates** → **Email address verification**:
   - Проверьте, что URL в шаблоне: `https://planer.m-k-mendykhan.workers.dev/`

## 🎯 Деплой

```bash
npm run deploy
```

## 🧪 Тестирование

### После деплоя:

1. Откройте https://planer.m-k-mendykhan.workers.dev/
2. Нажмите "Sign up"
3. Зарегистрируйтесь с реальным email
4. Проверьте почту и подтвердите email
5. Вернитесь на сайт и войдите

### Тест API:

**Публичный endpoint (работает без токена):**
```bash
curl https://planer.m-k-mendykhan.workers.dev/api/test
```

**Защищенный endpoint (требуется токен):**
```bash
# Получите токен из localStorage в браузере:
# localStorage.getItem('firebaseToken')

curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://planer.m-k-mendykhan.workers.dev/api/profile
```

## 📚 Структура проекта

```
planer/
├── worker/                         # Backend (Cloudflare Workers)
│   ├── index.ts                   # Main worker с маршрутами
│   ├── types.ts                   # TypeScript типы
│   ├── middleware/
│   │   ├── index.ts              # Экспорты middleware
│   │   └── auth.ts               # Firebase Auth middleware
│   └── routes/
│       └── versions.ts           # API версий
│
├── src/                           # Frontend (React)
│   ├── App.tsx                   # Main app с защитой маршрутов
│   ├── main.tsx                  # Entry point с AuthProvider
│   ├── config/
│   │   └── firebase.ts          # Firebase конфигурация
│   ├── contexts/
│   │   └── AuthContext.tsx      # Auth контекст
│   ├── components/
│   │   ├── Login.tsx            # Форма входа
│   │   └── Register.tsx         # Форма регистрации
│   └── utils/
│       └── api.ts               # API утилиты
│
├── wrangler.jsonc                # Cloudflare Workers config
├── AUTH_SETUP.md                 # Полная документация
├── QUICK_START_AUTH.md           # Быстрый старт
└── API.md                        # API документация
```

## 🔐 Как работает авторизация

### Поток регистрации:
```
Пользователь → Register Form → Firebase Auth
                    ↓
              Email отправлен
                    ↓
              User logout
                    ↓
    Пользователь кликает ссылку в email
                    ↓
          Email подтвержден
                    ↓
    Редирект на planer.m-k-mendykhan.workers.dev
                    ↓
              Login Form
                    ↓
            Доступ к приложению
```

### Поток API запроса:
```
Frontend → getIdToken() → localStorage
              ↓
        Fetch с Bearer token
              ↓
        Backend Middleware
              ↓
     Проверка JWT + email_verified
              ↓
         API Response
```

## 📖 Использование в коде

### Получить данные пользователя:

```typescript
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { user } = useAuth();
  
  return (
    <div>
      <p>Email: {user?.email}</p>
      <p>Verified: {user?.emailVerified ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

### Сделать авторизованный запрос:

```typescript
import { authenticatedFetch } from './utils/api';

async function fetchUserData() {
  const response = await authenticatedFetch('/api/profile');
  const data = await response.json();
  console.log(data);
}
```

### Выйти из системы:

```typescript
import { useAuth } from './contexts/AuthContext';

function LogoutButton() {
  const { signOut } = useAuth();
  
  return (
    <button onClick={signOut}>
      Sign Out
    </button>
  );
}
```

## 🔧 Добавление своих защищенных endpoints

В `worker/index.ts`:

```typescript
// Добавьте свой защищенный маршрут
protectedApi.get('/my-endpoint', async (c) => {
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  // Ваша логика здесь
  return c.json({
    message: 'Success',
    userId: user.uid,
  });
});
```

## ❓ Возможные проблемы

### Проблема: Ошибка при деплое связанная с KV

**Решение:** 
```bash
# Удалите старый namespace если есть
npx wrangler kv:namespace delete --namespace-id=OLD_ID

# Создайте новый
npx wrangler kv:namespace create PUBLIC_JWK_CACHE_KV

# Обновите ID в wrangler.jsonc
```

### Проблема: Email verification не работает

**Проверьте:**
1. В Firebase Console → Authentication → Templates проверьте URL
2. Убедитесь, что домен в Authorized domains
3. Попробуйте Resend Verification Email

### Проблема: Token expired

**Решение:**
- Выйдите и войдите заново
- Токены автоматически обновляются через `getIdToken(true)`

## 📞 Дополнительная помощь

- **Полная документация:** [AUTH_SETUP.md](./AUTH_SETUP.md)
- **Быстрый старт:** [QUICK_START_AUTH.md](./QUICK_START_AUTH.md)
- **API документация:** [API.md](./API.md)
- **Firebase Docs:** https://firebase.google.com/docs/auth
- **Hono Firebase Auth:** https://github.com/honojs/middleware/tree/main/packages/firebase-auth

---

**Готово к деплою! 🎉**

Не забудьте:
1. ✅ Создать KV namespace
2. ✅ Обновить ID в wrangler.jsonc
3. ✅ Настроить Firebase Console
4. ✅ Запустить `npm run deploy`

