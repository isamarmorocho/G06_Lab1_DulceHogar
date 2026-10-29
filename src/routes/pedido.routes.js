const { Router } = require("express");
const pedidoController = require("../controllers/pedido.controller");
const { authenticateToken } = require("../middlewares/auth");

// Todas las rutas de pedidos requieren un usuario autenticado
const router = Router();
router.use(authenticateToken);

router.post("/", pedidoController.create);
router.get("/", pedidoController.listMine);
router.patch("/:id/cancel", pedidoController.cancel);
router.get("/:id/historial", pedidoController.history); 

module.exports = router;
