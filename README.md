# Planer

Приложение-планировщик, построенное на React + TypeScript + Vite с поддержкой Android (через Capacitor) и развертывания на Cloudflare Workers.

## Технологии

- **React 19.1** - UI библиотека
- **TypeScript 5.8** - типизация
- **Vite 7.1** - сборщик и dev-сервер
- **Capacitor 7.4** - кросс-платформенная разработка для Android
- **Cloudflare Workers** - бессерверное развертывание
- **ESLint** - линтинг кода

## Установка

```bash
npm install
```

## Разработка

### Веб-разработка

```bash
npm run dev
```

Запускает dev-сервер на `http://localhost:5173`

### Android разработка

```bash
# Сборка и открытие проекта в Android Studio
npm run cap:android

# Сборка и запуск на устройстве/эмуляторе
npm run cap:run:android

# Синхронизация изменений с Android проектом
npm run cap:sync
```

## Сборка

### Веб-версия

```bash
npm run build
```

Создает production сборку в директории `dist/`

### Android версия

```bash
npm run cap:build
```

Создает сборку для Capacitor и синхронизирует с Android проектом

## Развертывание

### Cloudflare Workers

```bash
npm run deploy
```

Собирает и разворачивает приложение на Cloudflare Workers

## Скрипты

- `npm run dev` - запуск dev-сервера
- `npm run build` - сборка production версии
- `npm run lint` - проверка кода линтером
- `npm run preview` - предпросмотр production сборки
- `npm run deploy` - развертывание на Cloudflare Workers
- `npm run cf-typegen` - генерация типов для Cloudflare Workers
- `npm run cap:build` - сборка для Capacitor
- `npm run cap:android` - открыть Android проект
- `npm run cap:run:android` - запустить на Android
- `npm run cap:sync` - синхронизация с Capacitor

## Структура проекта

```
planer/
├── android/              # Android проект (Capacitor)
├── dist/                 # Production сборка
├── public/               # Статические файлы
├── src/                  # Исходный код
│   ├── App.tsx          # Главный компонент
│   ├── main.tsx         # Точка входа
│   └── assets/          # Ресурсы
├── worker/              # Cloudflare Workers код
├── capacitor.config.ts  # Конфигурация Capacitor
├── vite.config.ts       # Конфигурация Vite
└── vite.capacitor.config.ts  # Vite конфиг для Capacitor

```

## Требования

- Node.js 18+
- npm или yarn
- Android Studio (для Android разработки)
- JDK 17+ (для Android сборки)
