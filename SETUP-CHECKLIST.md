# Peekaboo Setup Checklist

Track your progress setting up and deploying Peekaboo.

## 📋 Project Initialization

- [ ] **Task 1: Initialize Expo Project**
  ```bash
  npx create-expo-app@latest peekaboo --template expo-template-blank-typescript
  cd peekaboo
  npx expo start
  ```
  - [ ] Verify Metro bundler starts
  - [ ] Test app loads with QR code
  - [ ] Commit: `git init && git add . && git commit -m "chore: initialize expo project"`

- [ ] **Task 2: Install Core Dependencies**
  ```bash
  npx expo install @react-navigation/native @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context
  npx expo install @supabase/supabase-js react-native-url-polyfill
  npx expo install zustand @react-native-async-storage/async-storage date-fns
  npx expo install @gorhom/bottom-sheet react-native-reanimated react-native-gesture-handler
  ```
  - [ ] All dependencies installed
  - [ ] Commit: `git add . && git commit -m "chore: install core dependencies"`

- [ ] **Task 3: Configure Babel and TypeScript**
  - [ ] Update `babel.config.js` with reanimated plugin
  - [ ] Update `tsconfig.json` with path aliases (`@/*`)
  - [ ] Commit: `git add . && git commit -m "chore: configure babel and typescript"`

- [ ] **Task 4: Create Project Structure**
  - [ ] Create directories: `src/{components,screens,hooks,stores,types,lib,constants}`
  - [ ] Create `src/types/index.ts` with Activity types
  - [ ] Create `src/constants/colors.ts`
  - [ ] Create `src/lib/supabase.ts` placeholder
  - [ ] Commit: `git add . && git commit -m "chore: create project structure and types"`

## 🗄️ Supabase Setup

- [ ] **Create Supabase Project**
  - [ ] Go to https://supabase.com
  - [ ] Create new project
  - [ ] Note project URL: `_________________________`
  - [ ] Note anon key: `_________________________`

- [ ] **Create Database Schema**
  - [ ] Open Supabase SQL Editor
  - [ ] Run schema SQL from `specs/implementation-plan-v1.md` (lines 1813-1889)
  - [ ] Verify tables created: `families`, `babies`, `activities`, `family_members`
  - [ ] Verify RLS policies enabled

- [ ] **Configure Environment Variables**
  - [ ] Create `.env` file in project root
  - [ ] Add `EXPO_PUBLIC_SUPABASE_URL=your_url`
  - [ ] Add `EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key`
  - [ ] Verify `.env` is in `.gitignore`

## 🏗️ Development

- [ ] **Phase 2: Build Core UI Components** (Tasks 5-7)
  - [ ] Task 5: ActivityButton component + tests
  - [ ] Task 6: QuickOptionsSheet component + tests
  - [ ] Task 7: LastActivityCard component + tests

- [ ] **Phase 3: Home Screen** (Tasks 8-9)
  - [ ] Task 8: Activity store with Zustand + tests
  - [ ] Task 9: HomeScreen implementation
  - [ ] Test: Tap buttons, log activities, verify persistence

- [ ] **Phase 4: Timeline Screen** (Tasks 10-12)
  - [ ] Task 10: TimelineItem component
  - [ ] Task 11: TimelineScreen implementation
  - [ ] Task 12: Add tab navigation

- [ ] **Phase 5: Stats Screen** (Task 13)
  - [ ] Task 13: StatsScreen with daily/weekly stats
  - [ ] Verify calculations work correctly

- [ ] **Phase 6: Supabase Integration** (Tasks 14-15)
  - [ ] Task 14: Supabase project setup (see above)
  - [ ] Task 15: Sync service implementation
  - [ ] Test real-time sync between devices

## 🌐 Web Deployment (Vercel)

- [ ] **Install Vercel CLI**
  ```bash
  npm install -g vercel
  ```

- [ ] **Create Vercel Account**
  - [ ] Sign up at https://vercel.com/signup
  - [ ] Login: `vercel login`

- [ ] **Link Project**
  ```bash
  vercel link
  ```
  - [ ] Note Vercel org ID: `_________________________`
  - [ ] Note Vercel project ID: `_________________________`

- [ ] **Set Environment Variables in Vercel**
  - [ ] Go to Vercel project settings
  - [ ] Add `EXPO_PUBLIC_SUPABASE_URL`
  - [ ] Add `EXPO_PUBLIC_SUPABASE_ANON_KEY`

