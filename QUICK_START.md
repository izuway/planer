# Быстрый старт: Firebase Authentication

## 🚀 За 5 минут до запуска

### 1. Создайте Firebase проект

1. Откройте [Firebase Console](https://console.firebase.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите **Email/Password** в **Authentication** → **Sign-in method**
4. Скопируйте конфигурацию из **Project Settings**

### 2. Создайте `.env` файл

```bash
cp .env.example .env
```

Заполните значения из Firebase конфигурации:

```env
VITE_FIREBASE_API_KEY=ваш_api_key
VITE_FIREBASE_AUTH_DOMAIN=ваш_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ваш_project_id
VITE_FIREBASE_STORAGE_BUCKET=ваш_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=ваш_messaging_sender_id
VITE_FIREBASE_APP_ID=ваш_app_id
```

### 3. Обновите `wrangler.jsonc`

Замените `FIREBASE_PROJECT_ID` на ваш реальный:

```json
"vars": {
  "FIREBASE_PROJECT_ID": "ваш_project_id",
  ...
}
```

### 4. Создайте KV Namespace

**Для локальной разработки:**

```bash
npx wrangler kv:namespace create "PUBLIC_JWK_CACHE_KV" --preview
```

**Для продакшна:**

```bash
npx wrangler kv:namespace create "PUBLIC_JWK_CACHE_KV"
```

Обновите `wrangler.jsonc` с полученным ID:

```json
"kv_namespaces": [
  {
    "binding": "PUBLIC_JWK_CACHE_KV",
    "id": "ваш_kv_id",
    "preview_id": "ваш_preview_id"
  }
]
```

### 5. Запустите проект

**Локально:**

```bash
npm install
npm run dev
```

**Деплой:**

```bash
npm run deploy
```

## ✅ Проверка работы

1. Откройте http://localhost:5173
2. Нажмите "Sign up"
3. Введите email и пароль
4. Проверьте почту и кликните на ссылку верификации
5. Нажмите "I've Verified My Email"
6. Готово! 🎉

## 📝 Важные файлы

- `src/firebase.ts` - конфигурация Firebase
- `src/contexts/AuthContext.tsx` - контекст авторизации
- `src/components/Login.tsx` - компонент входа
- `src/components/Signup.tsx` - компонент регистрации
- `worker/index.ts` - backend с Firebase Auth
- `worker/middleware/index.ts` - middleware для защиты роутов

## 🔒 Что защищено

Все API endpoints под `/api/*` требуют:
1. ✅ Валидный JWT токен
2. ✅ Верифицированный email

## 🆘 Проблемы?

Смотрите [README_AUTH.md](./README_AUTH.md) для подробной инструкции.

---

**Все готово!** Теперь у вас есть полноценная авторизация! 🚀

