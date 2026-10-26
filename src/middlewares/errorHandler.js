const { Prisma } = require("@prisma/client");

// Traduce los errores conocidos de Prisma a códigos HTTP
const fromPrisma = (err) => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      // Prisma 7 (con adaptador) informa la restricción en meta.driverAdapterError
      const campo = err.meta?.target ?? err.meta?.driverAdapterError?.cause?.constraint?.index ?? "campo único";
      return { status: 409, message: `Ya existe un registro con ese valor único (${campo})` };
    }
    if (err.code === "P2025") return { status: 404, message: "Registro no encontrado" };
  }
  if (err instanceof Prisma.PrismaClientValidationError) return { status: 400, message: "Datos con tipo o formato inválido" };
  return null;
};

// Manejador de errores: 4 parámetros. Responde siempre en JSON.
const errorHandler = (err, req, res, next) => {
  const mapped = fromPrisma(err);
  // JSON mal formado en el body → 400
  const status = mapped?.status ?? (err.type === "entity.parse.failed" ? 400 : err.status || 500);
  const body = { error: status === 500 ? "Error interno del servidor" : mapped?.message ?? err.message };
  if (status === 500) {
    console.error(err);
    // En desarrollo se muestra el detalle; en producción, nunca
    if (process.env.NODE_ENV !== "production") body.stack = err.stack;
  }
  res.status(status).json(body);
};

module.exports = errorHandler;
