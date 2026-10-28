const pedidoService = require("../services/pedido.service");
const HttpError = require("../utils/httpError");

const parseId = (req) => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) throw new HttpError(400, "El id debe ser numérico");
  return id;
};

// POST /api/pedidos → crea el pedido del usuario autenticado (201)
const create = async (req, res, next) => {
  try {
    res.status(201).json(await pedidoService.create(req.user.id, req.body?.items));
  } catch (err) {
    next(err);
  }
};

// GET /api/pedidos → pedidos del usuario con sus ítems y postres
const listMine = async (req, res, next) => {
  try {
    res.json(await pedidoService.listByUser(req.user.id));
  } catch (err) {
    next(err);
  }
};

// PATCH /api/pedidos/:id/cancel → cancela y devuelve el stock
const cancel = async (req, res, next) => {
  try {
    res.json(await pedidoService.cancel(req.user.id, parseId(req)));
  } catch (err) {
    next(err);
  }
};

module.exports = { create, listMine, cancel };
