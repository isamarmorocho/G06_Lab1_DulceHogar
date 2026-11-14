// SERVER: solo levanta el servidor. La configuración de Express vive en app.js
require("dotenv").config();
const app = require("./app");
const prisma = require("./db/prisma");
const connectMongo = require("./db/mongo");

const PORT = process.env.PORT || 3000;

// Verifica la configuración y conecta PostgreSQL y MongoDB ANTES de empezar a escuchar
const start = async () => {
  if (!process.env.JWT_SECRET) throw new Error("Falta la variable JWT_SECRET");
  await prisma.$connect(); // PostgreSQL (Prisma)
  await connectMongo(); // MongoDB (Mongoose)
  app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT} · PostgreSQL y MongoDB conectados`);
  });
};

start().catch((err) => {
  console.error("No se pudo iniciar el servidor:", err.message);
  process.exit(1);
});
