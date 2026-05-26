# ─── Build Stage ────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/

# Instalar dependencias
RUN npm install --frozen-lockfile

# Copiar código fuente
COPY apps/api ./apps/api
COPY packages/database ./packages/database

# Generar Prisma client
RUN cd packages/database && npx prisma generate

# Build
RUN cd apps/api && npm run build

# ─── Production Stage ───────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Solo dependencias de producción
COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
RUN npm install --production --frozen-lockfile

# Copiar build
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/database ./packages/database

# Usuario no-root (seguridad)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs

EXPOSE 4000

# Migrar DB y luego iniciar
CMD ["sh", "-c", "cd packages/database && npx prisma migrate deploy && cd /app && node apps/api/dist/main"]
