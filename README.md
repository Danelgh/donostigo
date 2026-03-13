# DonostiGo

Proyecto base para el TFG de DAW: una plataforma web de descubrimiento y reservas para negocios locales de Donostia-San Sebastian.

## Estructura

- `frontend/`: cliente React con Vite
- `backend/`: API REST con Node.js, Express y PostgreSQL
- `database/schema.sql`: esquema inicial de base de datos y datos de ejemplo

## MVP planteado

- Registro e inicio de sesion
- Roles de usuario y negocio
- Listado de negocios por categoria
- Detalle de negocio
- Reservas basicas
- Panel de usuario

## Puesta en marcha

### 1. Base de datos

Crear una base de datos llamada `donostigo` en PostgreSQL y ejecutar:

```sql
\i database/schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# editar .env y asignar un JWT_SECRET propio antes de arrancar
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

## Endpoints iniciales

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/businesses`
- `GET /api/businesses/:id`
- `POST /api/reservations`
- `GET /api/reservations/my`

## Credenciales demo tras ejecutar el seed

- `surf@donostigo.local` / `Demo1234`
- `ane@donostigo.local` / `Demo1234`
