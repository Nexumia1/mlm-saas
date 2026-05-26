# 🚀 Guía de Inicio Rápido — MLM SaaS Platform

## Prerequisitos
- Node.js >= 20
- Docker Desktop instalado y corriendo
- Git

## 1. Clonar y configurar

```bash
# Instalar dependencias del monorepo
npm install

# Copiar variables de entorno
cp .env.example .env
# ⚠️ Edita .env con tus claves antes de continuar
```

## 2. Levantar infraestructura con Docker

```bash
# Levantar PostgreSQL, Redis y MongoDB
npm run docker:up

# Ver logs
npm run docker:logs
```

## 3. Base de datos

```bash
# Generar cliente Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# Cargar datos de ejemplo
cd packages/database && npx ts-node prisma/seed.ts
```

## 4. Iniciar en desarrollo

```bash
# Inicia API (puerto 4000) y Web (puerto 3000) en paralelo
npm run dev
```

## URLs

| Servicio | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API | http://localhost:4000/api/v1 |
| Swagger Docs | http://localhost:4000/api/docs |
| Prisma Studio | `npm run db:studio` |

## Credenciales de demo

| Usuario | Email | Contraseña |
|---|---|---|
| Admin | admin@mlmsaas.com | Admin123! |
| Líder MLM | lider@mlmsaas.com | Admin123! |
| Afiliado | afiliado@mlmsaas.com | Admin123! |

## Estructura del proyecto

```
mlm-saas/
├── apps/
│   ├── api/           ← NestJS Backend
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── auth/        # JWT, registro, login
│   │       │   ├── users/       # Gestión de usuarios
│   │       │   ├── tenants/     # Multi-tenant
│   │       │   ├── crm/         # Leads, contactos, pipeline
│   │       │   ├── campaigns/   # Campañas Meta/TikTok
│   │       │   ├── whatsapp/    # WhatsApp Business API
│   │       │   └── analytics/   # Métricas y KPIs
│   │       └── common/
│   │           ├── guards/      # JWT, Roles
│   │           └── decorators/  # @Roles, @Public
│   └── web/           ← Next.js 14 Frontend
│       └── src/
│           ├── app/
│           │   ├── (auth)/      # Login, registro
│           │   └── (dashboard)/ # Dashboard, CRM, etc.
│           ├── components/      # Sidebar, UI components
│           └── lib/             # API client, Zustand store
├── packages/
│   └── database/      ← Prisma schema + migraciones
├── docker/            ← Docker Compose + Nginx
└── .github/workflows/ ← CI/CD GitHub Actions
```

## Próximos pasos (Fase 2)

- [ ] Integración completa Meta Ads API
- [ ] Integración TikTok Ads API
- [ ] Constructor de flujos WhatsApp (visual)
- [ ] Sistema de automatizaciones
- [ ] Billing con Stripe
- [ ] Panel de reportes PDF
- [ ] IA: generación de copy para ads
```
