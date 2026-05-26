# 🚀 Deploy Guide — MLM SaaS Platform

## Opción 1: Railway (RECOMENDADO — Gratis)

Railway despliega el servidor completo (API + Backoffice) en segundos.

### Pasos:

1. **Crear cuenta en Railway**: https://railway.app (gratis con GitHub)

2. **Subir el proyecto a GitHub:**
   ```bash
   cd mlm-saas
   git init
   git add .
   git commit -m "Initial commit: MLM SaaS Platform"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/mlm-saas.git
   git push -u origin main
   ```

3. **En Railway:**
   - Click "New Project" → "Deploy from GitHub repo"
   - Selecciona tu repo `mlm-saas`
   - Railway detecta automáticamente `railway.toml` y ejecuta `node server.js`
   - En Settings → Variables, agrega:
     ```
     JWT_SECRET=tu_secreto_super_seguro_aqui_min_32_chars
     NODE_ENV=production
     ```
   - ¡Listo! Railway te da una URL pública como `mlm-saas.up.railway.app`

4. **URLs después del deploy:**
   - App principal: `https://TU-APP.up.railway.app`
   - Super Admin: `https://TU-APP.up.railway.app/admin`
   - API Health: `https://TU-APP.up.railway.app/api/health`

---

## Opción 2: Render.com (También Gratis)

1. Crear cuenta en https://render.com
2. "New Web Service" → conectar GitHub repo
3. Render detecta `render.yaml` automáticamente
4. En las variables de entorno, agrega `JWT_SECRET`
5. Deploy automático en cada `git push`

---

## Opción 3: Heroku

```bash
heroku create mlm-saas-app
heroku config:set JWT_SECRET=tu_secreto_aqui NODE_ENV=production
git push heroku main
```

El `Procfile` ya está configurado para Heroku.

---

## Opción 4: VPS / DigitalOcean (Producción)

```bash
# En el servidor
git clone https://github.com/TU_USUARIO/mlm-saas.git
cd mlm-saas
export JWT_SECRET="tu_secreto_super_seguro"
export NODE_ENV="production"
export PORT=3000

# Con PM2 para mantenerlo vivo
npm install -g pm2
pm2 start server.js --name mlm-saas
pm2 save
pm2 startup
```

---

## Correr Localmente

```bash
cd mlm-saas
node server.js
```

Luego abre:
- http://localhost:4000 → App principal (tenants)
- http://localhost:4000/admin → Super Admin Backoffice

### Credenciales demo:

| Rol | Email | Contraseña |
|---|---|---|
| Super Admin | super@mlmsaas.com | Admin123! |
| Agency Admin | admin@mlmsaas.com | Admin123! |
| MLM Líder | lider@mlmsaas.com | Admin123! |
| Afiliado | afiliado@mlmsaas.com | Admin123! |

---

## Variables de Entorno

| Variable | Descripción | Requerida |
|---|---|---|
| `PORT` | Puerto del servidor (default: 4000) | No |
| `JWT_SECRET` | Secreto para firmar tokens JWT | Sí en prod |
| `NODE_ENV` | `production` o `development` | No |

---

## Notas de Producción

- La base de datos JSON (`data/db.json`) se crea automáticamente al primer arranque
- En Railway/Render, los datos persisten mientras el servicio exista
- Para producción real, migrar a PostgreSQL + Prisma (ver `/apps/api/`)
- El servidor soporta CORS por defecto para todos los orígenes (configurar en prod)
