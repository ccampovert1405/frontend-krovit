# Etapa de build con Node (solo para compilar)
FROM node:18-alpine AS build
WORKDIR /app

# Copiar dependencias e instalar (más rápido con npm ci si tienes package-lock.json)
COPY package*.json ./
RUN npm ci --only=production

# Copiar el resto del código y compilar
COPY . .
RUN npm run build

# Etapa final con Nginx (imagen ligera)
FROM nginx:alpine
# Elimina la configuración por defecto de Nginx
RUN rm -rf /usr/share/nginx/html/*
# Copia el build del frontend
COPY --from=build /app/build /usr/share/nginx/html
# Copia tu configuración personalizada de Nginx
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]