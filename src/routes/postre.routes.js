const { Router } = require("express");
const postreController = require("../controllers/postre.controller");


const router = Router();

router.get("/", postreController.list);

router.post("/lote", postreController.createMany);
router.get("/:id", postreController.getById);
router.post("/", postreController.create);
router.put("/:id", postreController.update);
router.delete("/:id", postreController.remove);

module.exports = router;
