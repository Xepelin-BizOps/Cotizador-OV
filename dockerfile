# syntax=docker/dockerfile:1
########## deps ##########
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
# Solo package.json para cachear deps
COPY package*.json ./
RUN npm install --ignore-scripts
########## builder ##########
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
# Reusar node_modules
COPY --from=deps /app/node_modules ./node_modules
# Copia todo el código (incluye prisma/)
COPY . .
# --- Build-time args ---
ARG NEXT_PUBLIC_ALLOWED_ORIGINS=http://localhost:3000
ENV NEXT_PUBLIC_ALLOWED_ORIGINS=${NEXT_PUBLIC_ALLOWED_ORIGINS}
ARG APP_SECRETS
ENV APP_SECRETS=${APP_SECRETS}
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
# --- Verificación DATABASE_URL ---
RUN if [ -z "$DATABASE_URL" ]; then echo "ERROR: DATABASE_URL no está definido"; exit 1; fi
RUN echo "Using DATABASE_URL=$DATABASE_URL"
# --- Genera Prisma y builda Next.js ---
RUN npx prisma generate
RUN npm run build
# Quita devDependencies
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
# Mantén las mismas vars en runtime
ARG NEXT_PUBLIC_ALLOWED_ORIGINS=http://localhost:3000
ENV NEXT_PUBLIC_ALLOWED_ORIGINS=${NEXT_PUBLIC_ALLOWED_ORIGINS}
ARG APP_SECRETS
ENV APP_SECRETS=${APP_SECRETS}
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
EXPOSE 3000
CMD ["npm", "start"]