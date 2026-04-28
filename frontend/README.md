# Art Memory Frontend

This folder contains the Expo + React Native mobile client for Art Memory. It uses Expo Router for navigation, Axios and TanStack Query for backend data, MMKV for token storage, and feature folders for the main app screens.

For the full project overview, backend setup, screenshots, and API route map, use the root `README.md`.

## Structure

- `src/app` defines the Expo Router route tree.
- `src/features` contains screens for home, scanning, artworks, collections, discover, profile, settings, auth, and onboarding.
- `src/lib/api` contains the typed Axios client and API service wrappers.
- `src/lib/hooks` contains the React Query hooks used by screens.
- `src/components/ui` contains shared UI primitives.
- `src/translations` contains i18next resources.

## Environment

Create `frontend/.env` before running the app:

```env
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_API_URL=http://localhost:8080

EXPO_PUBLIC_GOOGLE_MAPS_KEY=your-google-maps-key
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
APP_BUILD_ONLY_VAR=
```

If you test on a physical device, use your computer's LAN IP for `EXPO_PUBLIC_API_URL`, for example `http://192.168.x.x:8080`.

## Commands

```bash
pnpm install
pnpm start
pnpm ios
pnpm android
pnpm web
pnpm lint
pnpm type-check
pnpm test
pnpm test:ci
pnpm e2e-test
```

## Builds

`app.config.ts` reads values from `env.ts` and configures the app name, scheme, bundle IDs, package IDs, icons, splash screen, permissions, and EAS metadata.

EAS profiles live in `eas.json` for development, preview, production, simulator, and iOS simulator builds.