- [ ] **Test Web Build Locally**
  ```bash
  npx expo export -p web
  npx serve dist
  ```
  - [ ] Web version loads correctly
  - [ ] Modal fallback works for bottom sheet
  - [ ] All features functional

- [ ] **Deploy to Vercel**
  ```bash
  vercel --prod
  ```
  - [ ] Deployment successful
  - [ ] Note live URL: `_________________________`
  - [ ] Test deployed site

- [ ] **Optional: Connect GitHub for Auto-Deploy**
  - [ ] Push code to GitHub
  - [ ] Import project in Vercel dashboard
  - [ ] Configure auto-deploy on push to `main`

## 📱 Mobile Deployment (EAS Build)

- [ ] **Install EAS CLI**
  ```bash
  npm install -g eas-cli
  ```

- [ ] **Create Expo Account**
  - [ ] Sign up at https://expo.dev/signup
  - [ ] Login: `eas login`

- [ ] **Configure EAS Project**
  ```bash
  eas build:configure
  ```
  - [ ] Project registered with EAS
  - [ ] Note EAS project ID: `_________________________`
  - [ ] Update `app.config.js` with project ID

- [ ] **Set EAS Secrets**
  ```bash
  eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value your_url
  eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value your_key
  ```

### iOS Deployment

- [ ] **Apple Developer Setup**
  - [ ] Enroll in Apple Developer Program ($99/year)
  - [ ] Note Apple ID: `_________________________`
  - [ ] Note Team ID: `_________________________`

- [ ] **Build iOS App**
  ```bash
  eas build --platform ios --profile production
  ```
  - [ ] Build successful
  - [ ] Download IPA file
  - [ ] Test on device

- [ ] **App Store Connect Setup**
  - [ ] Create app in App Store Connect
  - [ ] Note ASC App ID: `_________________________`
  - [ ] Update `eas.json` with credentials

- [ ] **Submit to App Store**
  ```bash
  eas submit --platform ios
  ```
  - [ ] App submitted
  - [ ] Fill out App Store listing
  - [ ] Submit for review

### Android Deployment

- [ ] **Google Play Console Setup**
  - [ ] Create Google Play Console account ($25 one-time)
  - [ ] Create service account in Google Cloud
  - [ ] Download service account JSON key
  - [ ] Save key to: `./google-play-service-account.json`

- [ ] **Build Android App**
  ```bash
  eas build --platform android --profile production
  ```
  - [ ] Build successful
  - [ ] Download AAB file
  - [ ] Test on device

- [ ] **Update EAS Configuration**
  - [ ] Update `eas.json` with service account path
  - [ ] Verify configuration

- [ ] **Submit to Play Store**
  ```bash
  eas submit --platform android
  ```
  - [ ] App submitted
  - [ ] Fill out Play Store listing
  - [ ] Submit for review

## 🤖 CI/CD Setup (Optional)

- [ ] **GitHub Actions**
  - [ ] Rename `.github/workflows/deploy.yml.template` to `deploy.yml`
  - [ ] Add GitHub secrets:
    - [ ] `EXPO_PUBLIC_SUPABASE_URL`
    - [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY`
    - [ ] `VERCEL_TOKEN`
    - [ ] `VERCEL_ORG_ID`
    - [ ] `VERCEL_PROJECT_ID`
    - [ ] `EXPO_TOKEN`
  - [ ] Push to GitHub
  - [ ] Verify workflow runs

## ✅ Final Checks

- [ ] **Web Version**
  - [ ] Live at: `_________________________`
  - [ ] All features working
  - [ ] Environment variables set

- [ ] **iOS App**
  - [ ] Status: `_________________________`
  - [ ] TestFlight available
  - [ ] App Store listing complete

- [ ] **Android App**
  - [ ] Status: `_________________________`
  - [ ] Internal testing available
  - [ ] Play Store listing complete

- [ ] **Documentation**
  - [ ] README.md updated with live URLs
  - [ ] DEPLOYMENT.md reviewed
  - [ ] CLAUDE.md accurate

## 📝 Notes

Use this space to track issues, decisions, or important information:

```
[Your notes here]
```

---

**Last Updated:** [Date]
**Project Status:** [Not Started / In Progress / Deployed]
