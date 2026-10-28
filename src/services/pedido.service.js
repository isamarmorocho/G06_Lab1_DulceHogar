const prisma = require("../db/prisma");
const HttpError = require("../utils/httpError");

// SERVICIO de pedidos: el recurso limitado es el stock de cada postre

// Cómo se devuelve un pedido: con sus ítems y el nombre del postre (fetch explícito)
const pedidoInclude = {
  items: { include: { postre: { select: { id: true, nombre: true } } } },
};

const clienteDe = async (userId) => {
  const cliente = await prisma.cliente.findUnique({ where: { userId } });
  if (!cliente) throw new HttpError(403, "El usuario no tiene perfil de cliente");
  return cliente;
};

const validarItems = (items) => {
  if (!Array.isArray(items) || items.length === 0)
    throw new HttpError(400, "items debe ser un arreglo con al menos un postre");
  for (const [i, it] of items.entries()) {
    if (!Number.isInteger(it?.postreId) || !Number.isInteger(it?.cantidad) || it.cantidad < 1)
      throw new HttpError(400, `Ítem ${i + 1}: postreId y cantidad deben ser enteros y cantidad >= 1`);
  }
  if (new Set(items.map((it) => it.postreId)).size !== items.length)
    throw new HttpError(400, "No repitas el mismo postre: suma las cantidades");
};

// TRANSACCIÓN: descuenta stock y crea el pedido con sus ítems, o no hace nada.
// Dentro se usa tx (NO prisma). Si algo lanza un error, Prisma hace ROLLBACK automático.
const create = async (userId, items) => {
  validarItems(items);
  const cliente = await clienteDe(userId);

  return prisma.$transaction(async (tx) => {
    let total = 0;
    const lineas = [];

    for (const { postreId, cantidad } of items) {
      const postre = await tx.postre.findUnique({ where: { id: postreId } });
      if (!postre) throw new HttpError(404, `Postre ${postreId} no encontrado`); // → ROLLBACK

      // Actualización CONDICIONAL: solo descuenta si alcanza. Si dos pedidos llegan a la vez,
      // la base garantiza que no se venda la misma unidad dos veces.
      const { count } = await tx.postre.updateMany({
        where: { id: postreId, stock: { gte: cantidad } },
        data: { stock: { decrement: cantidad } },
      });
      if (count === 0) throw new HttpError(409, `Stock insuficiente de "${postre.nombre}"`); // → ROLLBACK

      total += Number(postre.precio) * cantidad;
      lineas.push({ postreId, cantidad, precioUnitario: postre.precio });
    }

    return tx.pedido.create({
      data: { clienteId: cliente.id, total: Math.round(total * 100) / 100, items: { create: lineas } },
      include: pedidoInclude,
    }); 
  });
};

const listByUser = async (userId) => {
  const cliente = await clienteDe(userId);
  return prisma.pedido.findMany({
    where: { clienteId: cliente.id },
    include: pedidoInclude,
    orderBy: { createdAt: "desc" },
  });
};

// TODO (Persona 2) · TRANSACCIÓN: busca el pedido con sus ítems (404), verifica que sea del cliente (403)
// y que esté PENDIENTE (409). Devuelve el stock de cada ítem con increment y cambia estado a CANCELADO.
const cancel = async (userId, pedidoId) => {
  throw new HttpError(501, "cancel() pendiente en el servicio");
};

module.exports = { create, listByUser, cancel };
