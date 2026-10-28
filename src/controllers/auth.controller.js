const authService = require("../services/auth.service");

// CONTROLADOR: lee la petición, llama al servicio y decide código + JSON

const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body ?? {});
    res.status(201).json({ message: "Usuario registrado", user }); // 201
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const token = await authService.login(req.body ?? {});
    res.json({ token }); // 200
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    res.json(await authService.getProfile(req.user.id)); // req.user lo puso authenticateToken
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, me };
