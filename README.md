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

## Despliegue recomendado en Render

La forma mas comoda de compartir el proyecto como web publica es desplegarlo en Render:

- `frontend/` como sitio estatico
- `backend/` como servicio web
- PostgreSQL como base de datos gestionada

El repositorio ya incluye un archivo [`render.yaml`](./render.yaml) preparado para crear los tres servicios.

### Pasos

1. Sube el repositorio a GitHub y comprueba que los cambios estan actualizados.
2. En Render, crea un nuevo servicio usando la opcion **Blueprint** y selecciona este repositorio.
3. Espera a que se creen:
   - `danelgh-donostigo-db`
   - `danelgh-donostigo-api`
   - `danelgh-donostigo-web`
4. En la base de datos de Render, copia la **External Database URL**.
5. Desde tu ordenador, carga el esquema y los datos demo:

```bash
psql "<EXTERNAL_DATABASE_URL>" -f database/schema.sql
```

6. Abre la URL del frontend y comprueba que:
   - el catalogo carga correctamente
   - el login funciona
   - las reservas y resenas responden bien

### Nota

Si Render asigna una URL distinta a la prevista en `render.yaml`, actualiza estas variables en el panel de Render y vuelve a desplegar:

- en el backend: `CLIENT_URL`
- en el frontend: `VITE_API_URL`
