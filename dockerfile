# ---------- base ----------
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl jq

# ---------- deps ----------
FROM base AS deps
COPY package*.json ./
RUN npm ci --ignore-scripts

# ---------- builder (build-time: SOLO variables públicas NEXT_PUBLIC_) ----------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma client (no requiere DATABASE_URL para generar)
RUN npx prisma generate

# Vars públicas para el bundle del cliente
ARG NEXT_PUBLIC_ALLOWED_ORIGINS=""
ARG NEXT_PUBLIC_FORCE_ALLOW_ALL="false"
ENV NEXT_PUBLIC_ALLOWED_ORIGINS=$NEXT_PUBLIC_ALLOWED_ORIGINS
ENV NEXT_PUBLIC_FORCE_ALLOW_ALL=$NEXT_PUBLIC_FORCE_ALLOW_ALL

# Build del bundle (inyecta NEXT_PUBLIC_*)
RUN npm run build
RUN npm prune --omit=dev

# ---------- runner (runtime: SECRETS del server) ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Necesitamos jq en runtime para mapear APP_SECRETS -> envs
RUN apk add --no-cache jq

# Artefactos
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# APP_SECRETS sólo en runtime (DATABASE_URL, JWT_SECRET, etc.)
ENV APP_SECRETS={}

EXPOSE 3000
# Parsear APP_SECRETS a env y arrancar Next
CMD ["sh","-c","set -eu; echo \"$APP_SECRETS\" | jq -r 'to_entries|.[]| \"export \\(.key)=\\(.value|@sh)\"' > /tmp/env.sh; . /tmp/env.sh; exec npm start -- -H ${HOST} -p ${PORT}"]
