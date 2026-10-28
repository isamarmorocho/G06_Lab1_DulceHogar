const prisma = require("../db/prisma");
const HttpError = require("../utils/httpError");

// SERVICIO de autenticación: reglas, hash de contraseñas y emisión del JWT

// Campos que se devuelven del usuario: nunca la contraseña
const publicUser = { id: true, email: true, name: true, role: true, cliente: true };

// TODO (Persona 2): valida email, password (8+) y name → 400.
// Hashea con bcrypt.hash(password, 10) y crea el usuario CON su perfil de cliente en una escritura anidada:
// prisma.user.create({ data: { ..., cliente: { create: { nombre: name, correo: email, telefono: phone } } }, select: publicUser })
// Un correo repetido lanza P2002 y errorHandler responde 409.
const register = async ({ email, password, name, phone }) => {
  throw new HttpError(501, "register() pendiente en el servicio");
};

// TODO (Persona 2): busca con findUnique({ where: { email } }) y compara con bcrypt.compare.
// Si el usuario no existe O la clave no coincide → 401 con el MISMO mensaje.
// Devuelve jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "4h" })
const login = async ({ email, password }) => {
  throw new HttpError(501, "login() pendiente en el servicio");
};

const getProfile = async (id) => {
  const user = await prisma.user.findUnique({ where: { id }, select: publicUser });
  if (!user) throw new HttpError(404, "Usuario no encontrado");
  return user;
};

module.exports = { register, login, getProfile };
