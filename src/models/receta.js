const mongoose = require("mongoose");
const validator = require("validator");

// MODELO (no el servicio): define la forma del documento, sus validaciones y su middleware de Mongoose.
// Colección: recetas (MongoDB). El postre vive en PostgreSQL; aquí solo se guarda su id (postreId).

// Ingrediente EMBEBIDO: se lee siempre junto con la receta, casi no cambia y no crece sin límite
const ingredienteSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: [true, "El nombre del ingrediente es obligatorio"], trim: true },
    cantidad: {
      type: Number,
      required: [true, "La cantidad del ingrediente es obligatoria"],
      min: [0.01, "La cantidad debe ser mayor que 0"],
    },
    unidad: {
      type: String,
      required: [true, "La unidad del ingrediente es obligatoria"],
      enum: { values: ["g", "kg", "ml", "l", "unidad", "taza", "cda"], message: "La unidad {VALUE} no es válida" },
    },
  },
  { _id: false }
);

const recetaSchema = new mongoose.Schema(
  {
    // Referencia lógica a postres.id de PostgreSQL
    postreId: {
      type: Number,
      required: [true, "El postre es obligatorio"],
      min: [1, "El postreId debe ser mayor o igual a 1"],
      // Validación propia 1: debe ser entero
      validate: { validator: (v) => Number.isInteger(v), message: (p) => `${p.value} no es un número entero` },
    },
    codigo: {
      type: String,
      required: [true, "El código es obligatorio"],
      trim: true,
      uppercase: true,
      unique: true,
      match: [/^REC-\d{3}$/, "El código debe tener el formato REC-001"],
    },
    nombre: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
      minlength: [3, "El nombre debe tener al menos 3 caracteres"],
      maxlength: [80, "El nombre no puede superar los 80 caracteres"],
    },
    dificultad: {
      type: String,
      enum: { values: ["facil", "media", "dificil"], message: "La dificultad debe ser facil, media o dificil" },
      default: "media",
    },
    tiempoMin: {
      type: Number,
      required: [true, "El tiempo de preparación es obligatorio"],
      min: [5, "El tiempo mínimo es 5 minutos"],
      max: [480, "El tiempo máximo es 480 minutos"],
    },
    ingredientes: {
      type: [ingredienteSchema],
      // Validación propia 2: al menos un ingrediente
      validate: { validator: (v) => Array.isArray(v) && v.length > 0, message: "La receta debe tener al menos un ingrediente" },
    },
    alergenos: [String],
    fotoUrl: {
      type: String,
      trim: true,
      // Validación propia 3: usa la librería validator
      validate: { validator: (v) => validator.isURL(v), message: "La foto debe ser una URL válida" },
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true }, // para que el virtual salga en la respuesta
    id: false,
  }
);

// VIRTUAL: no se guarda en la base; se calcula al leer. 90 min → "1 h 30 min"
recetaSchema.virtual("duracion").get(function () {
  const h = Math.floor(this.tiempoMin / 60);
  const m = this.tiempoMin % 60;
  return h ? `${h} h${m ? ` ${m} min` : ""}` : `${m} min`;
});

// MIDDLEWARE DE MONGOOSE (va en el esquema y trabaja con el documento: this). Mongoose 9: sin next
// Normaliza los alérgenos: minúsculas, sin espacios y sin repetidos
recetaSchema.pre("validate", function () {
  if (this.alergenos) this.alergenos = [...new Set(this.alergenos.map((a) => a.trim().toLowerCase()).filter(Boolean))];
});

module.exports = mongoose.model("Receta", recetaSchema);
