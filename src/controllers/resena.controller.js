const resenaService = require("../services/resena.service");
const HttpError = require("../utils/httpError");

const parseId = (value) => {
  const id = Number.parseInt(value, 10);
  if (Number.isNaN(id)) throw new HttpError(400, "El id debe ser numérico");
  return id;
};

// POST /api/postres/:id/resenas → 201 con la reseña creada
const create = async (req, res, next) => {
  try {
    const resena = await resenaService.create(req.user.id, parseId(req.params.id), req.body);
    res.status(201).json(resena);
  } catch (err) {
    next(err);
  }
};

// GET /api/postres/:id/resenas → 200 { postreId, promedio, total, page, limit, pages, data }
const listByPostre = async (req, res, next) => {
  try {
    res.json(await resenaService.listByPostre(parseId(req.params.id), req.query));
  } catch (err) {
    next(err);
  }
};

// DELETE /api/resenas/:id → 204 sin cuerpo
const remove = async (req, res, next) => {
  try {
    await resenaService.remove(req.user, parseId(req.params.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

module.exports = { create, listByPostre, remove };
