// Carga datos de prueba sin tocar la base a mano: npx prisma db seed
// Conserva el usuario ADMIN: lo usa la colección de Postman.
require("dotenv").config();
const bcrypt = require("bcryptjs");
const prisma = require("../src/db/prisma"); // el mismo cliente (con adaptador) que usa la API

async function main() {
  // 1. Limpia en orden inverso a las relaciones (hijos antes que padres)
  await prisma.itemPedido.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.user.deleteMany();
  await prisma.postre.deleteMany();

  // 2. Catálogo de postres
  await prisma.postre.createMany({
    data: [
      { nombre: "Torta de chocolate", precio: 12.5, stock: 8, categoria: "tortas" },
      { nombre: "Cupcake de vainilla", precio: 2.0, stock: 30, categoria: "cupcakes" },
      { nombre: "Brownie", precio: 1.5, stock: 25, categoria: "brownies" },
    ],
  });

  // 3. Clientes sin usuario (como en el Lab 2): el perfil 1:1 es opcional
  await prisma.cliente.createMany({
    data: [
      { nombre: "María Pérez", correo: "maria@correo.com", telefono: "0991234567", direccion: "Av. Amazonas y Colón" },
      { nombre: "Carlos Andrade", correo: "carlos@correo.com", telefono: "0987654321" },
    ],
  });

  // 4. Usuarios: un ADMIN y una cliente con su perfil (1:1) en una sola escritura anidada
  await prisma.user.create({
    data: {
      email: "admin@dulcehogar.com",
      password: await bcrypt.hash("Admin123*", 10),
      name: "Administración",
      role: "ADMIN",
    },
  });
  const ana = await prisma.user.create({
    data: {
      email: "ana@correo.com",
      password: await bcrypt.hash("Ana12345*", 10),
      name: "Ana Torres",
      cliente: { create: { nombre: "Ana Torres", correo: "ana@correo.com", telefono: "0991112233" } },
    },
    include: { cliente: true },
  });

  // 5. Un pedido de ejemplo ya entregado (1:N y N:M)
  const brownie = await prisma.postre.findUnique({ where: { nombre: "Brownie" } });
  await prisma.pedido.create({
    data: {
      clienteId: ana.cliente.id,
      total: 3,
      estado: "ENTREGADO",
      items: { create: [{ postreId: brownie.id, cantidad: 2, precioUnitario: brownie.precio }] },
    },
  });

  console.log(
    `Seed listo: ${await prisma.postre.count()} postres, ${await prisma.user.count()} usuarios, ${await prisma.cliente.count()} clientes y ${await prisma.pedido.count()} pedido`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
