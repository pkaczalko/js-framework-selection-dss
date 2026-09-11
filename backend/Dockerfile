# Prisma 2.29 + OpenSSL 1.1. Node ≥16.17 psuje JSON.parse odpowiedzi silnika
# (https://github.com/prisma/prisma/issues/14834) — pin 16.16.0, nie floating 16.
FROM node:16.16.0-bullseye-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY vendor/official-api/package.json vendor/official-api/package-lock.json ./
COPY vendor/official-api/prisma ./prisma
COPY vendor/official-api/tsconfig.json ./
COPY vendor/official-api/src ./src
COPY vendor/official-api/docs ./docs
COPY vendor/official-api/public ./public
COPY patches/tag.service.ts ./src/services/tag.service.ts
COPY patches/article.service.ts ./src/services/article.service.ts
COPY patches/auth.service.ts ./src/services/auth.service.ts
COPY patches/profile.service.ts ./src/services/profile.service.ts
COPY patches/article.controller.ts ./src/controllers/article.controller.ts
COPY patches/index.ts ./src/index.ts

ENV HUSKY=0

RUN npm ci --ignore-scripts \
  && npx prisma generate \
  && ./node_modules/.bin/tsc

ENV NODE_ENV=production

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && exec node dist/src/index.js"]
