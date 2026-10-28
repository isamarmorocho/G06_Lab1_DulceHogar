# Despliegue en Railway · Paso 4 del Lab 3

Railway ejecuta tu API y una base PostgreSQL en la nube a partir de tu repositorio de GitHub.

> **Costo:** al crear la cuenta Railway entrega un crédito de prueba único (hoy USD 5) y luego un plan gratuito con poco crédito mensual. Una API pequeña con su base alcanza para el laboratorio. Revisa https://docs.railway.com/pricing/plans antes de empezar y **apaga o borra el proyecto** al terminar el parcial.
>
> **Si no puedes usar Railway** (sin tarjeta o sin cuenta): avisa al docente. Se acepta **Render + Neon** con la misma colección y la URL pública en el README.

## 1. Antes de subir

- [ ] `prisma`, `@prisma/client`, `@prisma/adapter-pg` y `pg` están en **dependencies** (no en devDependencies), todos en 7.10.1.
- [ ] `prisma.config.ts` está en el repositorio: `migrate deploy` lee de ahí la `DATABASE_URL`.
- [ ] `package.json` tiene `"start": "prisma migrate deploy && node src/server.js"` y `"postinstall": "prisma generate"`.
- [ ] `prisma/migrations/` está en Git (Railway las aplica, no las crea).
- [ ] `.env` está en `.gitignore`. El puerto se lee de `process.env.PORT` (Railway lo asigna).
- [ ] `npm start` funciona en tu máquina con una base vacía.

## 2. Crear el proyecto

1. Entra a https://railway.com con tu cuenta de GitHub.
2. **New Project → Deploy from GitHub repo** y elige el repositorio del grupo.
3. En el mismo proyecto: **+ New → Database → PostgreSQL**.

## 3. Variables del servicio de la API (pestaña *Variables*)

| Variable | Valor |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (referencia a la base del proyecto) |
| `JWT_SECRET` | una frase larga y aleatoria, **distinta** a la de tu `.env` |
| `JWT_EXPIRES_IN` | `4h` |
| `NODE_ENV` | `production` |

Guarda: Railway vuelve a desplegar. En *Deployments → View logs* debes ver `All migrations have been successfully applied` y `Servidor en ... PostgreSQL conectado`.

## 4. URL pública y datos

1. *Settings → Networking → Generate Domain*: obtienes `https://<algo>.up.railway.app`.
2. Carga el seed desde tu máquina usando la URL **pública** de la base (servicio Postgres → *Variables* → `DATABASE_PUBLIC_URL`):

   ```bash
   DATABASE_URL="<DATABASE_PUBLIC_URL>" npx prisma db seed      # macOS / Linux / Git Bash
   ```
   En PowerShell: `$env:DATABASE_URL="<DATABASE_PUBLIC_URL>"; npx prisma db seed`

   > El seed **borra y vuelve a crear** los datos de esa base. Hazlo solo sobre la base de Railway del proyecto.

## 5. Probar en la nube

1. En Postman importa `postman/Railway.postman_environment.json`, pon `baseUrl = https://<algo>.up.railway.app` y selecciona el entorno **Railway**.
2. Ejecuta **Run collection** con ese entorno. Captura: `evidencias/railway-run.png`.
3. Agrega la URL pública al README.

## Problemas frecuentes

| Síntoma en los logs | Causa y solución |
|---|---|
| `prisma: not found` | Prisma está en devDependencies: muévelo a dependencies (`npm install -E --save-prod prisma@7.10.1`). |
| `P1012 … DATABASE_URL` | Falta la variable o no es la referencia `${{Postgres.DATABASE_URL}}`. |
| `Falta la variable JWT_SECRET` | Agrega `JWT_SECRET` en Variables. |
| `Application failed to respond` | La API escucha un puerto fijo: usa `process.env.PORT`. |
| Tablas vacías | No corriste el seed contra `DATABASE_PUBLIC_URL`. |
| Los 409 o 404 no coinciden en la nube | La base de Railway tiene datos distintos: vuelve a correr el seed antes de **Run collection**. |
