const { Router } = require("express");
const authController = require("../controllers/auth.controller");
const { authenticateToken } = require("../middlewares/auth");

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", authenticateToken, authController.me); // ruta protegida

module.exports = router;
