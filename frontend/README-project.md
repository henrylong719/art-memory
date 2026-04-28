# Art Memory Frontend

This folder contains the Expo + React Native mobile client for Art Memory. The app talks to the Express backend through the Axios client in `src/lib/api`, stores auth tokens in MMKV, and uses Expo Router for all screens.

For the full project overview, backend setup, API route map, and screenshots, use the root `README.md`.

## App Areas

- `src/app` defines the route tree with tabs, auth screens, scan routes, profile/settings screens, artwork detail routes, collection details, and discover pages.
- `src/features` contains the actual screen implementations for home, scan, artworks, collections, discover, profile, settings, auth, onboarding, and the remaining starter/demo feed screens.
- `src/lib/api` contains the typed Axios API client and service wrappers for auth, users, artists, artworks, scans, collections, saved artworks, museums, and uploads.
- `src/lib/hooks` wraps TanStack Query mutations and queries for the app screens.
- `src/components/ui` contains shared UI primitives and tests.
- `src/translations` contains i18next resources.

## Environment

Create `frontend/.env` before running the app:

```env
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_API_URL=http://localhost:8080

EXPO_PUBLIC_VAR_NUMBER=0
EXPO_PUBLIC_VAR_BOOL=false

EXPO_PUBLIC_GOOGLE_MAPS_KEY=your-google-maps-key
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id

APP_BUILD_ONLY_VAR=
```

Use your computer's LAN IP instead of `localhost` when testing against a local backend from a physical device.

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

## Build Notes

`app.config.ts` reads values from `env.ts` and configures the app name, scheme, bundle IDs, package IDs, icons, splash screen, permissions, and EAS project metadata.

EAS profiles live in `eas.json` for development, preview, production, simulator, and iOS simulator builds.
