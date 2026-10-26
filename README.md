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

Importa en Postman `postman/G06_Lab1.postman_collection.json` y ejecuta **Run collection**.

## Estructura MVC en capas

```
src/
├─ app.js            ← arma la app: express.json, middlewares y prefijo /api
├─ server.js         ← solo levanta el servidor (lee .env)
├─ routes/
│  ├─ index.js       ← archivo principal: monta cada recurso (/api/postres)
│  └─ postre.routes.js  ← verbo + URL → acción del controlador
├─ controllers/      ← lee req, llama al servicio, decide código + JSON
├─ services/         ← reglas de negocio, validaciones y acceso a datos
├─ db/prisma.js      ← (Lab 2) única instancia de PrismaClient
├─ middlewares/      ← logger, notFound, errorHandler
└─ utils/httpError.js
prisma/              ← (Lab 2) schema.prisma, migrations/ y seed.js (el modelo ya no es un archivo .js ni un JSON)
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

La API ahora guarda sus datos en **PostgreSQL** a través de **Prisma 7.10.1**. El controlador y las rutas del CRUD son los del Lab 1 (solo se agregó `/lote`); cambió el servicio (ahora usa Prisma) y el modelo (ahora es `prisma/schema.prisma`).

### Cómo crear la base y arrancar

1. Levantar PostgreSQL 17 con Docker (o usa una base en Neon):
   ```bash
   docker compose up -d
   ```
2. Copiar el archivo de entorno y revisar `DATABASE_URL`:
   ```bash
   cp .env.example .env      # en Windows: copy .env.example .env
   ```
3. Instalar, crear las tablas, generar el cliente y cargar los datos:
   ```bash
   npm install
   npx prisma migrate dev --name init   # crea las tablas desde schema.prisma
   npx prisma generate                  # Prisma 7: genera el cliente aparte
   npx prisma db seed                   # carga los datos de prueba (se puede repetir)
   npm run dev                          # http://localhost:3000
   ```
4. Opcional: `npx prisma studio` para ver los datos en el navegador.

### Modelo de datos

- `Postre` (tabla `postres`): `id`, `nombre` (único), `precio`, `stock`, `categoria` (opcional), `created_at`, `updated_at`.
- `Cliente` (tabla `clientes`): `id`, `nombre`, `correo` (único), `telefono` (opcional), `direccion` (opcional), `created_at`.
- El diagrama completo y las relaciones están en [MODELO_ER.md](MODELO_ER.md).

### Errores traducidos por el errorHandler

| Situación | Código |
|---|---|
| Datos inválidos (validaciones del servicio) | 400 |
| Registro inexistente | 404 |
| Valor único repetido (por ejemplo, el nombre de un postre) | 409 |

### Endpoint con transacción: `POST /api/postres/lote`

Recibe un **arreglo** de postres y los crea **todos o ninguno** con `prisma.$transaction`. Cada ítem se valida dentro de la transacción: si uno falla, se hace ROLLBACK y no queda ningún registro guardado.

| Caso | Respuesta |
|---|---|
| Todos los ítems son válidos | 201 con los registros creados (COMMIT) |
| El body no es un arreglo, o está vacío | 400 |
| Un ítem es inválido | 400 con el número del ítem (ROLLBACK) |
| Un ítem repite un valor único | 409 (ROLLBACK) |

### Colección de Postman

`postman/G06_Lab2.postman_collection.json` tiene dos carpetas: **CRUD con Prisma** (incluye 400, 404 y 409) y **Transacción** (COMMIT, ROLLBACK 400, ROLLBACK 409 y la verificación de que no quedó nada guardado). Evidencias: `evidencias/postman-run.png` y `evidencias/prisma-studio.png`.

### Aporte de cada integrante (Lab 2)

| Integrante | Qué hizo (archivos / pasos) |
|---|---|
| Joselyn Morocho | Instaló y configuró Prisma 7.10.1, escribió `schema.prisma`, creó la migración y el seed. Archivos: `prisma/schema.prisma`, `prisma/migrations/`, `prisma/seed.js`, `prisma.config.ts`, `src/db/prisma.js`, `src/server.js`, `package.json`, `.env.example`. |
| Matias Rojas | Pasó el servicio a Prisma (create, update, remove y la transacción `createMany`) y adaptó el errorHandler (409 y 404). Archivos: `src/services/postre.service.js`, `src/middlewares/errorHandler.js`. |
| Jonathan Guayta | Escribió el modelo ER, agregó `createMany` al controlador y la ruta `/lote`, adaptó y ejecutó la colección de Postman y completó el README. Archivos: `MODELO_ER.md`, `src/controllers/postre.controller.js`, `src/routes/postre.routes.js`, `postman/`, `README.md`. |

### Declaración de uso de IA (Lab 2)

- Herramienta(s) usada(s): Claude (asistente de IA).
- Para qué la usamos: entender las diferencias de Prisma 7, los errores de la migración y cómo funciona la transacción.
- Qué verificamos o corregimos nosotros: ejecutamos las migraciones y el seed en una base vacía, probamos el CRUD y el endpoint `/lote` en Postman (COMMIT y ROLLBACK), revisamos los datos en Prisma Studio y adaptamos los nombres y las validaciones a nuestra entidad.
