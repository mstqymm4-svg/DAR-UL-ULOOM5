FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
ENV NODE_ENV=production
ENV PORT=4000
ENV DATABASE_URL=file:../../data/darul.sqlite
VOLUME ["/app/data", "/app/server/uploads"]
EXPOSE 4000
CMD ["npm", "run", "start:prod"]
