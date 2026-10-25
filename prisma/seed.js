// Carga datos de prueba sin tocar la base a mano: npx prisma db seed
require("dotenv").config();
const prisma = require("../src/db/prisma"); // el mismo cliente (con adaptador) que usa la API

async function main() {
  // 1. Limpia las tablas: así el seed se puede ejecutar varias veces sin duplicar datos
  await prisma.postre.deleteMany();
  await prisma.cliente.deleteMany();

  // 2. Inserta datos: 3 o más de la entidad principal y 2 o más de la segunda
  //    "Brownie" es el valor @unique que se usa en Postman para probar el 409
  await prisma.postre.createMany({
    data: [
      { nombre: "Torta de chocolate", precio: 12.5, stock: 8, categoria: "tortas" },
      { nombre: "Cupcake de vainilla", precio: 2.0, stock: 30, categoria: "cupcakes" },
      { nombre: "Brownie", precio: 1.5, stock: 25, categoria: "brownies" },
    ],
  });
  await prisma.cliente.createMany({
    data: [
      { nombre: "María Pérez", correo: "maria@correo.com", telefono: "0991234567", direccion: "Av. Amazonas y Colón" },
      { nombre: "Carlos Andrade", correo: "carlos@correo.com", telefono: "0987654321" },
    ],
  });

  // 3. Muestra cuántos registros quedaron
  console.log(`Seed listo: ${await prisma.postre.count()} postres y ${await prisma.cliente.count()} clientes`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());