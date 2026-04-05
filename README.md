# DonostiGo

Plataforma web para descubrir negocios locales de Donostia-San Sebastian y gestionar distintas formas de interacción según el tipo de negocio: reservas, plazas, solicitudes manuales, bonos, listas y guías públicas.

## Stack

- `frontend/`: React + Vite
- `backend/`: Node.js + Express
- `database/schema.sql`: PostgreSQL con esquema completo y datos demo
- `render.yaml`: blueprint para Render

## Estado actual del producto

DonostiGo ya no está planteado como un MVP de reservas simples. Ahora mismo incluye:

- autenticación con roles `user` y `business`
- catálogo de negocios con filtros, ordenación y comparador rápido
- fichas públicas con branding, horarios, FAQ y políticas
- reservas por servicio con disponibilidad real por franjas
- lista de espera y conversión de waitlist a reserva
- solicitudes manuales para negocios `request`
- bonos y packs con propuesta cerrada y flujo de aceptación
- reseñas con respuesta pública del negocio
- guardados, listas personalizadas y guías públicas
- recomendaciones personalizadas
- panel de negocio tipo backoffice con:
  - branding del portal
  - horarios y excepciones
  - oferta por servicio
  - inbox operativo
  - métricas e insights

## Estructura rápida

```text
backend/
database/
frontend/
render.yaml
```

## Arranque local

### 1. Base de datos

Crea una base PostgreSQL llamada `donostigo` y bootstrapéala con el esquema completo:

```bash
cd backend
cp .env.example .env
npm install
npm run db:bootstrap
```

El script usa `DATABASE_URL` del `.env` de backend. Por defecto el ejemplo apunta a:

```text
postgresql://danelgoni@localhost:5432/donostigo
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Scripts útiles de base de datos

Desde `backend/`:

```bash
npm run db:bootstrap
```

Reaplica `database/schema.sql` completo. Importante:

- borra y recrea tablas
- vuelve a cargar seeds demo
- sirve tanto para local como para remoto

También puedes pasar una URL explícita:

```bash
npm run db:bootstrap -- "postgresql://usuario:pass@host:5432/donostigo"
```

Para verificar que la base remota o local tiene las tablas nuevas:

```bash
npm run db:verify
```

O bien:

```bash
npm run db:verify -- "postgresql://usuario:pass@host:5432/donostigo"
```

Si quieres una comprobación más completa antes de desplegar o entregar:

```bash
cd backend
npm run release:check
```

Este comando encadena:

- `build` del frontend
- `db:verify`
- `smoke` de la API

## Health y smoke test

La API ya expone un `health` con comprobación real de base de datos y esquema:

```text
GET /api/health
```

Si la API está levantada pero la base no tiene todavía el esquema esperado, responderá con error `503`.

También tienes un smoke test básico para validar el proyecto de punta a punta sin tocar datos destructivos:

```bash
cd backend
npm run smoke
```

Por defecto usa:

```text
http://127.0.0.1:4000/api
```

También puedes apuntarlo a otra URL:

```bash
SMOKE_BASE_URL=https://danelgh-donostigo-api.onrender.com/api npm run smoke
```

Este smoke verifica:

- health
- catálogo público
- ficha pública
- guías públicas
- login cliente
- actividad cliente
- recomendaciones
- login negocio
- panel negocio
- reservas del negocio

## Credenciales demo

- cliente: `ane@donostigo.local` / `Demo1234`
- negocio: `surf@donostigo.local` / `Demo1234`

## Despliegue en Render

El repositorio ya incluye `render.yaml` con:

- PostgreSQL gestionado
- backend `danelgh-donostigo-api`
- frontend estático `danelgh-donostigo-web`

### Flujo recomendado

1. Sube el repositorio actualizado a GitHub.
2. En Render crea el proyecto con **Blueprint** usando `render.yaml`.
3. Espera a que se creen la base, el backend y el frontend.
4. Copia la **External Database URL** de Render.
5. Desde tu equipo, ejecuta el bootstrap remoto:

```bash
cd backend
npm run db:bootstrap -- "<EXTERNAL_DATABASE_URL>"
```

6. Comprueba que la base tiene el esquema actual:

```bash
cd backend
npm run db:verify -- "<EXTERNAL_DATABASE_URL>"
```

7. Abre la app desplegada y prueba:
   - login
   - catálogo
   - detalle
   - reservas o solicitudes
   - panel de negocio

## Nota importante sobre producción demo

`schema.sql` está pensado para entorno académico y de demostración:

- recrea la base desde cero
- vuelve a cargar datos demo
- no usa migraciones incrementales

Para el TFG esto es válido y práctico, pero conviene tratarlo como un **bootstrap controlado**, no como una estrategia de producción real.

## URLs del proyecto

- repositorio: [https://github.com/Danelgh/donostigo](https://github.com/Danelgh/donostigo)
- app desplegada: [https://danelgh-donostigo-web.onrender.com](https://danelgh-donostigo-web.onrender.com)
