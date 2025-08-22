# syntax=docker/dockerfile:1

########## deps ##########
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Sólo package* para cachear deps
COPY package*.json ./

# Evita ejecutar scripts (tu postinstall corre "prisma generate" pero aún no existe prisma/)
RUN npm install --ignore-scripts

########## builder ##########
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Re-usa node_modules de deps
COPY --from=deps /app/node_modules ./node_modules

# Copia todo el código (incluye prisma/)
COPY . .

# --- Build-time/env de frontend ---
# Puedes sobreescribirlo en docker build / compose
ARG NEXT_PUBLIC_ALLOWED_ORIGINS=http://localhost:3000 
ENV NEXT_PUBLIC_ALLOWED_ORIGINS=${NEXT_PUBLIC_ALLOWED_ORIGINS}

# (Opcional) si además pasas secretos empaquetados:
ARG APP_SECRETS
ENV APP_SECRETS=${APP_SECRETS}

# Genera Prisma y buildea; Next.js leerá NEXT_PUBLIC_* en build time
RUN set -e; \
  echo "Using NEXT_PUBLIC_ALLOWED_ORIGINS=$NEXT_PUBLIC_ALLOWED_ORIGINS"; \
  npx prisma generate; \
  npm run build

# Quita devDependencies para runtime
RUN npm prune --omit=dev

########## runner ##########
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

# Archivos necesarios para ejecutar
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Mantén las mismas vars también en runtime por conveniencia (server-side)
ARG NEXT_PUBLIC_ALLOWED_ORIGINS=http://localhost:3000
ENV NEXT_PUBLIC_ALLOWED_ORIGINS=${NEXT_PUBLIC_ALLOWED_ORIGINS}

ARG APP_SECRETS
ENV APP_SECRETS=${APP_SECRETS}

EXPOSE 3000
CMD ["npm", "start"]
