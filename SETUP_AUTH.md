# Firebase Authentication Setup Guide

## Prerequisites
- Firebase account
- Cloudflare Workers account with KV namespace

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select existing project
3. Follow the setup wizard

## Step 2: Enable Email/Password Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click on **Email/Password**
3. Enable both "Email/Password" and "Email link (passwordless sign-in)" if needed
4. Click **Save**

## Step 3: Configure Email Verification

1. In Firebase Console, go to **Authentication** → **Templates**
2. Click on **Email address verification**
3. Customize the email template if needed
4. Set the action URL to: `https://planer.m-k-mendykhan.workers.dev/`

## Step 4: Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click on the **Web** icon (</>) to add a web app
4. Register your app with a nickname (e.g., "Planer Web")
5. Copy the configuration values

## Step 5: Setup Environment Variables

### For Local Development:

Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### For Cloudflare Workers:

1. Add to `wrangler.jsonc`:

```json
"vars": {
  "FIREBASE_PROJECT_ID": "your_project_id"
}
```

## Step 6: Create KV Namespace

1. Create a KV namespace in Cloudflare:

```bash
npx wrangler kv:namespace create "PUBLIC_JWK_CACHE_KV"
```

2. Copy the ID from the output
3. Update `wrangler.jsonc` with the KV namespace ID:

```json
"kv_namespaces": [
  {
    "binding": "PUBLIC_JWK_CACHE_KV",
    "id": "YOUR_KV_NAMESPACE_ID"
  }
]
```

4. Add the cache key to vars:

```json
"vars": {
  "FIREBASE_PROJECT_ID": "your_project_id",
  "PUBLIC_JWK_CACHE_KEY": "firebase-public-jwk"
}
```

## Step 7: Configure Authorized Domains

1. In Firebase Console, go to **Authentication** → **Settings** → **Authorized domains**
2. Add your domains:
   - `localhost` (for local development)
   - `planer.m-k-mendykhan.workers.dev` (your production domain)

## Step 8: Deploy

### Local Development:

```bash
npm run dev
```

### Production:

```bash
npm run deploy
```

## How It Works

### Frontend Flow:

1. User signs up with email/password
2. Firebase sends verification email
3. User clicks verification link in email
4. User is redirected to `https://planer.m-k-mendykhan.workers.dev/`
5. App checks email verification status
6. If verified, user gets full access

### Backend Flow:

1. Frontend sends requests with `Authorization: Bearer <token>` header
2. Cloudflare Worker verifies JWT token using Firebase public keys
3. Checks if email is verified
4. If valid and verified, allows access to protected routes
5. If not valid or not verified, returns 401/403 error

## API Endpoints

### Public Endpoints:
- `GET /health` - Health check
- `POST /api/auth/verify` - Verify token
- `GET /api/auth/email-status` - Check email verification status

### Protected Endpoints:
- `GET /api/auth/me` - Get current user (requires verified email)
- `GET /api/versions` - Get app versions (requires verified email)
- `GET /api/test` - Test endpoint (requires verified email)

## Testing

1. Sign up with a test email
2. Check email inbox for verification link
3. Click verification link
4. Login to the app
5. You should see the main dashboard

## Troubleshooting

### "Invalid token" error:
- Check if Firebase configuration is correct
- Ensure token is being sent in Authorization header
- Check if token has expired (tokens expire after 1 hour)

### "Email not verified" error:
- Check spam folder for verification email
- Click "Resend Verification Email" button
- After verifying, click "I've Verified My Email" button

### KV namespace errors:
- Ensure KV namespace is created and bound correctly
- Check wrangler.jsonc configuration
- Verify KV namespace ID matches

### CORS errors:
- Check if your domain is in Firebase authorized domains
- Ensure CORS is configured correctly in worker/index.ts

## Security Notes

- Never commit `.env` file to git
- Keep Firebase API keys secure
- Tokens are stored in localStorage on client side
- Tokens expire after 1 hour and are automatically refreshed
- Email verification is required for all protected routes

