const postreService = require("../services/postre.service");
const HttpError = require("../utils/httpError");

// CONTROLADOR: lee la petición (params, body), llama al servicio y decide código + JSON.
// No lee archivos ni valida reglas de negocio. Los errores van a next(err) → errorHandler.

const parseId = (req) => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) throw new HttpError(400, "El id debe ser numérico");
  return id;
};

// GET / → 200
const list = async (req, res, next) => {
  try {
    res.json(await postreService.list());
  } catch (err) {
    next(err);
  }
};

// GET /:id → 200 (el servicio lanza 404 si no existe)
const getById = async (req, res, next) => {
  try {
    res.json(await postreService.getById(parseId(req)));
  } catch (err) {
    next(err);
  }
};

// POST / → 201 con el registro creado (400 si no valida)
const create = async (req, res, next) => {
  try {
    const item = await postreService.create(req.body ?? {});
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
};

// PUT /:id → 200 con el registro actualizado (400 o 404)
const update = async (req, res, next) => {
  try {
    res.json(await postreService.update(parseId(req), req.body ?? {}));
  } catch (err) {
    next(err);
  }
};

// DELETE /:id → 204 sin cuerpo (404 si no existe)
const remove = async (req, res, next) => {
  try {
    await postreService.remove(parseId(req));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

// POST /lote → 201 si todos se crean (400 si el body no es un arreglo con al menos un elemento)
const createMany = async (req, res, next) => {
  try {
    if (!Array.isArray(req.body) || req.body.length === 0) {
      throw new HttpError(400, "El body debe ser un arreglo con al menos un elemento");
    }
    res.status(201).json(await postreService.createMany(req.body));
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getById, create, update, remove, createMany };
