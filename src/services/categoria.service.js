const prisma = require("../db/prisma");
const HttpError = require("../utils/httpError");

// TALLER · TARJETA B · Categorías y búsqueda avanzada (relación N:M implícita y consultas dinámicas)

const toInt = (value, def, max) => {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n) || n < 1) return def;
  return max ? Math.min(n, max) : n;
};

// POST /api/categorias → 201. nombre vacío → 400; nombre repetido → P2002 → 409 (lo traduce errorHandler)
const create = async ({ nombre }) => {
  if (typeof nombre !== "string" || nombre.trim().length === 0 || nombre.trim().length > 50)
    throw new HttpError(400, "nombre es obligatorio y debe tener entre 1 y 50 caracteres");
  return prisma.categoria.create({ data: { nombre: nombre.trim() } });
};

// GET /api/categorias → cada categoría con el número de postres (_count)
const list = () =>
  prisma.categoria.findMany({
    include: { _count: { select: { postres: true } } },
    orderBy: { nombre: "asc" },
  });

// PUT /api/postres/:id/categorias  { categoriaIds: [1, 2] } → REEMPLAZA las categorías del postre con set
const setForPostre = async (postreId, { categoriaIds }) => {
  if (!Array.isArray(categoriaIds) || !categoriaIds.every((n) => Number.isInteger(n)))
    throw new HttpError(400, "categoriaIds debe ser un arreglo de enteros");

  const postre = await prisma.postre.findUnique({ where: { id: postreId } });
  if (!postre) throw new HttpError(404, "Postre no encontrado");

  const ids = [...new Set(categoriaIds)];
  const existentes = await prisma.categoria.findMany({ where: { id: { in: ids } }, select: { id: true } });
  const faltantes = ids.filter((id) => !existentes.some((c) => c.id === id));
  if (faltantes.length > 0) throw new HttpError(404, `Categoría(s) inexistente(s): ${faltantes.join(", ")}`);

  return prisma.postre.update({
    where: { id: postreId },
    data: { categorias: { set: ids.map((id) => ({ id })) } }, // set: deja EXACTAMENTE estas categorías
    include: { categorias: true },
  });
};

// Criterios de orden permitidos. Cualquier otro valor → 400
const ORDENES = {
  precio_asc: { precio: "asc" },
  precio_desc: { precio: "desc" },
  nombre: { nombre: "asc" },
};

const toPrecio = (valor, nombre) => {
  if (valor === undefined) return undefined;
  const n = Number(valor);
  if (valor === "" || Number.isNaN(n) || n < 0) throw new HttpError(400, `${nombre} debe ser un número mayor o igual a 0`);
  return n;
};

// GET /api/postres/search?q&categoria&min&max&sort&page&limit → filtros combinables + orden dinámico + paginación
const search = async ({ q, categoria, min, max, sort = "nombre", page, limit }) => {
  const orderBy = ORDENES[sort];
  if (!orderBy) throw new HttpError(400, `sort debe ser uno de: ${Object.keys(ORDENES).join(", ")}`);

  const minimo = toPrecio(min, "min");
  const maximo = toPrecio(max, "max");

  // Cada filtro solo se agrega si llegó: así se pueden combinar
  const where = {
    ...(q && { nombre: { contains: q, mode: "insensitive" } }), // contiene, sin distinguir mayúsculas
    ...(categoria && { categorias: { some: { nombre: { equals: categoria, mode: "insensitive" } } } }), // N:M con some
    ...((minimo !== undefined || maximo !== undefined) && { precio: { gte: minimo, lte: maximo } }), // rango de precio
  };

  const take = toInt(limit, 10, 50);
  const pageNum = toInt(page, 1);

  const [total, data] = await prisma.$transaction([
    prisma.postre.count({ where }),
    prisma.postre.findMany({
      where,
      include: { categorias: { select: { id: true, nombre: true } } },
      orderBy,
      skip: (pageNum - 1) * take,
      take,
    }),
  ]);

  return { page: pageNum, limit: take, total, pages: Math.ceil(total / take), data };
};

// RETO OPCIONAL · GET /api/categorias/:id/postres?page&limit → postres de una categoría, paginados
const postresDeCategoria = async (categoriaId, { page, limit }) => {
  const categoria = await prisma.categoria.findUnique({ where: { id: categoriaId } });
  if (!categoria) throw new HttpError(404, "Categoría no encontrada");

  const take = toInt(limit, 10, 50);
  const pageNum = toInt(page, 1);
  const where = { categorias: { some: { id: categoriaId } } };

  const [total, data] = await prisma.$transaction([
    prisma.postre.count({ where }),
    prisma.postre.findMany({ where, orderBy: { nombre: "asc" }, skip: (pageNum - 1) * take, take }),
  ]);
  return { categoriaId, nombre: categoria.nombre, page: pageNum, limit: take, total, pages: Math.ceil(total / take), data };
};

module.exports = { create, list, setForPostre, search, postresDeCategoria };
