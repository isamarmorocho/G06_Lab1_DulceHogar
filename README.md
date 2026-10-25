# Laboratorio 1 · Mini-API MVC con CRUD

**Desarrollo Web Avanzado (A0R04) · ESPE · Unidad 1: Persistencia de datos y ORM**
   | Dato | Valor |
   |---|---|
   | Grupo | G06 |
   | Emprendimiento | Dulce Hogar (repostería casera) |
   | Integrantes | 1. Jonathan Guayta <br> 2. Joselyn Morocho <br> 3. Matias Rojas |
   | NRC | 36878 |
   | Fecha | 19/10/2026 |
   | Repositorio | https://github.com/isamarmorocho/G06_Lab1_DulceHogar |
## Cómo ejecutar

```bash
npm install
cp .env.example .env      # en Windows: copy .env.example .env
npm run dev               # http://localhost:3000
```

Importa en Postman `postman/GXX_Lab1.postman_collection.json` y ejecuta **Run collection**.

## Estructura MVC en capas

```
src/
├─ app.js            ← arma la app: express.json, middlewares y prefijo /api
├─ server.js         ← solo levanta el servidor (lee .env)
├─ routes/
│  ├─ index.js       ← archivo principal: monta cada recurso (/api/<entidad>)
│  └─ <entidad>.routes.js  ← verbo + URL → acción del controlador
├─ controllers/      ← lee req, llama al servicio, decide código + JSON
├─ services/         ← reglas de negocio, validaciones y acceso a datos
├─ models/           ← campos de la entidad y archivo JSON (Lab 2: schema.prisma)
├─ middlewares/      ← logger, notFound, errorHandler
└─ utils/httpError.js
data/                ← archivo JSON con los registros
```

Flujo de una petición: **ruta → controlador → servicio → modelo** y de vuelta. El proyecto usa CommonJS (`require` / `module.exports`).

## Endpoints de la entidad

| Verbo | Ruta | Acción | Éxito | Errores |
|---|---|---|---|---|
| GET | /api/... | Listar | 200 | — |
| GET | /api/.../:id | Ver uno | 200 | 400, 404 |
| POST | /api/... | Crear | 201 | 400 |
| PUT | /api/.../:id | Actualizar | 200 | 400, 404 |
| DELETE | /api/.../:id | Eliminar | 204 | 404 |

## Validaciones del servicio

1. `nombre` es obligatorio y debe ser un texto de al menos 3 caracteres (si no, 400).
2. `precio` debe ser un número mayor o igual a 0 (si no, 400).
3. (Extra) `stock`, si se envía, debe ser un entero mayor o igual a 0 (si no, 400).

## Middlewares

- **logger**: imprime en consola la hora, el verbo, la ruta, el código de estado y la duración de cada petición.
- **notFound**: una ruta inexistente responde 404 en JSON.
- **errorHandler**: un JSON mal formado responde 400; un error inesperado responde 500 con «Error interno del servidor» y muestra `err.stack` solo si `NODE_ENV` no es `production`.

## Aporte de cada integrante

| Integrante | Qué hizo (archivos / pasos) |
|---|---|
| Joselyn Morocho | Creó el repositorio, renombró la entidad product → postre, definió el modelo (4 campos) y los datos de ejemplo, y programó el servicio con las validaciones y create, update y remove. Archivos: models/postre.model.js, services/postre.service.js, data/postres.json, routes/index.js, app.js. |
| Matias Rojas | Programó el controlador (create, update, remove) y las rutas POST, PUT y DELETE, implementó los middlewares logger y errorHandler y capturó la evidencia del logger. Archivos: controllers/postre.controller.js, routes/postre.routes.js, middlewares/logger.js, middlewares/errorHandler.js, evidencias/logger.png. |
| Jonathan Guayta | Redactó PROPUESTA.md y el mapa, adaptó y ejecutó la colección de Postman (13 pruebas en verde), completó este README y armó la entrega. Archivos: PROPUESTA.md, mapa.png, README.md, postman/, evidencias/postman-run.png. |

## Declaración de uso de IA

- Herramienta(s) usada(s): Claude (asistente de IA).
- Para qué la usamos: entender la estructura MVC y las instrucciones del laboratorio, y consultar dudas y errores.
- Qué verificamos o corregimos nosotros: ejecutamos la API, probamos cada endpoint en Postman, comprobamos los códigos 200, 201, 204, 400 y 404 y adaptamos los nombres, campos y validaciones a nuestra entidad.

---

## Lab 2 · Persistencia con Prisma + PostgreSQL

### Aporte de cada integrante (Lab 2)

| Integrante | Qué hizo (archivos / pasos) |
|---|---|
| Joselyn Morocho (Persona 1) | Instaló y configuró Prisma 7.10.1, escribió `schema.prisma` (Postre y Cliente), creó la migración `init` y el seed. Archivos: `prisma/schema.prisma`, `prisma/migrations/`, `prisma/seed.js`, `prisma.config.ts`, `src/db/prisma.js`, `src/server.js`, `package.json`, `.env.example`, `docker-compose.yml`. |
| Jonathan Guayta (Persona 2) | Pendiente |
| Matias Rojas (Persona 3) | Pendiente |