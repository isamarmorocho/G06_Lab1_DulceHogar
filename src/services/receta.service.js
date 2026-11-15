const Receta = require("../models/receta");

// SERVICIO: usa el modelo (Receta.create) igual que antes usaba prisma.<modelo>.create.
// Las validaciones del esquema se ejecutan aquí; si fallan lanzan ValidationError y errorHandler responde 400.
const create = async (data) => Receta.create(data);

module.exports = { create };
