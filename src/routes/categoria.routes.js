const { Router } = require("express");
const categoriaController = require("../controllers/categoria.controller");
const { authenticateToken, requireRole } = require("../middlewares/auth");

// TALLER · B: crear categorías solo ADMIN; listar es público
// (la búsqueda /postres/search y PUT /postres/:id/categorias viven en postre.routes.js)
const router = Router();

router.post("/", authenticateToken, requireRole("ADMIN"), categoriaController.create);
router.get("/", categoriaController.list);
router.get("/:id/postres", categoriaController.postresDeCategoria); // reto opcional

module.exports = router;
