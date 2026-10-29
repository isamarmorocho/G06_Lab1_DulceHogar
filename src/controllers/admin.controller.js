const adminService = require("../services/admin.service");
const HttpError = require("../utils/httpError");

// GET /api/admin/pedidos?estado=PENDIENTE&desde=2026-10-01&page=1&limit=10
const listOrders = async (req, res, next) => {
  try {
    res.json(await adminService.listOrders(req.query));
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/pedidos/:id/estado  { "estado": "CONFIRMADO", "nota": "Pago recibido" }
const updateOrderStatus = async (req, res, next) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) throw new HttpError(400, "El id debe ser numérico");
    res.json(await adminService.updateOrderStatus(req.user.id, id, req.body ?? {}));
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/reportes/top-postres?limit=5
const topProducts = async (req, res, next) => {
  try {
    res.json(await adminService.topProducts(req.query.limit));
  } catch (err) {
    next(err);
  }
};

module.exports = { listOrders, updateOrderStatus, topProducts };
