const jwt = require("jsonwebtoken");
const HttpError = require("../utils/httpError");

// Verifica el token del encabezado Authorization: Bearer <token>
// Sin token → 401. Token inválido o vencido → 403
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return next(new HttpError(401, "Acceso denegado: falta el token"));

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) return next(new HttpError(403, "Token inválido o expirado"));
    req.user = payload; // { id, role } → disponible en controladores y servicios
    next();
  });
};

// Permite el paso solo a los roles indicados. Va DESPUÉS de authenticateToken
// TODO (Persona 2): requireRole(...roles) devuelve un middleware (req, res, next).
// Si req.user.role NO está en roles → next(new HttpError(403, "...")); si está → next().
const requireRole = (...roles) => (req, res, next) => {
   if (!req.user || !roles.includes(req.user.role)) {
    return next(new HttpError(403, "No tienes permisos para esta acción"));
  }
  next();
};

module.exports = { authenticateToken, requireRole };
