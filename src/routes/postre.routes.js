const { Router } = require("express");
const postreController = require("../controllers/postre.controller");
const resenaController = require("../controllers/resena.controller"); // Taller A
const categoriaController = require("../controllers/categoria.controller"); // Taller B
const { authenticateToken, requireRole } = require("../middlewares/auth");

// Leer el catálogo es público; modificarlo, solo ADMIN
const router = Router();
const onlyAdmin = [authenticateToken, requireRole("ADMIN")];

router.get("/", postreController.list);
// OJO: las rutas fijas (/search, /lote) van ANTES de "/:id"; si no, Express interpretaría "search" o "lote" como un id
router.get("/search", categoriaController.search); // Taller B
router.post("/lote", onlyAdmin, postreController.createMany);
router.get("/:id", postreController.getById);
router.post("/", onlyAdmin, postreController.create);
router.put("/:id/categorias", onlyAdmin, categoriaController.setForPostre); // Taller B: reemplaza con set
router.post("/:id/resenas", authenticateToken, resenaController.create); // Taller A
router.get("/:id/resenas", resenaController.listByPostre); // Taller A (público)
router.put("/:id", onlyAdmin, postreController.update);
router.delete("/:id", onlyAdmin, postreController.remove);

module.exports = router;