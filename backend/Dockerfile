# ─── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ─── Production stage ─────────────────────────────────────────────────────────
FROM node:20-slim

WORKDIR /app

RUN apt-get update -y && \
    apt-get install -y openssl curl netcat-openbsd && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -s /bin/sh -m nodeuser

# Copy built artifacts
COPY --from=builder --chown=nodeuser:nodejs /app/dist         ./dist
COPY --from=builder --chown=nodeuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodeuser:nodejs /app/package*.json ./
COPY --from=builder --chown=nodeuser:nodejs /app/prisma       ./prisma

# Copy entrypoint
COPY --chown=nodeuser:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nodeuser

EXPOSE 4000

CMD ["./docker-entrypoint.sh"]
