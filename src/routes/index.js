const { Router } = require("express");
const authRoutes = require("./auth.routes");
const postreRoutes = require("./postre.routes");
const pedidoRoutes = require("./pedido.routes");
const adminRoutes = require("./admin.routes");

const resenaRoutes = require("./resena.routes");
const categoriaRoutes = require("./categoria.routes");
// Archivo principal de rutas: cada recurso se monta en su propio prefijo
const router = Router();

router.use("/auth", authRoutes); // → /api/auth
router.use("/postres", postreRoutes); // → /api/postres
router.use("/pedidos", pedidoRoutes); // → /api/pedidos
router.use("/admin", adminRoutes); // → /api/admin
router.use("/resenas", resenaRoutes);
router.use("/categorias", categoriaRoutes);

module.exports = router;
