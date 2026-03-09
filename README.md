# ArtMemory

> Your personal AI-powered museum companion. Scan artworks, extract label details, and build a curated archive of the art that moves you.

ArtMemory is a full-stack mobile application inspired by apps like [ArtScan AI](https://www.artscanai.com/). It helps museum visitors and art lovers identify artworks with AI, save them into personal collections, and discover nearby museums — all in one elegant, minimal app.

---

## Features

### AI Scanning — two modes
- **Artwork + Details** — photograph the artwork *and* the museum label. AI extracts the title, artist, year, and medium directly from the label text (no inference, just OCR), then builds a complete record.
- **Artwork Only** — photograph the artwork alone. OpenAI Vision identifies the piece and returns structured metadata with a confidence score.

### Collections & Archive
- Save any artwork into named personal collections
- Add personal notes, ratings, and custom metadata to saved pieces
- Browse all artworks stored in the system database

### Scan History
- Full chronological history of every scan
- Tap any scan to view the result or correct the AI's output

### Discover
- Find museums and galleries near you using Google Places
- View museum details, opening hours, and featured artworks

### Auth
- JWT-based authentication with access + refresh token rotation
- Secure token storage with react-native-mmkv

---

## Tech Stack

### Backend (`/backend`)

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js (ESM) |
| Framework | Express 5 |
| Language | TypeScript 5 + `tsup` |
| ORM | Prisma 7 + `@prisma/adapter-pg` (PostgreSQL) |
| AI | OpenAI SDK — Vision + Chat Completions (`gpt-4o`) |
| Storage | AWS S3 (artwork & label image uploads) |
| Auth | JWT (`jsonwebtoken`) + bcrypt |
| Validation | Zod + `@asteasolutions/zod-to-openapi` |
| API Docs | Swagger UI (auto-generated from Zod schemas) |
| Logging | Pino + pino-http |
| Maps | Google Places API |
| Testing | Vitest + Supertest |
| Linting | Biome 2 |

### Frontend (`/frontend`)

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 54 / React Native 0.81 / React 19 |
| Navigation | Expo Router 6 (file-system routing) |
| Language | TypeScript 5 |
| Styling | NativeWind (TailwindCSS for React Native) |
| State | Zustand 5 |
| Data Fetching | TanStack Query v5 + Axios |
| Storage | react-native-mmkv |
| Animations | Moti + React Native Reanimated 4 |
| Images | expo-image |
| Location | expo-location |
| Camera | expo-camera |
| Testing | Jest + React Testing Library / Maestro (E2E) |

---

## Project Structure

```
ArtMemory/
├── backend/               # Express API
│   ├── prisma/            # Schema + migrations
│   ├── src/
│   │   ├── api/           # Feature modules (auth, artwork, scan, collection, museum…)
│   │   │   └── <feature>/
│   │   │       ├── *Router.ts
│   │   │       ├── *Controller.ts
│   │   │       ├── *Service.ts
│   │   │       └── *Repository.ts
│   │   ├── common/
│   │   │   ├── db/        # Prisma client singleton
│   │   │   ├── middleware/ # Auth, error handler, rate limiter, upload
│   │   │   └── services/  # OpenAI, S3, Google Places
│   │   └── api-docs/      # OpenAPI / Swagger
│   └── generated/prisma/  # Auto-generated Prisma client
│
└── frontend/              # Expo app
    └── src/
        ├── app/           # Expo Router file-based routes
        │   ├── (app)/     # Authenticated tab group (Home, Scan, Artworks, Collections, Profile)
        │   ├── artworks/  # Artwork detail
        │   ├── collections/
        │   ├── discover/  # Museum list + detail (accessed from Home)
        │   ├── scan/      # Camera, result, fallback, manual entry
        │   ├── profile/   # Scan history
        │   ├── login.tsx  # Sign In
        │   ├── sign-up.tsx
        │   └── onboarding.tsx # Splash
        ├── features/      # Feature modules (auth, home, scan, artworks, collections, discover, profile)
        ├── lib/
        │   ├── api/       # Axios client, services, types
        │   └── hooks/     # TanStack Query hooks for every endpoint
        └── components/ui/ # Shared UI components + icons
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Get access + refresh tokens |
| POST | `/auth/refresh` | Rotate tokens |
| POST | `/auth/logout` | Invalidate refresh token |
| GET / PATCH | `/users/me` | Current user profile |
| GET | `/artworks` | All artworks |
| GET | `/artworks/:id` | Artwork detail |
| GET | `/artworks/search` | Search artworks |
| POST | `/artworks/:id/generate-story` | Generate AI story for artwork |
| GET | `/artists`, `/artists/:id`, `/artists/search` | Artist browsing |
| POST | `/scans/artwork` | Scan artwork only (AI Vision) |
| POST | `/scans/combined` | Scan artwork + label (OCR) |
| GET | `/scans`, `/scans/:id` | Scan history |
| PUT | `/scans/:id/correct` | Correct AI result |
| GET / POST / PUT / DELETE | `/collections/*` | Manage collections |
| GET / POST / PUT / DELETE | `/saved-artworks/*` | Save artworks into collections |
| GET | `/museums/nearby` | Nearby museums (Google Places) |
| GET | `/museums/search` | Search museums |
| GET | `/museums/place/:placeId` | Museum detail by Google Place ID |
| GET | `/museums/:id` | Museum detail by database ID |

Interactive API docs are available at `http://localhost:8080/swagger` when the backend is running.

---

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm
- PostgreSQL database
- AWS S3 bucket
- OpenAI API key (`gpt-4o` recommended)
- Google Places API key

### Backend

```bash
cd backend

# Install dependencies
pnpm install

# Copy env template and fill in your values
cp .env.template .env

# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# Start dev server (with file watching)
pnpm run start:dev
```

The API will be available at `http://localhost:8080`.

### Frontend

```bash
cd frontend

# Install dependencies
pnpm install

# Copy env file
cp .env.development .env

# Set EXPO_PUBLIC_API_URL to your backend URL, e.g.:
# EXPO_PUBLIC_API_URL=http://localhost:8080

# Start Expo dev server
pnpm start
```

---

## Environment Variables

### Backend (`.env`)

```env
NODE_ENV=development
PORT=8080
HOST=localhost

# CORS — comma-separated list of allowed origins
CORS_ORIGIN=http://localhost:8080,http://localhost:8081

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/artmemory

# JWT
JWT_SECRET=your-secret-key-at-least-32-characters-long
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=artmemory-uploads

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

# Google Places
GOOGLE_PLACES_API_KEY=your-google-places-key
```

### Frontend (`.env.development`)

```env
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_API_URL=http://localhost:8080
```

---

## Database Schema

The data model is defined in `backend/prisma/schema.prisma`. Key entities:

- **User** — account with plan (FREE / MONTHLY / YEARLY)
- **Artwork** — title, artist, year, medium, style, image, AI source tracking
- **Artist** — biography, nationality, wiki link
- **Scan** — scan type (ARTWORK / COMBINED), raw AI result, confidence, corrections
- **Collection** — user-named groups of saved artworks
- **SavedArtwork** — artwork saved to a collection with personal notes, rating, custom metadata
- **Museum** — location, opening hours, admission, Google Place ID
- **AiUsageLog** — per-request OpenAI cost and token tracking
- **RefreshToken** — JWT refresh token store with expiry

An ER diagram is available at [`er-diagram.mermaid`](./er-diagram.mermaid).

---

## App Screens

| Screen | Route |
|--------|-------|
| Splash | `/onboarding` |
| Sign In | `/login` |
| Sign Up | `/sign-up` |
| Home | `/(app)/` |
| Scan Entry | `/(app)/scan` |
| Camera Capture | `/scan/camera` |
| Scan Result | `/scan/result` |
| Scan Fallback | `/scan/fallback` |
| Manual Entry | `/scan/manual-entry` |
| Artworks List | `/(app)/artworks` |
| Artwork Detail | `/artworks/[id]` |
| Collections List | `/(app)/collections` |
| Collection Detail | `/collections/[id]` |
| Discover | `/discover` |
| Museum Detail | `/discover/[id]` |
| Profile | `/(app)/profile` |
| Scan History | `/profile/history` |

---

## License

MIT
