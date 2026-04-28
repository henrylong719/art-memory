# Art Memory

Art Memory is a full-stack mobile app for museum and gallery visits. The Expo app lets users scan artworks, identify them with AI, save pieces into personal collections, generate art-historical stories, and discover nearby museums.

## App Preview

<table align="center" cellspacing="0" cellpadding="4">
  <tr>
    <th align="center">Home</th>
    <th align="center">Scan</th>
    <th align="center">Story</th>
  </tr>
  <tr>
    <td align="center"><img src="./docs/screenshots/home.png" width="240" alt="Home screen" /></td>
    <td align="center"><img src="./docs/screenshots/scan.png" width="240" alt="Artwork scan screen" /></td>
    <td align="center"><img src="./docs/screenshots/generate_story.png" width="240" alt="Generate story screen" /></td>
  </tr>
</table>

<table align="center" cellspacing="0" cellpadding="4">
  <tr>
    <th align="center">Gallery</th>
    <th align="center">Collections</th>
    <th align="center">Profile</th>
  </tr>
  <tr>
    <td align="center"><img src="./docs/screenshots/artworks.png" width="240" alt="Artwork gallery screen" /></td>
    <td align="center"><img src="./docs/screenshots/collections.png" width="240" alt="Collections screen" /></td>
    <td align="center"><img src="./docs/screenshots/profile.png" width="240" alt="Profile screen" /></td>
  </tr>
</table>

## Repository Layout

```text
ArtMemory/
+-- README.md
+-- docs/screenshots/          # App screenshots used in this README
+-- backend/                   # Express API, Prisma schema, Docker config
|   +-- prisma/
|   +-- src/
|   |   +-- api/               # Feature routers, controllers, services
|   |   +-- api-docs/          # OpenAPI and Swagger UI
|   |   +-- common/            # Middleware, env, db, OpenAI, S3, Google Places
|   |   +-- index.ts
|   |   +-- server.ts
|   +-- .env.template
+-- frontend/                  # Expo + React Native mobile app
    +-- src/
    |   +-- app/               # Expo Router routes
    |   +-- components/ui/     # Shared UI components
    |   +-- features/          # Feature screens and flows
    |   +-- lib/               # API client, hooks, auth, storage, i18n
    |   +-- translations/
    +-- app.config.ts
    +-- eas.json
    +-- env.ts
    +-- package.json
```

There is no root package workspace. Install and run `backend/` and `frontend/` separately.

## Product Surface

- AI artwork scanning with two modes: artwork-only image upload and combined artwork plus museum-label upload.
- Scan history with confidence, raw AI output, extracted label text, location context, and user corrections.
- Personal collections with saved artworks, notes, ratings, user photos, and manual metadata overrides.
- Artwork, artist, museum, saved-artwork, and collection browsing through the backend API.
- AI-generated artwork stories, limited by subscription plan.
- Nearby museum discovery through Google Places and static map previews in the mobile app.
- Email/password auth, social login endpoint support, JWT access/refresh tokens, logout-all, password changes, and profile editing.

## Tech Stack

**Frontend**

- Expo SDK 54, React Native 0.81, React 19, Expo Router 6
- TypeScript, UniWind/Tailwind-style utility classes, shared UI primitives
- TanStack Query, Axios, Zustand, MMKV, i18next
- Expo Camera, Image, Image Picker, Location, Auth Session, Web Browser
- Reanimated, Moti, Legend Motion, FlashList
- Jest, React Native Testing Library, Maestro, EAS

**Backend**

- Node.js 23, Express 5, TypeScript, Prisma 7, PostgreSQL
- OpenAI SDK, AWS S3 uploads, Google Places integration
- JWT, bcrypt, Zod request/env validation
- OpenAPI/Swagger UI, Pino logging, Helmet, CORS, rate limiting
- Vitest, Supertest, Biome, Docker/Railway-friendly entrypoint

## Backend API

The server mounts public health/auth routes and protects the app data routes with bearer-token authentication.

**Public routes**

