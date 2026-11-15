const { Router } = require("express");
const recetaController = require("../controllers/receta.controller");

const router = Router();

router.post("/", recetaController.create);

module.exports = router;
