# Peekaboo 👶

A React Native baby activity tracker with dead-simple one-tap logging, partner sync, and activity insights.

## Features

- **One-Tap Logging:** Quick activity logging for feeding, diapers, sleep, pumping, and growth
- **Partner Sync:** Real-time sync across devices via Supabase
- **Activity Timeline:** Chronological history with easy review
- **Statistics:** Daily and weekly insights on baby's patterns
- **Cross-Platform:** Native iOS, Android, and Web support

## Tech Stack

- **Frontend:** React Native (Expo), TypeScript
- **Backend:** Supabase (PostgreSQL, Real-time, Auth)
- **State:** Zustand with AsyncStorage persistence
- **UI:** React Navigation, Bottom Sheet
- **Deployment:** Vercel (Web), EAS Build (Mobile)

## Getting Started

### Quick Status Check

**First time here? Check your progress:**
```bash
./check-status.sh
```

**See what's next:**
```bash
cat STATUS.md
```

**Read the quick start guide:**
```bash
cat QUICK-START.md
```

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app (for mobile testing)

### Installation

⚠️ **Project not yet initialized!** Follow these steps:

1. **Check current status:**
   ```bash
   ./check-status.sh
   ```

2. **Initialize Expo project:**
   ```bash
   npx create-expo-app@latest peekaboo --template expo-template-blank-typescript
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

5. **Start development:**
   ```bash
   npx expo start
   ```

For detailed step-by-step instructions, see **SETUP-CHECKLIST.md**

### Development

```bash
# Start on iOS
npx expo start --ios

# Start on Android
npx expo start --android

# Start on Web
npx expo start --web

# Run tests
npx jest
```

## Deployment

### Web (Vercel)

The app includes a web version that can be deployed to Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Note:** The web version uses Modal fallbacks for native components like BottomSheet. Full native experience requires mobile apps.

### Mobile (EAS Build)

Build native apps for iOS and Android:

```bash
# Install EAS CLI
npm i -g eas-cli

# Login
eas login

# Build
eas build --platform all --profile production
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Project Structure

```
peekaboo/
├── src/
│   ├── components/     # Reusable UI components
│   ├── screens/        # Screen components
│   ├── stores/         # Zustand state stores
│   ├── lib/            # Services and utilities
│   ├── types/          # TypeScript definitions
│   └── constants/      # App constants
├── specs/              # Implementation plan
├── app.config.js       # Expo configuration
├── eas.json           # EAS Build configuration
└── vercel.json        # Vercel deployment config
```

## Environment Variables

Create a `.env` file:

```
EXPO_PUBLIC_SUPABASE_URL=your_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Documentation

### Progress Tracking
- [QUICK-START.md](./QUICK-START.md) - How to use the tracking system
- [STATUS.md](./STATUS.md) - Current project status and next steps
- [SETUP-CHECKLIST.md](./SETUP-CHECKLIST.md) - Step-by-step checklist
- `check-status.sh` - Automated status checker script

### Development & Deployment
- [CLAUDE.md](./CLAUDE.md) - Developer guidance for Claude Code
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Detailed deployment guide
- [Implementation Plan](./specs/implementation-plan-v1.md) - Full implementation spec

## Contributing

See implementation plan in `specs/` directory for development roadmap and TDD workflow.

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
