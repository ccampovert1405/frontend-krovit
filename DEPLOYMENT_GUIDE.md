# 🚀 Guía de Despliegue - CRM Frontend
## Servidor Hetzner VPS con TypeScript y PrimeReact

---

## 📋 Requisitos Previos

- [ ] Acceso SSH a tu servidor Hetzner
- [ ] Un dominio apuntando a la IP de tu servidor (opcional pero recomendado)
- [ ] Credenciales de acceso (usuario y contraseña o llave SSH)

---

## 🏗️ Arquitectura del Proyecto

```
planifikt-crm-frontend/
├── src/
│   ├── components/          # Componentes React
│   │   ├── ui/              # Componentes UI reutilizables
│   │   ├── layout/          # Sidebar, Header, etc.
│   │   ├── dashboard/       # Página Dashboard
│   │   ├── prospectos/      # Página Prospectos + Modal
│   │   └── pages/           # Otras páginas
│   ├── hooks/               # Custom Hooks (useFilters, useKPIs, etc.)
│   ├── types/               # Tipos TypeScript
│   ├── utils/               # Constantes y utilidades
│   ├── data/                # Datos de ejemplo
│   ├── styles/              # CSS global
│   ├── App.tsx              # Componente principal
│   └── main.tsx             # Entry point
├── public/                  # Archivos estáticos
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

---

## 🔧 PASO 1: Conectar al Servidor

```bash
ssh root@TU_IP_SERVIDOR
```

---

## 📦 PASO 2: Actualizar el Sistema

```bash
apt update && apt upgrade -y
```

---

## 🟢 PASO 3: Instalar Node.js 20 LTS

```bash
# Instalar Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verificar instalación
node --version   # Debe mostrar v20.x.x
npm --version    # Debe mostrar 10.x.x
```

---

## 🌐 PASO 4: Instalar Nginx

```bash
apt install -y nginx

# Iniciar y habilitar
systemctl start nginx
systemctl enable nginx

# Verificar
systemctl status nginx
```

---

## 📁 PASO 5: Crear Directorio del Proyecto

```bash
mkdir -p /var/www/planifikt-crm
cd /var/www/planifikt-crm
```

---

## 📤 PASO 6: Subir los Archivos

### Opción A: Usando Git (Recomendado)

```bash
cd /var/www/planifikt-crm
git clone https://github.com/TU_USUARIO/planifikt-crm.git .
```

### Opción B: Usando SCP desde tu computadora

Desde tu computadora local:
```bash
scp -r ./planifikt-crm-frontend/* root@TU_IP_SERVIDOR:/var/www/planifikt-crm/
```

### Opción C: Usando FileZilla (SFTP)

1. Host: `sftp://TU_IP_SERVIDOR`
2. Usuario: `root`
3. Puerto: `22`
4. Navega a `/var/www/planifikt-crm/`
5. Arrastra todos los archivos

---

## 📦 PASO 7: Instalar Dependencias

```bash
cd /var/www/planifikt-crm
npm install
```

Esto instalará:
- React 18
- PrimeReact (UI Framework)
- PrimeIcons
- PrimeFlex (CSS utilities)
- Lucide React (iconos adicionales)
- TypeScript y herramientas de desarrollo

---

## 🏗️ PASO 8: Compilar el Proyecto

```bash
npm run build
```

Esto ejecuta TypeScript + Vite y crea la carpeta `dist/`.

Verificar:
```bash
ls -la dist/
```

Deberías ver: `index.html`, `assets/`

---

## ⚙️ PASO 9: Configurar Nginx

### 9.1 Crear configuración

```bash
nano /etc/nginx/sites-available/planifikt-crm
```

Pega este contenido (edita `tu-dominio.com`):

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;
    # Sin dominio: server_name _;

    root /var/www/planifikt-crm/dist;
    index index.html;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml;

    # Cache archivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA - React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

Guardar: `Ctrl+O`, Enter, `Ctrl+X`

### 9.2 Activar el sitio

```bash
ln -s /etc/nginx/sites-available/planifikt-crm /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
```

### 9.3 Reiniciar Nginx

```bash
systemctl restart nginx
```

---

## ✅ PASO 10: Verificar

Abre en tu navegador:
- `http://TU_IP_SERVIDOR` o
- `http://tu-dominio.com`

¡Deberías ver el CRM funcionando! 🎉

---

## 🔒 PASO 11: Configurar HTTPS (Recomendado)

```bash
# Instalar Certbot
apt install -y certbot python3-certbot-nginx

# Obtener certificado
certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

Sigue las instrucciones en pantalla.

---

## 🔄 PASO 12: Actualizar el CRM

```bash
cd /var/www/planifikt-crm

# Si usas Git
git pull origin main

# Reinstalar dependencias (si hay cambios en package.json)
npm install

# Recompilar
npm run build

# Reiniciar Nginx
systemctl restart nginx
```

---

## 🛠️ Comandos Útiles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo (puerto 3000) |
| `npm run build` | Compilar para producción |
| `npm run preview` | Preview del build local |
| `systemctl status nginx` | Estado de Nginx |
| `systemctl restart nginx` | Reiniciar Nginx |
| `nginx -t` | Verificar config de Nginx |
| `tail -f /var/log/nginx/error.log` | Ver errores |

---

## 📁 Estructura de Componentes

### Componentes UI Reutilizables (`src/components/ui/`)
- `CustomBadge` - Etiquetas con colores personalizados
- `Avatar` - Avatar con iniciales
- `KPICard` - Tarjetas de indicadores
- `SectionTitle` - Títulos de sección
- `PageHeader` - Cabecera de página
- `FilterTabs` - Tabs de filtros
- `EmptyState` - Estado vacío

### Hooks Personalizados (`src/hooks/`)
- `useFilters` - Manejo de filtros globales
- `useFilteredData` - Filtrado de datos
- `useKPIs` - Cálculo de indicadores
- `useAIDAFunnel` - Conteo por etapas AIDA
- `useProspectos` - Gestión de prospectos

### Tipos TypeScript (`src/types/`)
- Interfaces para Agente, Prospecto, Oportunidad, Tarea, Actividad
- Tipos para etapas, prioridades, fuentes
- Tipos para formularios y navegación

---

## 🎨 Personalización de Estilos

Los colores de marca están en `src/utils/constants.ts`:

```typescript
export const COLORS = {
  red: '#E31E24',      // Color primario
  redDark: '#C41920',  // Hover
  redLight: '#FEF2F2', // Fondos
  black: '#1A1A1A',    // Textos
  // ... más colores
};
```

Los estilos globales están en `src/styles/index.css` con overrides de PrimeReact.

---

## 🚨 Solución de Problemas

### Error de TypeScript
```bash
# Limpiar cache y reinstalar
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Error 502 Bad Gateway
```bash
systemctl restart nginx
```

### Permisos
```bash
chown -R www-data:www-data /var/www/planifikt-crm/dist
chmod -R 755 /var/www/planifikt-crm/dist
```

### CSS/JS no cargan
```bash
ls -la /var/www/planifikt-crm/dist/assets/
```

---

## 📞 Soporte

Si tienes problemas:
1. Revisa logs: `tail -f /var/log/nginx/error.log`
2. Verifica build: `npm run build`
3. Contacta al equipo de KRIVOT ECUADOR

---

**Versión:** 2.0 (TypeScript + PrimeReact)  
**Última actualización:** Febrero 2026  
**Desarrollado por:** KRIVOT ECUADOR
