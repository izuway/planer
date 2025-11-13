# Команды для настройки проекта

## 1. Создание KV Namespace

### Локальная разработка (preview):
```bash
npx wrangler kv:namespace create "PUBLIC_JWK_CACHE_KV" --preview
```

### Продакшн:
```bash
npx wrangler kv:namespace create "PUBLIC_JWK_CACHE_KV"
```

После выполнения команд вы получите ID, которые нужно добавить в `wrangler.jsonc`:

```json
"kv_namespaces": [
  {
    "binding": "PUBLIC_JWK_CACHE_KV",
    "id": "замените_на_production_id",
    "preview_id": "замените_на_preview_id"
  }
]
```

## 2. Установка зависимостей

```bash
npm install
```

## 3. Локальная разработка

```bash
npm run dev
```

Откройте браузер на http://localhost:5173

## 4. Деплой в продакшн

```bash
npm run deploy
```

## 5. Просмотр логов Worker

```bash
npx wrangler tail
```

## 6. Проверка KV namespace

```bash
# Список всех namespaces
npx wrangler kv:namespace list

# Просмотр ключей в namespace
npx wrangler kv:key list --namespace-id=ваш_namespace_id
```

## 7. Обновление конфигурации Worker

```bash
# Генерация типов для Worker
npm run cf-typegen
```

## 8. Сборка проекта

```bash
# Только сборка без деплоя
npm run build
```

## 9. Capacitor (мобильные приложения)

```bash
# Сборка для Android
npm run cap:build

# Открыть Android Studio
npm run cap:android

# Запустить на Android устройстве
npm run cap:run:android
```

## Переменные окружения

### Локальная разработка (.env):

```env
VITE_FIREBASE_API_KEY=ваш_api_key
VITE_FIREBASE_AUTH_DOMAIN=ваш_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ваш_project_id
VITE_FIREBASE_STORAGE_BUCKET=ваш_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=ваш_messaging_sender_id
VITE_FIREBASE_APP_ID=ваш_app_id
```

### Cloudflare Worker (wrangler.jsonc):

```json
"vars": {
  "FIREBASE_PROJECT_ID": "ваш_project_id",
  "PUBLIC_JWK_CACHE_KEY": "firebase-public-jwk"
}
```

## Полезные ссылки

- [Firebase Console](https://console.firebase.google.com/)
- [Cloudflare Dashboard](https://dash.cloudflare.com/)
- [Wrangler Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Hono Docs](https://hono.dev/)
- [Firebase Auth Docs](https://firebase.google.com/docs/auth)

