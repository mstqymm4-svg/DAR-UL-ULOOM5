FROM node:20-slim
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV DATABASE_URL=file:../../data/darul.sqlite

# Prisma's query engine needs OpenSSL at runtime/generate time.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy the Prisma schema before install so the `postinstall`
# (prisma generate --schema=server/prisma/schema.prisma) succeeds.
COPY package*.json ./
COPY server/prisma ./server/prisma

RUN npm ci

COPY . .
RUN npm run build

VOLUME ["/app/data", "/app/server/uploads"]
EXPOSE 4000
CMD ["npm", "run", "start:prod"]
