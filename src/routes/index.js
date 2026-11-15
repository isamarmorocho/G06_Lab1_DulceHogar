const { Router } = require("express");
const authRoutes = require("./auth.routes");
const postreRoutes = require("./postre.routes");
const pedidoRoutes = require("./pedido.routes");
const adminRoutes = require("./admin.routes");
const resenaRoutes = require("./resena.routes"); // Taller A
const categoriaRoutes = require("./categoria.routes"); // Taller B
const recetaRoutes = require("./receta.routes"); // Unidad 2 · MongoDB

// Archivo principal de rutas: cada recurso se monta en su propio prefijo
const router = Router();

router.use("/auth", authRoutes); // → /api/auth
router.use("/postres", postreRoutes); // → /api/postres
router.use("/pedidos", pedidoRoutes); // → /api/pedidos
router.use("/admin", adminRoutes); // → /api/admin
router.use("/resenas", resenaRoutes); // → /api/resenas (Taller A)
router.use("/categorias", categoriaRoutes); // → /api/categorias (Taller B)
router.use("/recetas", recetaRoutes); // → /api/recetas (Unidad 2 · MongoDB)

module.exports = router;
