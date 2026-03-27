FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copiar todo el monorepo
COPY . .

# Instalar dependencias
RUN npm install --prefix packages/shared --legacy-peer-deps
RUN npm install --prefix apps/api --legacy-peer-deps
RUN npm install --prefix apps/web --legacy-peer-deps

# Build shared
WORKDIR /app/packages/shared
RUN npx tsc || true

# Build API
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npx tsc || true

# Build Frontend
WORKDIR /app/apps/web
RUN npx vite build

# Volver a raíz
WORKDIR /app

EXPOSE 3005
CMD ["sh", "-c", "cd apps/api && npx prisma migrate deploy && (npx prisma db seed || true) && node dist/server.js"]
