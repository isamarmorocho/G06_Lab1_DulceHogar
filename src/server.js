// SERVER: solo levanta el servidor. La configuración de Express vive en app.js
require("dotenv").config();
const app = require("./app");
const prisma = require("./db/prisma");

const PORT = process.env.PORT || 3000;

// Verifica la configuración y la conexión a PostgreSQL antes de empezar a escuchar
const start = async () => {
  if (!process.env.JWT_SECRET) throw new Error("Falta la variable JWT_SECRET");
  await prisma.$connect();
  app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT} · PostgreSQL conectado`);
  });
};

start().catch((err) => {
  console.error("No se pudo iniciar el servidor:", err.message);
  process.exit(1);
});
