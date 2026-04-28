# Art Memory

Art Memory is a full-stack mobile app for museum and gallery visitors. It lets users scan artworks, identify them with AI, save them into personal collections, generate stories, and discover nearby museums.

---

## App Preview

<p align="center">
   <img src="./docs/screenshots/home.png" width="240" alt="Home screen" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="./docs/screenshots/scan.png" width="240" alt="Artwork scan screen" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="./docs/screenshots/generate_story.png" width="240" alt="Generate Story screen" />
</p>

<p align="center">
  <b>Home</b>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;  &nbsp;  &nbsp;  &nbsp; &nbsp;  &nbsp;  &nbsp; 
  <b>Scan Artwork</b>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; 
  <b>Artwork Detail</b>
</p>


<p align="center">
 <img src="./docs/screenshots/artworks.png" width="240" alt="Artwork gallery screen" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="./docs/screenshots/collections.png" width="240" alt="Collections screen" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="./docs/screenshots/profile.png" width="240" alt="Profile screen" />
</p>

<p align="center">
 <b>Artwork Gallery</b>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;  &nbsp;  &nbsp;  &nbsp; &nbsp;  &nbsp;  &nbsp; 
  <b>Collections</b>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; 
  <b>User Profile</b>
</p>

---

## Repository Structure


This repository contains:

- `frontend/` — Expo + React Native mobile app
- `backend/` — Express + TypeScript API

---

## What the app does

### Scan artworks with AI

Users can scan in two ways:

- **Artwork only**: upload a single artwork photo and let OpenAI identify it
- **Artwork + label**: upload both the artwork and its museum label for better extraction

Each scan is stored in scan history, including AI confidence, raw AI result, extracted text, and user corrections.

### Build a personal collection

Users can:

- create collections
- save artworks into collections
- add ratings, personal notes, and custom metadata
- upload personal artwork photos

### Browse art data

The backend supports browsing:

- artworks
- artists
- museums
- saved artworks
- user collections

### Generate artwork stories

Users can generate AI-written stories for artworks. Story generation is limited by plan:

- `FREE`: 3 per day
- `MONTHLY`: 20 per day
- `YEARLY`: 50 per day

### Discover nearby museums

The app can search museums by text or by nearby location using Google Places.

### Authentication and profile

The project includes:

- email/password authentication
- social login endpoint support
- JWT access/refresh token flow
- logout, logout-all, and change-password endpoints
- profile editing

---

## Tech stack

### Frontend

- Expo SDK 54
- React Native 0.81
- React 19
- Expo Router 6
- TypeScript
- NativeWind + Tailwind-style utilities
- Zustand
- TanStack Query
- Axios
- MMKV
- Reanimated + Moti
- Expo Camera / Expo Image / Expo Location
- Jest + React Native Testing Library
- Maestro for E2E

### Backend

- Node.js
- Express 5
- TypeScript
- Prisma 7
- PostgreSQL
- OpenAI SDK
- AWS S3
- JWT + bcrypt
- Zod
- Swagger / OpenAPI
- Pino
- Vitest + Supertest
- Biome

---

## Repository structure

```text
ArtMemory/
├── README.md
├── er-diagram.mermaid
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── api/
│   │   │   ├── artist/
│   │   │   ├── artwork/
│   │   │   ├── auth/
│   │   │   ├── collection/
│   │   │   ├── healthCheck/
│   │   │   ├── museum/
│   │   │   ├── savedArtwork/
│   │   │   ├── scan/
│   │   │   ├── upload/
│   │   │   └── user/
│   │   ├── api-docs/
│   │   ├── common/
│   │   ├── index.ts
│   │   └── server.ts
│   └── .env.template
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── (app)/
    │   │   ├── artworks/
    │   │   ├── collections/
    │   │   ├── discover/
    │   │   ├── profile/
    │   │   ├── scan/
    │   │   ├── login.tsx
    │   │   ├── sign-up.tsx
    │   │   └── onboarding.tsx
    │   ├── components/
    │   ├── features/
    │   └── lib/
    ├── app.config.ts
    ├── env.ts
    ├── eas.json
    └── package.json
```

---

## Backend API overview

### Public routes

