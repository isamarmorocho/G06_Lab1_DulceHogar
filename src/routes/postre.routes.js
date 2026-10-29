const { Router } = require("express");
const postreController = require("../controllers/postre.controller");
const { authenticateToken, requireRole } = require("../middlewares/auth");
const resenaController = require("../controllers/resena.controller");

// Leer el catálogo es público; modificarlo, solo ADMIN
const router = Router();
const onlyAdmin = [authenticateToken, requireRole("ADMIN")];

router.get("/", postreController.list);
router.get("/:id", postreController.getById);
router.post("/", onlyAdmin, postreController.create);
// OJO: /lote va ANTES de "/:id"; si no, Express interpretaría "lote" como un id
router.post("/lote", onlyAdmin, postreController.createMany);
router.put("/:id", onlyAdmin, postreController.update);
router.delete("/:id", onlyAdmin, postreController.remove);

router.post("/:id/resenas", authenticateToken, resenaController.create);
router.get("/:id/resenas", resenaController.listByPostre);


module.exports = router;
