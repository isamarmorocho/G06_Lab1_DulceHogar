const { Prisma } = require("@prisma/client");
const mongoose = require("mongoose");

// Traduce los errores conocidos de Prisma a códigos HTTP
const fromPrisma = (err) => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      // Prisma 7 (con adaptador) informa la restricción en meta.driverAdapterError
      const campo = err.meta?.target ?? err.meta?.driverAdapterError?.cause?.constraint?.index ?? "campo único";
      return { status: 409, message: `Ya existe un registro con ese valor único (${campo})` };
    }
    if (err.code === "P2025") return { status: 404, message: "Registro no encontrado" };
    // FK con onDelete: Restrict → no se puede borrar un registro que otros usan
    if (err.code === "P2003") return { status: 409, message: "No se puede eliminar: hay registros relacionados" };
  }
  if (err instanceof Prisma.PrismaClientValidationError) return { status: 400, message: "Datos con tipo o formato inválido" };
  return null;
};

// Unidad 2: traduce los errores de Mongoose/MongoDB
const fromMongoose = (err) => {
  // ValidationError: un mensaje por cada campo que falló (los del esquema, incluida la validación propia)
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((e) => ({ campo: e.path, mensaje: e.message }));
    return { status: 400, message: "Datos inválidos", errors };
  }
  // Índice único (codigo repetido) → código 11000 del driver
  if (err?.code === 11000) {
    const campo = Object.keys(err.keyPattern ?? {})[0] ?? "campo único";
    return { status: 409, message: `Ya existe un documento con ese valor único (${campo})` };
  }
  return null;
};

// Manejador de errores: 4 parámetros. Responde siempre en JSON.
const errorHandler = (err, req, res, next) => {
  const mapped = fromPrisma(err) ?? fromMongoose(err);
  // JSON mal formado en el body → 400
  const status = mapped?.status ?? (err.type === "entity.parse.failed" ? 400 : err.status || 500);
  const body = { error: status === 500 ? "Error interno del servidor" : mapped?.message ?? err.message };
  if (mapped?.errors) body.errors = mapped.errors;
  if (status === 500) {
    console.error(err);
    // En desarrollo se muestra el detalle; en producción, nunca
    if (process.env.NODE_ENV !== "production") body.stack = err.stack;
  }
  res.status(status).json(body);
};

module.exports = errorHandler;
