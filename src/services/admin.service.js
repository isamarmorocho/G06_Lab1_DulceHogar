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

// Transiciones válidas: PENDIENTE → CONFIRMADO → ENTREGADO · PENDIENTE o CONFIRMADO → CANCELADO
const TRANSICIONES = {
  PENDIENTE: ["CONFIRMADO", "CANCELADO"],
  CONFIRMADO: ["ENTREGADO", "CANCELADO"],
  ENTREGADO: [],
  CANCELADO: [],
};

// PATCH /api/admin/pedidos/:id/estado  { estado, nota? }
// En UNA transacción: cambio condicional de estado + registro en el historial (+ devolver el stock si se cancela).
// Si algo falla, no se guarda nada: el cambio y el historial van juntos o ninguno.
const updateOrderStatus = async (adminId, pedidoId, { estado, nota } = {}) => {
  if (estado === undefined) throw new HttpError(400, "Envía el nuevo estado");
  parseEstado(estado); // estado inválido → 400
  if (nota !== undefined && nota !== null && (typeof nota !== "string" || nota.length > 200))
    throw new HttpError(400, "nota debe ser un texto de hasta 200 caracteres");

  return prisma.$transaction(async (tx) => {
    const pedido = await tx.pedido.findUnique({ where: { id: pedidoId }, include: { items: true } });
    if (!pedido) throw new HttpError(404, "Pedido no encontrado");

    if (!TRANSICIONES[pedido.estado].includes(estado))
      throw new HttpError(409, `Transición no permitida: ${pedido.estado} → ${estado}`);

    // Cambio CONDICIONAL: solo se aplica si el pedido SIGUE en el estado que leímos.
    // Si otro administrador lo cambió mientras tanto, count = 0 y respondemos 409 (ROLLBACK)
    const { count } = await tx.pedido.updateMany({
      where: { id: pedidoId, estado: pedido.estado },
      data: { estado },
    });
    if (count === 0) throw new HttpError(409, "El pedido cambió mientras tanto; vuelve a consultarlo");

    await tx.historialEstadoPedido.create({
      data: { pedidoId, estadoAnterior: pedido.estado, estadoNuevo: estado, nota: nota ?? null, cambiadoPorId: adminId },
    });

    // Al cancelar, el stock reservado vuelve al postre
    if (estado === "CANCELADO") {
      for (const it of pedido.items) {
        await tx.postre.update({ where: { id: it.postreId }, data: { stock: { increment: it.cantidad } } });
      }
    }

    return tx.pedido.findUnique({
      where: { id: pedidoId },
      include: { historial: { orderBy: { createdAt: "asc" } } },
    });
  });
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