- `GET /health-check`
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/social`
- `POST /auth/refresh`
- `POST /auth/logout`

### Authenticated routes

- `POST /auth/change-password`
- `POST /auth/logout-all`
- `GET /users/me`
- `PATCH /users/me`

### Artists

- `GET /artists`
- `GET /artists/search`
- `GET /artists/:id`
- `POST /artists`
- `PUT /artists/:id`
- `DELETE /artists/:id`

### Artworks

- `GET /artworks`
- `GET /artworks/search`
- `GET /artworks/artist/:artistId`
- `GET /artworks/:id`
- `POST /artworks`
- `PUT /artworks/:id`
- `DELETE /artworks/:id`
- `POST /artworks/:id/generate-story`

### Scans

- `GET /scans`
- `GET /scans/:id`
- `POST /scans/artwork`
- `POST /scans/combined`
- `PUT /scans/:id/correct`
- `DELETE /scans/:id`

### Collections

- `GET /collections`
- `GET /collections/:id`
- `POST /collections`
- `PUT /collections/:id`
- `DELETE /collections/:id`

### Saved artworks

- `GET /saved-artworks`
- `GET /saved-artworks/collection/:collectionId`
- `GET /saved-artworks/:id`
- `POST /saved-artworks`
- `PUT /saved-artworks/:id`
- `DELETE /saved-artworks/:id`

### Museums

- `GET /museums/nearby`
- `GET /museums/search`
- `GET /museums/place/:placeId`
- `GET /museums/:id`

### Uploads

- `POST /uploads/image`

When the backend is running, Swagger is available from the OpenAPI router.

---

## Database models

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

There are also enums for:

- `Plan`
- `ArtworkSource`
- `ScanType`

---

## Getting started

## 1) Prerequisites

Install these first:

- Node.js 22+
- pnpm
- PostgreSQL
- an AWS S3 bucket
- an OpenAI API key
- a Google Places API key

---

## 2) Run the backend

```bash
cd backend
pnpm install
cp .env.template .env
```

Fill in `.env` with your real values.

Then run:

```bash
pnpm prisma generate
pnpm prisma migrate dev
pnpm run start:dev
```

The backend runs on:

- `http://localhost:8080`

---

## 3) Run the frontend

Create a frontend `.env` file in `frontend/` with values like this:

```env
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_API_URL=http://localhost:8080
EXPO_PUBLIC_ASSOCIATED_DOMAIN=
EXPO_PUBLIC_VAR_NUMBER=0
EXPO_PUBLIC_VAR_BOOL=false
APP_BUILD_ONLY_VAR=
```

Then run:

```bash
cd frontend
pnpm install
pnpm start
```

Useful commands:

```bash
pnpm android
pnpm ios
pnpm web
pnpm test
pnpm lint
pnpm type-check
```

---

## Environment variables

### Backend

The backend validates environment variables with Zod.

Main variables:

```env
NODE_ENV=development
HOST=localhost
PORT=8080
CORS_ORIGIN=http://localhost:8080,http://localhost:8081

COMMON_RATE_LIMIT_MAX_REQUESTS=1000
COMMON_RATE_LIMIT_WINDOW_MS=1000

DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/artmemory

JWT_SECRET=your-secret-key-at-least-32-characters-long
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

The frontend uses `env.ts` to build environment-specific config.

Important variables:

```env
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_API_URL=http://localhost:8080
EXPO_PUBLIC_ASSOCIATED_DOMAIN=
EXPO_PUBLIC_VAR_NUMBER=0
EXPO_PUBLIC_VAR_BOOL=false
APP_BUILD_ONLY_VAR=
```

Notes:

- `EXPO_PUBLIC_APP_ENV` must be one of `development`, `preview`, or `production`
- `EXPO_PUBLIC_API_URL` must be a valid URL
- strict validation is enabled during some prebuild flows

---

## Build and release

The frontend includes EAS build profiles:

- `development`
- `preview`
- `production`
- `simulator`

Examples:

```bash
cd frontend
pnpm build:development:ios
pnpm build:development:android
pnpm build:preview:ios
pnpm build:preview:android
pnpm build:production:ios
pnpm build:production:android
```

---

## Testing

### Backend

```bash
cd backend
pnpm test
pnpm test:cov
```

### Frontend

```bash
cd frontend
pnpm test
pnpm test:ci
pnpm e2e-test
```

---

## Notes about the current codebase

A few details in the current repo are worth knowing:

- the frontend is based on an Obytes Expo starter and still includes some starter-style environment fields
- the frontend display name in config is currently `art_memory`
- the production bundle/package identifiers in `frontend/env.ts` still look like placeholder values and may need updating before release
- backend Prisma client output is configured to generate into `backend/generated/prisma`

---

## Future improvements

Good next README additions later could be:

- screenshots or app flow diagrams
- seed scripts for artwork and museum data
- deployment instructions for backend hosting
- sample API requests and responses
- architecture diagram for scan flow and story generation

---

## License

There are separate `LICENSE` files inside `frontend/` and `backend/`.