- `GET /health-check`
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/social`
- `POST /auth/refresh`
- `POST /auth/logout`

**Authenticated routes**

- `POST /auth/change-password`
- `POST /auth/logout-all`
- `GET /users/me`
- `PATCH /users/me`
- `GET /artists`, `GET /artists/search`, `GET /artists/:id`, `POST /artists`, `PUT /artists/:id`, `DELETE /artists/:id`
- `GET /artworks`, `GET /artworks/search`, `GET /artworks/artist/:artistId`, `GET /artworks/:id`, `POST /artworks`, `PUT /artworks/:id`, `DELETE /artworks/:id`
- `POST /artworks/:id/generate-story`
- `GET /scans`, `GET /scans/:id`, `POST /scans/artwork`, `POST /scans/combined`, `PUT /scans/:id/correct`, `DELETE /scans/:id`
- `GET /collections`, `GET /collections/:id`, `POST /collections`, `PUT /collections/:id`, `DELETE /collections/:id`
- `GET /saved-artworks`, `GET /saved-artworks/collection/:collectionId`, `GET /saved-artworks/:id`, `POST /saved-artworks`, `PUT /saved-artworks/:id`, `DELETE /saved-artworks/:id`
- `GET /museums/nearby`, `GET /museums/search`, `GET /museums/place/:placeId`, `GET /museums/:id`
- `POST /uploads/image`

When the backend is running, Swagger UI is available at `http://localhost:8080/` and the OpenAPI JSON is available at `http://localhost:8080/swagger.json`.

## Data Model

The Prisma schema currently includes:

- `User`
- `RefreshToken`
- `Artist`
- `Artwork`
- `Scan`
- `Collection`
- `SavedArtwork`
- `Museum`
- `AiUsageLog`

The main enums are `Plan`, `ArtworkSource`, and `ScanType`. Prisma generates its client into `backend/generated/prisma` and the backend imports it through the `@generated` path alias.

## Getting Started

### Prerequisites

- Node.js 23.11.1 or compatible recent Node version
- pnpm 10
- PostgreSQL
- AWS S3 bucket and credentials
- OpenAI API key
- Google Places API key
- Expo/React Native local development setup for iOS or Android

### Backend

```bash
cd backend
pnpm install
cp .env.template .env
```

Fill in `backend/.env`, then generate Prisma and run migrations:

```bash
pnpm exec prisma generate
pnpm exec prisma migrate dev
pnpm run start:dev
```

The API runs on `http://localhost:8080` by default.

Required backend environment variables:

```env
NODE_ENV=development
HOST=localhost
PORT=8080
CORS_ORIGIN=http://localhost:8080,http://localhost:8081

COMMON_RATE_LIMIT_WINDOW_MS=900000
COMMON_RATE_LIMIT_MAX_REQUESTS=200

DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/artmemory

JWT_SECRET=replace-with-at-least-32-characters
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=artmemory-uploads

OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

GOOGLE_PLACES_API_KEY=your-google-places-api-key
```

### Frontend

```bash
cd frontend
pnpm install
```

Create or update `frontend/.env`:

```env
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_API_URL=http://localhost:8080

EXPO_PUBLIC_VAR_NUMBER=0
EXPO_PUBLIC_VAR_BOOL=false

# Used by static map image URLs.
EXPO_PUBLIC_GOOGLE_MAPS_KEY=your-google-maps-key

# Used by the Google social-login button when configured.
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id

# Optional build-time-only value read by app.config.ts.
APP_BUILD_ONLY_VAR=
```

If you test on a physical phone, set `EXPO_PUBLIC_API_URL` to your computer's LAN URL, for example `http://192.168.x.x:8080`, because `localhost` points at the phone.

Run the app:

```bash
pnpm start
pnpm ios
pnpm android
pnpm web
```

## Useful Commands

**Backend**

```bash
pnpm run start:dev
pnpm run build
pnpm run start:prod
pnpm run check
pnpm test
pnpm test:cov
pnpm exec prisma generate
pnpm exec prisma migrate dev
```

**Frontend**

```bash
pnpm start
pnpm ios
pnpm android
pnpm web
pnpm lint
pnpm type-check
pnpm test
pnpm test:ci
pnpm e2e-test
pnpm doctor
```

## Builds

The frontend uses EAS profiles in `frontend/eas.json`:

- `development`
- `preview`
- `production`
- `ios-simulator`
- `simulator`

The checked-in EAS config points development, preview, and production profiles at the deployed API URL `https://artmemory.up.railway.app`. Override `EXPO_PUBLIC_API_URL` locally when you want the app to talk to a local backend.

## Notes

- Most backend routes return a common `ServiceResponse` wrapper.
- Upload endpoints expect `multipart/form-data` and use S3 for image storage.
- The frontend Axios client refreshes JWT access tokens automatically and keeps tokens in MMKV.
- `frontend/cli` and `frontend/docs` are inherited Obytes starter packages and are not required for the main Art Memory app runtime.

## License

The frontend and backend each include their own `LICENSE` file.
