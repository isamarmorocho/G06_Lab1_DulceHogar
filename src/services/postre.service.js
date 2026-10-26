const prisma = require("../db/prisma");
const HttpError = require("../utils/httpError");

// SERVICIO (Lab 2): misma interfaz que en el Lab 1, pero ahora persiste con Prisma.
// El modelo ya no es un archivo .js: es el model Postre de prisma/schema.prisma.
// El controlador y las rutas no cambian (salvo la nueva ruta /lote).

const FIELDS = ["nombre", "precio", "stock", "categoria"];

// Las validaciones de negocio siguen aquí: Prisma valida tipos, no reglas como precio >= 0
const validate = (data, { partial = false } = {}) => {
  // Validación 1: nombre obligatorio, texto de al menos 3 caracteres
  if (!partial || data.nombre !== undefined) {
    if (typeof data.nombre !== "string" || data.nombre.trim().length < 3)
      return "nombre es obligatorio y debe tener al menos 3 caracteres";
  }
  // Validación 2: precio numérico mayor o igual a 0
  if (!partial || data.precio !== undefined) {
    if (typeof data.precio !== "number" || Number.isNaN(data.precio) || data.precio < 0)
      return "precio debe ser un número mayor o igual a 0";
  }
  // Validación 3 (extra): stock entero mayor o igual a 0 si viene
  if (data.stock !== undefined) {
    if (!Number.isInteger(data.stock) || data.stock < 0)
      return "stock debe ser un entero mayor o igual a 0";
  }
  return null;
};

// Copia solo los campos permitidos (evita que guarden propiedades extrañas)
const pick = (data) =>
  Object.fromEntries(FIELDS.filter((k) => data[k] !== undefined).map((k) => [k, data[k]]));

const list = () => prisma.postre.findMany({ orderBy: { id: "asc" } });

const getById = async (id) => {
  const item = await prisma.postre.findUnique({ where: { id } });
  if (!item) throw new HttpError(404, "Postre no encontrado");
  return item;
};

// Valida (400) y crea. Si el nombre @unique se repite, Prisma lanza P2002 y errorHandler responde 409.
const create = async (data) => {
  const error = validate(data);
  if (error) throw new HttpError(400, error);
  return prisma.postre.create({ data: pick(data) });
};

// Valida con { partial: true } (400), getById da el 404 y luego actualiza
const update = async (id, data) => {
  const error = validate(data, { partial: true });
  if (error) throw new HttpError(400, error);
  await getById(id); // lanza 404 si no existe
  return prisma.postre.update({ where: { id }, data: pick(data) });
};

// deleteMany no lanza error si no existe: contamos cuántos borró y, si es 0, lanzamos 404
const remove = async (id) => {
  const { count } = await prisma.postre.deleteMany({ where: { id } });
  if (count === 0) throw new HttpError(404, "Postre no encontrado");
};

// TRANSACCIÓN: crea todos los registros o ninguno (todo o nada).
const createMany = (items) =>
  prisma.$transaction(async (tx) => {
    const created = [];
    for (const [i, data] of items.entries()) {
      const error = validate(data);
      if (error) throw new HttpError(400, `Ítem ${i + 1}: ${error}`); 
      created.push(await tx.postre.create({ data: pick(data) }));      
    }
    return created; 
  });

module.exports = { list, getById, create, update, remove, createMany };
