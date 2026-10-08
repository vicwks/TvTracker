FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

# Dépendances installées depuis le lockfile (reproductible)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

# Lance les migrations (idempotentes) puis le serveur. Si la migration échoue, le serveur ne démarre pas.
CMD ["sh", "-c", "node src/db/migrate.js && node src/app.js"]
