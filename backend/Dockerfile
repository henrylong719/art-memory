# Base stage with pnpm setup
FROM node:23.11.1-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Build stage - install all dependencies and build
FROM base AS build
COPY package.json pnpm-lock.yaml ./
# Install all dependencies (including dev dependencies)
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY . .
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/postgres" \
  pnpm exec prisma generate --schema prisma/schema.prisma
RUN pnpm run build

# Final stage - run with the full node_modules from build so Prisma CLI is available
FROM node:23.11.1-slim AS runner
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/generated ./generated
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Use the node user from the image
USER node

# Expose port 8080
EXPOSE 8080

# Force all runtime starts through our entrypoint, even if Railway sets a custom command.
ENTRYPOINT ["./docker-entrypoint.sh"]
