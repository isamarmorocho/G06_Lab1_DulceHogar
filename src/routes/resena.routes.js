const { Router } = require("express");
const resenaController = require("../controllers/resena.controller");
const { authenticateToken } = require("../middlewares/auth");

// TALLER · A: las rutas de crear y listar viven en postre.routes.js (/postres/:id/resenas);
// aquí solo queda el borrado, que usa el id de la reseña
const router = Router();

router.delete("/:id", authenticateToken, resenaController.remove);

module.exports = router;
