# Étape 1 : build du frontend React/Vite
FROM node:22-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Adresse publique du site (liens canoniques, sitemap). À régler au déploiement.
ARG VITE_SITE_URL=http://localhost:8080
RUN npm run build

# Étape 2 : Nginx sert le build, proxifie /api vers le backend et expose /documentation
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
