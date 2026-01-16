# Deployment Guide

This guide covers deploying Peekaboo to both web (Vercel) and mobile platforms (EAS Build).

## Prerequisites

1. Install dependencies:
```bash
npm install -g eas-cli
npm install -g vercel
```

2. Set up accounts:
   - [Vercel Account](https://vercel.com/signup)
   - [Expo Account](https://expo.dev/signup)

## Web Deployment (Vercel)

### First-Time Setup

1. **Login to Vercel:**
```bash
vercel login
```

2. **Link project:**
```bash
vercel link
```

3. **Set environment variables in Vercel dashboard:**
   - Go to your project settings
   - Add `EXPO_PUBLIC_SUPABASE_URL`
   - Add `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Deploy to Production

```bash
# Build and deploy
vercel --prod
```

### Deploy Preview (for testing)

```bash
vercel
```

### Auto-Deploy from Git

Connect your GitHub/GitLab repository in Vercel dashboard for automatic deployments on push.

---

## Mobile Deployment (EAS Build)

### First-Time Setup

1. **Login to Expo:**
```bash
eas login
```

2. **Configure your project:**
```bash
eas build:configure
```

This creates `eas.json` (already included) and registers your project.

3. **Update `eas.json` with your project ID:**
   - Get your project ID from `expo.dev`
   - Update `app.config.js` → `extra.eas.projectId`

### iOS Setup

1. **Enroll in Apple Developer Program** ($99/year)

2. **Update `eas.json` submit.production.ios:**
   - `appleId`: Your Apple ID email
   - `ascAppId`: App Store Connect App ID
   - `appleTeamId`: Apple Team ID

3. **Build for iOS:**
```bash
# Development build (for testing)
eas build --platform ios --profile development

# Production build (for App Store)
eas build --platform ios --profile production
```

4. **Submit to App Store:**
```bash
eas submit --platform ios
```

### Android Setup

1. **Create Google Play Console account** ($25 one-time)

2. **Create service account:**
   - Go to Google Cloud Console
   - Create service account with Play Store permissions
   - Download JSON key file

3. **Update `eas.json` submit.production.android:**
   - `serviceAccountKeyPath`: Path to your JSON key file

4. **Build for Android:**
```bash
# Development build
eas build --platform android --profile development

# Production build (for Play Store)
eas build --platform android --profile production
```

5. **Submit to Play Store:**
```bash
eas submit --platform android
```

### Build Both Platforms

```bash
eas build --platform all --profile production
```

---

## Environment Variables

### For Vercel (Web)
Set in Vercel dashboard under Project Settings → Environment Variables:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### For EAS (Mobile)
Create `.env.production`:
```
EXPO_PUBLIC_SUPABASE_URL=your_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key
```

Add to `eas.json` build profiles:
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "from-eas-secret",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "from-eas-secret"
      }
    }
  }
}
```

Store secrets in EAS:
```bash
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value your_url
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value your_key
```

---

## Testing Builds

### Web (Local)
```bash
# Test web build locally
npx expo export -p web
npx serve dist
```

### iOS Simulator
```bash
eas build --platform ios --profile development
# Download and install on simulator
```

### Android Emulator
```bash
eas build --platform android --profile development
# Download and install on emulator
```

---

## Continuous Deployment

### Vercel
- Push to `main` branch → auto-deploys to production
- Push to other branches → creates preview deployments

### EAS Build (GitHub Actions Example)

Create `.github/workflows/eas-build.yml`:
```yaml
name: EAS Build
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm install -g eas-cli
      - run: eas build --platform all --non-interactive --no-wait
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

---

## Monitoring

### Vercel
- Dashboard: https://vercel.com/dashboard
- Logs and analytics available

### EAS
- Dashboard: https://expo.dev
- Build logs and distribution tracking

---

## Common Issues

### Vercel: Module not found
- Check `vercel.json` buildCommand
- Ensure all dependencies are in `dependencies` (not `devDependencies`)

### EAS: Build fails
- Check `eas.json` configuration
- Verify environment variables are set
- Review build logs in Expo dashboard

### Web: Bottom sheet doesn't work
- This is expected - the web version uses a modal fallback
- Native gestures don't translate perfectly to web

---

## Cost Overview

### Vercel
- **Free tier:** Unlimited personal projects
- **Pro:** $20/month for teams

### Expo EAS
- **Free:** 30 builds/month
- **Production:** $29-99/month for more builds

### App Stores
- **Apple:** $99/year developer account
- **Google Play:** $25 one-time registration
