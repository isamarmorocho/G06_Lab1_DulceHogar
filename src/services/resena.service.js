const prisma = require("../db/prisma");
const HttpError = require("../utils/httpError");

// TALLER · TARJETA A · Reseñas de un postre (relación 1:N, único compuesto y agregación)

const toInt = (value, def, max) => {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n) || n < 1) return def;
  return max ? Math.min(n, max) : n;
};

// Validaciones del body → 400
const validate = ({ calificacion, comentario }) => {
  if (!Number.isInteger(calificacion) || calificacion < 1 || calificacion > 5)
    return "calificacion debe ser un entero entre 1 y 5";
  if (comentario !== undefined && comentario !== null) {
    if (typeof comentario !== "string") return "comentario debe ser un texto";
    if (comentario.length > 300) return "comentario no puede superar los 300 caracteres";
  }
  return null;
};

const getPostre = async (postreId) => {
  const postre = await prisma.postre.findUnique({ where: { id: postreId } });
  if (!postre) throw new HttpError(404, "Postre no encontrado"); // → 404
  return postre;
};

// POST /api/postres/:id/resenas → 201
// Orden de errores: 400 (body) → 404 (postre) → 403 (reto: no lo compró) → 409 (ya lo reseñó)
const create = async (userId, postreId, body) => {
  const error = validate(body ?? {});
  if (error) throw new HttpError(400, error);
  await getPostre(postreId);

  // RETO OPCIONAL: solo reseña quien tenga un pedido ENTREGADO que incluya ese postre (filtro some)
  const compro = await prisma.pedido.findFirst({
    where: { estado: "ENTREGADO", cliente: { userId }, items: { some: { postreId } } },
    select: { id: true },
  });
  if (!compro) throw new HttpError(403, "Solo puedes reseñar un postre que ya recibiste");

  // Único compuesto @@unique([userId, postreId]): findUnique usa la clave userId_postreId
  const yaReseno = await prisma.resena.findUnique({ where: { userId_postreId: { userId, postreId } } });
  if (yaReseno) throw new HttpError(409, "Ya reseñaste este postre");

  // Si dos peticiones llegan a la vez, la base rechaza la segunda con P2002 y errorHandler responde 409
  return prisma.resena.create({
    data: { calificacion: body.calificacion, comentario: body.comentario ?? null, userId, postreId },
  });
};

// GET /api/postres/:id/resenas?page&limit → promedio con aggregate + lista paginada con el autor
const listByPostre = async (postreId, { page, limit }) => {
  await getPostre(postreId);

  const take = toInt(limit, 10, 50);
  const pageNum = toInt(page, 1);
  const skip = (pageNum - 1) * take;

  const [stats, data] = await prisma.$transaction([
    prisma.resena.aggregate({ where: { postreId }, _avg: { calificacion: true }, _count: { _all: true } }),
    prisma.resena.findMany({
      where: { postreId },
      include: { user: { select: { id: true, name: true } } }, // nombre del autor, nunca la contraseña
      orderBy: { createdAt: "desc" }, // más recientes primero
      skip,
      take,
    }),
  ]);

  const total = stats._count._all;
  const promedio = stats._avg.calificacion === null ? null : Math.round(stats._avg.calificacion * 100) / 100;
  return { postreId, promedio, total, page: pageNum, limit: take, pages: Math.ceil(total / take), data };
};

// DELETE /api/resenas/:id → 204. Solo el autor o un ADMIN
const remove = async (user, resenaId) => {
  const resena = await prisma.resena.findUnique({ where: { id: resenaId } });
  if (!resena) throw new HttpError(404, "Reseña no encontrada");
  if (resena.userId !== user.id && user.role !== "ADMIN") throw new HttpError(403, "Solo el autor o un ADMIN puede borrar la reseña");
  await prisma.resena.delete({ where: { id: resenaId } });
};

module.exports = { create, listByPostre, remove };
