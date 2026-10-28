const { Router } = require("express");
const adminController = require("../controllers/admin.controller");
const { authenticateToken, requireRole } = require("../middlewares/auth");

// Módulo de administración: un solo lugar con la protección de rol
const router = Router();
router.use(authenticateToken, requireRole("ADMIN"));

router.get("/pedidos", adminController.listOrders);
router.patch("/pedidos/:id/estado", adminController.updateOrderStatus);
router.get("/reportes/top-postres", adminController.topProducts);

module.exports = router;
