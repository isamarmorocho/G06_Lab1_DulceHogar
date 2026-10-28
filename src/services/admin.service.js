const { EstadoPedido } = require("@prisma/client");
const prisma = require("../db/prisma");
const HttpError = require("../utils/httpError");

// ADMIN SERVICE: consultas y acciones que solo hace el administrador

const toInt = (value, def, max) => {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n) || n < 1) return def;
  return max ? Math.min(n, max) : n;
};

const parseEstado = (estado) => {
  if (estado === undefined) return undefined;
  if (!Object.values(EstadoPedido).includes(estado))
    throw new HttpError(400, `estado debe ser uno de: ${Object.values(EstadoPedido).join(", ")}`);
  return estado;
};

// TODO (Persona 3): filtros + paginación.
// where = { estado: parseEstado(estado), createdAt: { gte: desde, lte: hasta } }  (fechas inválidas → 400)
// take = toInt(limit, 10, 50); skip = (page - 1) * take
// Usa prisma.$transaction([prisma.pedido.count({ where }), prisma.pedido.findMany({ where, include, orderBy, skip, take })])
// y responde { page, limit, total, pages, data }
const listOrders = async ({ estado, desde, hasta, page, limit }) => {
  throw new HttpError(501, "listOrders() pendiente en el servicio");
};

const updateOrderStatus = async (id, estado) => {
  if (estado === undefined) throw new HttpError(400, "Envía el nuevo estado");
  return prisma.pedido.update({ where: { id }, data: { estado: parseEstado(estado) } }); // no existe → P2025 → 404
};

// TODO (Persona 3) · consulta avanzada: prisma.itemPedido.groupBy({ by: ["postreId"], _sum: { cantidad: true },
// where: { pedido: { estado: { not: "CANCELADO" } } }, orderBy: { _sum: { cantidad: "desc" } }, take })
// y agrega el nombre de cada postre → [{ postreId, nombre, unidadesVendidas }]
const topProducts = async (limit) => {
  throw new HttpError(501, "topProducts() pendiente en el servicio");
};

module.exports = { listOrders, updateOrderStatus, topProducts };
