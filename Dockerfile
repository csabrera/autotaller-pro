FROM node:20-slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copiar todo el monorepo
COPY . .

# Instalar TODAS las dependencias desde la raíz (npm workspaces)
RUN npm install --legacy-peer-deps

# Build shared
RUN cd packages/shared && npx tsc || true

# Generar Prisma client + Build API
RUN cd apps/api && npx prisma generate && npx tsc || true

# Build Frontend
RUN cd apps/web && npx vite build

EXPOSE 3005
CMD ["sh", "-c", "cd apps/api && npx prisma migrate deploy && (npx prisma db seed || true) && NODE_ENV=production node dist/server.js"]
