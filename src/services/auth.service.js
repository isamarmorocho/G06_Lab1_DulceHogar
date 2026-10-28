const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../db/prisma");
const HttpError = require("../utils/httpError");

// SERVICIO de autenticación: reglas, hash de contraseñas y emisión del JWT

// Campos que se devuelven del usuario: nunca la contraseña
const publicUser = { id: true, email: true, name: true, role: true, cliente: true };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // Hashea con bcrypt.hash(password, 10) y crea el usuario CON su perfil de cliente en una escritura anidada:
// prisma.user.create({ data: { ..., cliente: { create: { nombre: name, correo: email, telefono: phone } } }, select: publicUser })
// Un correo repetido lanza P2002 y errorHandler responde 409.
const register = async ({ email, password, name, phone }) => {
  if (typeof email !== "string" || !EMAIL_RE.test(email))
    throw new HttpError(400, "email es obligatorio y debe tener un formato válido");
  if (typeof password !== "string" || password.length < 8)
    throw new HttpError(400, "password es obligatorio y debe tener al menos 8 caracteres");
  if (typeof name !== "string" || name.trim().length < 2)
    throw new HttpError(400, "name es obligatorio y debe tener al menos 2 caracteres");

  const hash = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: {
      email,
      password: hash,
      name: name.trim(),
      cliente: { create: { nombre: name.trim(), correo: email, telefono: phone } },
    },
    select: publicUser,
  });
};

// Si el usuario no existe O la clave no coincide → 401 con el MISMO mensaje.
// Devuelve jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "4h" })
const login = async ({ email, password }) => {
  const invalid = new HttpError(401, "Correo o contraseña inválidos");
  if (typeof email !== "string" || typeof password !== "string") throw invalid;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw invalid;
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw invalid;

  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "4h",
  });
};

const getProfile = async (id) => {
  const user = await prisma.user.findUnique({ where: { id }, select: publicUser });
  if (!user) throw new HttpError(404, "Usuario no encontrado");
  return user;
};

module.exports = { register, login, getProfile };
