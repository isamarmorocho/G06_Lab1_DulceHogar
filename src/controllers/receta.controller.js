const recetaService = require("../services/receta.service");

// POST /api/recetas → 201 con el documento (y el virtual) · 400 con un mensaje por campo
const create = async (req, res, next) => {
  try {
    const receta = await recetaService.create(req.body);
    res.status(201).json(receta);
  } catch (err) {
    next(err); // errorHandler traduce ValidationError → 400
  }
};

module.exports = { create };
