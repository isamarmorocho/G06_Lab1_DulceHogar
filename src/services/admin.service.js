onst { EstadoPedido } = require("@prisma/client");
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

// Fecha válida (YYYY-MM-DD o ISO) o 400. Con "hasta" de solo fecha se incluye todo ese día
const parseFecha = (valor, nombre, finDeDia = false) => {
  if (valor === undefined) return undefined;
  const texto = finDeDia && /^\d{4}-\d{2}-\d{2}$/.test(valor) ? `${valor}T23:59:59.999Z` : valor;
  const fecha = new Date(texto);
  if (Number.isNaN(fecha.getTime())) throw new HttpError(400, `${nombre} debe ser una fecha válida (AAAA-MM-DD)`);
  return fecha;
};

// Filtros + paginación + orden + conteo en una sola transacción de lectura
// GET /api/admin/pedidos?estado=CANCELADO&desde=2026-10-01&hasta=2026-10-31&page=1&limit=10
const listOrders = async ({ estado, desde, hasta, page, limit }) => {
  const desdeFecha = parseFecha(desde, "desde");
  const hastaFecha = parseFecha(hasta, "hasta", true);
  const where = {
    estado: parseEstado(estado),
    ...((desdeFecha || hastaFecha) && { createdAt: { gte: desdeFecha, lte: hastaFecha } }),
  };

  const take = toInt(limit, 10, 50);
  const pageNum = toInt(page, 1);
  const skip = (pageNum - 1) * take;

  const [total, data] = await prisma.$transaction([
    prisma.pedido.count({ where }),
    prisma.pedido.findMany({
      where,
      include: {
        cliente: { select: { id: true, nombre: true, correo: true } },
        items: { include: { postre: { select: { id: true, nombre: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
  ]);

  return { page: pageNum, limit: take, total, pages: Math.ceil(total / take), data };
};

// Cambia el estado de un pedido (PENDIENTE, ENTREGADO, CANCELADO)
const updateOrderStatus = async (id, estado) => {
  if (estado === undefined) throw new HttpError(400, "Envía el nuevo estado");
  return prisma.pedido.update({ where: { id }, data: { estado: parseEstado(estado) } }); // no existe → P2025 → 404
};

// Consulta avanzada: agrupa los ítems por postre y suma las unidades vendidas (sin contar pedidos cancelados)
const topProducts = async (limit) => {
  const grupos = await prisma.itemPedido.groupBy({
    by: ["postreId"],
    _sum: { cantidad: true },
    where: { pedido: { estado: { not: "CANCELADO" } } },
    orderBy: { _sum: { cantidad: "desc" } },
    take: toInt(limit, 5, 20),
  });

  // Agrega el nombre de cada postre con una sola consulta
  const postres = await prisma.postre.findMany({
    where: { id: { in: grupos.map((g) => g.postreId) } },
    select: { id: true, nombre: true },
  });
  const nombres = new Map(postres.map((p) => [p.id, p.nombre]));

  return grupos.map((g) => ({
    postreId: g.postreId,
    nombre: nombres.get(g.postreId),
    unidadesVendidas: g._sum.cantidad,
  }));
};

module.exports = { listOrders, updateOrderStatus, topProducts };
