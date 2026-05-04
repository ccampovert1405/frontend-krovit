FROM node:18-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
COPY .env.production .env
RUN npm run build

FROM alpine:3.18 AS runner
WORKDIR /app
COPY --from=build /app/dist ./dist

# Copiar entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

CMD ["/entrypoint.sh"]