# Environment Variables Setup Guide

This guide explains how to set up environment variables for the SBS Draft Web frontend.

**Package manager:** Use **Yarn** (v1) for this project—`yarn install`, `yarn dev`, `yarn add …`—to match `yarn.lock` and avoid mixed lockfiles.

## Quick Start

1. **Copy the example file:**
   ```bash
   cd sbs-draft-web
   cp .env.example .env.local
   ```

2. **Fill in your values** in `.env.local` (see details below)

3. **Restart your dev server** if it's running:
   ```bash
   yarn dev
   ```

## Required Environment Variables

### 1. NEXT_PUBLIC_ENVIRONMENT
- **Values:** `"dev"` or `"prod"`
- **Purpose:** Determines which API endpoints and configurations to use
- **Example:** `NEXT_PUBLIC_ENVIRONMENT=dev`

### 2. NEXT_PUBLIC_THIRDWEB_CLIENT_ID ⚠️ **CRITICAL**
- **Required:** Yes (app will crash without this)
- **Purpose:** Thirdweb SDK client ID for wallet connections
- **How to get:**
  1. Go to https://thirdweb.com/dashboard
  2. Create or select a project
  3. Copy the Client ID from the project settings
- **Example:** `NEXT_PUBLIC_THIRDWEB_CLIENT_ID=abc123def456...`

### 3. NEXT_PUBLIC_WEB3AUTH_CLIENT_ID
- **Required:** Yes (for Web3Auth authentication)
- **Purpose:** Web3Auth client ID for social login
- **How to get:**
  1. Go to https://dashboard.web3auth.io/
  2. Create or select an application
  3. Copy the Client ID
- **Example:** `NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=BPi5PB_UYIZ2X...`

### 4. NEXT_PUBLIC_INFURA_KEY
- **Required:** Yes (for Ethereum RPC connections)
- **Purpose:** Infura API key for blockchain interactions
- **How to get:**
  1. Go to https://www.infura.io/
  2. Create an account and project
  3. Copy the API key (not the secret)
- **Example:** `NEXT_PUBLIC_INFURA_KEY=1234567890abcdef...`

### 5. Firebase Configuration (All Required)
These are all needed for Firebase Realtime Database:

- **NEXT_PUBLIC_FIREBASE_API_KEY**
- **NEXT_PUBLIC_AUTH_DOMAIN**
- **NEXT_PUBLIC_DATABASE_URL**
- **NEXT_PUBLIC_PROJECT_ID**
- **NEXT_PUBLIC_STORAGE_BUCKET**
- **NEXT_PUBLIC_MESSAGING_SENDER_ID**
- **NEXT_PUBLIC_APP_ID**
- **NEXT_PUBLIC_MEASUREMENT_ID** (optional, for Analytics)

**How to get:**
1. Go to https://console.firebase.google.com/
2. Create or select a project
3. Go to Project Settings → General
4. Scroll down to "Your apps" section
5. If you don't have a web app, click "Add app" → Web (</> icon)
6. Copy the configuration values from the `firebaseConfig` object

**Example:**
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_AUTH_DOMAIN=my-project.firebaseapp.com
NEXT_PUBLIC_DATABASE_URL=https://my-project-default-rtdb.firebaseio.com
NEXT_PUBLIC_PROJECT_ID=my-project
NEXT_PUBLIC_STORAGE_BUCKET=my-project.appspot.com
NEXT_PUBLIC_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_APP_ID=1:123456789012:web:abcdef
NEXT_PUBLIC_MEASUREMENT_ID=G-XXXXXXXXXX
```

## Optional Environment Variables

### NEXT_PUBLIC_TEST_MODE
- **Default:** Not set (false)
- **Values:** `"true"` or `"false"`
- **Purpose:** Enables test mode for development
- **Example:** `NEXT_PUBLIC_TEST_MODE=true`

### NEXT_PUBLIC_TEST_MODE_ADDRESS
- **Required when:** `NEXT_PUBLIC_TEST_MODE=true`
- **Purpose:** Wallet address to use in test mode
- **Example:** `NEXT_PUBLIC_TEST_MODE_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0`

## Using Vercel (Recommended)

If your project is linked to Vercel, you can pull environment variables:

```bash
# Link your project (if not already linked)
vercel link

# Pull environment variables from Vercel
vercel env pull .env.local
```

This will automatically create `.env.local` with all the variables from your Vercel project.

## File Locations

- **`.env.local`** - Your actual environment variables (DO NOT commit to git)
- **`.env.example`** - Template file (safe to commit)
- **`.gitignore`** - Should include `.env.local` and `.env*.local`

## Important Notes

1. **Never commit `.env.local`** to git - it contains secrets
2. **Restart the dev server** after changing environment variables
3. **All `NEXT_PUBLIC_*` variables** are exposed to the browser (don't put secrets here)
4. **The app will crash** if `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` is missing

## Troubleshooting

### Error: "NEXT_PUBLIC_THIRDWEB_CLIENT_ID is not set"
- Make sure `.env.local` exists in the `sbs-draft-web` directory
- Check that the variable name is exactly `NEXT_PUBLIC_THIRDWEB_CLIENT_ID`
- Restart your dev server after adding the variable

### Firebase errors
- Verify all Firebase variables are set correctly
- Check that your Firebase project has Realtime Database enabled
- Ensure the database URL format is correct: `https://PROJECT_ID-default-rtdb.firebaseio.com`

### Module not found errors (encoding, pino-pretty)
- These are optional dependencies and won't break functionality
- You can install them: `yarn add encoding` and `yarn add -D pino-pretty`

## Verification

After setting up your environment variables, verify they're loaded:

1. Start the dev server: `yarn dev`
2. Check the console for any missing variable errors
3. The app should load without the "clientId or secretKey must be provided" error
