const categoriaService = require("../services/categoria.service");
const HttpError = require("../utils/httpError");

const parseId = (value) => {
  const id = Number.parseInt(value, 10);
  if (Number.isNaN(id)) throw new HttpError(400, "El id debe ser numérico");
  return id;
};

// POST /api/categorias → 201
const create = async (req, res, next) => {
  try {
    res.status(201).json(await categoriaService.create(req.body ?? {}));
  } catch (err) {
    next(err);
  }
};

// GET /api/categorias → 200
const list = async (req, res, next) => {
  try {
    res.json(await categoriaService.list());
  } catch (err) {
    next(err);
  }
};

// PUT /api/postres/:id/categorias → 200 (reemplaza las categorías del postre)
const setForPostre = async (req, res, next) => {
  try {
    res.json(await categoriaService.setForPostre(parseId(req.params.id), req.body ?? {}));
  } catch (err) {
    next(err);
  }
};

// GET /api/postres/search → 200 { page, limit, total, pages, data }
const search = async (req, res, next) => {
  try {
    res.json(await categoriaService.search(req.query));
  } catch (err) {
    next(err);
  }
};

// GET /api/categorias/:id/postres → 200 (reto opcional)
const postresDeCategoria = async (req, res, next) => {
  try {
    res.json(await categoriaService.postresDeCategoria(parseId(req.params.id), req.query));
  } catch (err) {
    next(err);
  }
};

module.exports = { create, list, setForPostre, search, postresDeCategoria };
