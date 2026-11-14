const mongoose = require("mongoose");

// Mongoose 9: connect devuelve una promesa (sin callback ni useNewUrlParser).
// Se llama ANTES de listen: si no conecta, la API no arranca.
const connectMongo = async () => {
  if (!process.env.MONGODB_URI) throw new Error("Falta la variable MONGODB_URI");
  await mongoose.connect(process.env.MONGODB_URI);
};

module.exports = connectMongo;
