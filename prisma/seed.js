// Carga datos de prueba sin tocar la base a mano: npx prisma db seed
// Conserva el usuario ADMIN y el pedido entregado de Ana: los usan las colecciones de Postman.
require("dotenv").config();
const bcrypt = require("bcryptjs");
const prisma = require("../src/db/prisma"); // el mismo cliente (con adaptador) que usa la API

async function main() {
  // 1. Limpia en orden inverso a las relaciones (hijos antes que padres)
  await prisma.historialEstadoPedido.deleteMany(); // Taller C
  await prisma.resena.deleteMany(); // Taller A
  await prisma.itemPedido.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.user.deleteMany();
  await prisma.categoria.deleteMany(); // Taller B (limpia también la tabla intermedia)
  await prisma.postre.deleteMany();

  // 2. Catálogo de postres
  await prisma.postre.createMany({
    data: [
      { nombre: "Torta de chocolate", precio: 12.5, stock: 8, categoria: "tortas" },
      { nombre: "Cupcake de vainilla", precio: 2.0, stock: 30, categoria: "cupcakes" },
      { nombre: "Brownie", precio: 1.5, stock: 25, categoria: "brownies" },
    ],
  });

  // 3. Taller B: categorías conectadas a los postres (N:M implícita)
  await prisma.categoria.create({
    data: { nombre: "Tortas", postres: { connect: [{ nombre: "Torta de chocolate" }] } },
  });
  await prisma.categoria.create({
    data: { nombre: "Chocolate", postres: { connect: [{ nombre: "Torta de chocolate" }, { nombre: "Brownie" }] } },
  });
  await prisma.categoria.create({ data: { nombre: "Individuales", postres: { connect: [{ nombre: "Cupcake de vainilla" }] } } });

  // 4. Clientes sin usuario (como en el Lab 2): el perfil 1:1 es opcional
  await prisma.cliente.createMany({
    data: [
      { nombre: "María Pérez", correo: "maria@correo.com", telefono: "0991234567", direccion: "Av. Amazonas y Colón" },
      { nombre: "Carlos Andrade", correo: "carlos@correo.com", telefono: "0987654321" },
    ],
  });

  // 5. Usuarios: un ADMIN y una cliente con su perfil (1:1) en una sola escritura anidada
  const admin = await prisma.user.create({
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

  // 6. Un pedido de ejemplo ya ENTREGADO (con su historial) → Ana puede reseñar el Brownie (Taller A, reto)
  const brownie = await prisma.postre.findUnique({ where: { nombre: "Brownie" } });
  const pedido = await prisma.pedido.create({
    data: {
      clienteId: ana.cliente.id,
      total: 3,
      estado: "ENTREGADO",
      items: { create: [{ postreId: brownie.id, cantidad: 2, precioUnitario: brownie.precio }] },
    },
  });
  await prisma.historialEstadoPedido.createMany({
    data: [
      { pedidoId: pedido.id, estadoAnterior: "PENDIENTE", estadoNuevo: "CONFIRMADO", nota: "Pago recibido", cambiadoPorId: admin.id },
      { pedidoId: pedido.id, estadoAnterior: "CONFIRMADO", estadoNuevo: "ENTREGADO", nota: "Entregado en el local", cambiadoPorId: admin.id },
    ],
  });

  console.log(
    `Seed listo: ${await prisma.postre.count()} postres, ${await prisma.categoria.count()} categorías, ${await prisma.user.count()} usuarios, ${await prisma.cliente.count()} clientes y ${await prisma.pedido.count()} pedido`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
