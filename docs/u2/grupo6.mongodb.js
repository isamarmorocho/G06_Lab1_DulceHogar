// Hito 2 · Playground del grupo 6 · Dulce Hogar (MongoDB for VS Code o mongosh)
use("dulce_hogar_lab");

// Para poder ejecutar el archivo varias veces
db.getCollection("recetas").drop();
db.getCollection("lotes").drop();

// 1. createCollection con $jsonSchema: 1 enum, 1 rango (minimum/maximum) y 1 arreglo
// (con additionalProperties: false se declara _id)
db.createCollection("recetas", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["postreId", "codigo", "nombre", "dificultad", "tiempoMin", "ingredientes"],
      additionalProperties: false,
      properties: {
        _id: { bsonType: "objectId" },
        postreId: { bsonType: "int", minimum: 1, description: "id del postre en PostgreSQL" },
        codigo: { bsonType: "string", pattern: "^REC-[0-9]{3}$" },
        nombre: { bsonType: "string", minLength: 3, maxLength: 80 },
        dificultad: { enum: ["facil", "media", "dificil"] }, // ENUM
        tiempoMin: { bsonType: "int", minimum: 5, maximum: 480 }, // RANGO
        ingredientes: {
          // ARREGLO de objetos embebidos
          bsonType: "array",
          minItems: 1,
          items: {
            bsonType: "object",
            required: ["nombre", "cantidad", "unidad"],
            properties: {
              nombre: { bsonType: "string" },
              cantidad: { bsonType: "number", minimum: 0.01 },
              unidad: { enum: ["g", "kg", "ml", "l", "unidad", "taza", "cda"] },
            },
          },
        },
        alergenos: { bsonType: "array", items: { bsonType: "string" } },
        fotoUrl: { bsonType: "string" },
      },
    },
  },
});

db.createCollection("lotes"); // colección referenciada: crece con cada tanda

// 2. Dos inserts válidos
const r1 = db.recetas.insertOne({
  postreId: 1,
  codigo: "REC-001",
  nombre: "Torta de chocolate húmeda",
  dificultad: "media",
  tiempoMin: 90,
  ingredientes: [
    { nombre: "harina de trigo", cantidad: 300, unidad: "g" },
    { nombre: "cacao amargo", cantidad: 80, unidad: "g" },
    { nombre: "huevos", cantidad: 4, unidad: "unidad" },
  ],
  alergenos: ["gluten", "lactosa", "huevo"],
});
const r2 = db.recetas.insertOne({
  postreId: 2,
  codigo: "REC-002",
  nombre: "Cupcake de vainilla",
  dificultad: "facil",
  tiempoMin: 45,
  ingredientes: [
    { nombre: "harina de trigo", cantidad: 250, unidad: "g" },
    { nombre: "esencia de vainilla", cantidad: 2, unidad: "cda" },
  ],
  alergenos: ["gluten", "huevo"],
});
console.log("Válidos insertados:", r1.insertedId, r2.insertedId);

db.lotes.insertMany([
  { recetaId: r1.insertedId, fecha: new Date("2026-11-09"), unidades: 2, observaciones: "Pedido de cumpleaños" },
  { recetaId: r1.insertedId, fecha: new Date("2026-11-10"), unidades: 1 },
  { recetaId: r2.insertedId, fecha: new Date("2026-11-10"), unidades: 24 },
]);

// 3. Dos inserts rechazados: se envuelven en try/catch y se imprime qué campo falló
const campoFallido = (err) => {
  const campos = [];
  for (const regla of err.errInfo?.details?.schemaRulesNotSatisfied ?? []) {
    for (const falta of regla.missingProperties ?? []) campos.push(`${falta} (falta)`);
    for (const p of regla.propertiesNotSatisfied ?? []) campos.push(p.propertyName);
  }
  return campos;
};

try {
  // Rechazado 1: dificultad fuera del enum y tiempo fuera del rango (9999 > 480)
  db.recetas.insertOne({
    postreId: 3,
    codigo: "REC-003",
    nombre: "Brownie clásico",
    dificultad: "imposible",
    tiempoMin: 9999,
    ingredientes: [{ nombre: "chocolate", cantidad: 200, unidad: "g" }],
  });
} catch (err) {
  console.log("Rechazado 1 · campo(s) que fallaron:", campoFallido(err));
}

try {
  // Rechazado 2: arreglo de ingredientes vacío (minItems: 1) y falta el campo obligatorio tiempoMin
  db.recetas.insertOne({
    postreId: 3,
    codigo: "REC-004",
    nombre: "Galletas de avena",
    dificultad: "facil",
    ingredientes: [],
  });
} catch (err) {
  console.log("Rechazado 2 · campo(s) que fallaron:", campoFallido(err));
}

// 4. $lookup entre dos colecciones (+ $unwind si debe salir un solo objeto)
// a) receta → sus lotes (un arreglo de lotes por receta, no hace falta $unwind)
db.recetas.aggregate([
  { $lookup: { from: "lotes", localField: "_id", foreignField: "recetaId", as: "lotes" } },
  { $project: { _id: 0, codigo: 1, nombre: 1, lotes: { fecha: 1, unidades: 1 } } },
]);

// b) lote → su receta (sale UN solo objeto, por eso se usa $unwind)
db.lotes.aggregate([
  { $lookup: { from: "recetas", localField: "recetaId", foreignField: "_id", as: "receta" } },
  { $unwind: "$receta" },
  { $project: { _id: 0, fecha: 1, unidades: 1, receta: "$receta.nombre", tiempoMin: "$receta.tiempoMin" } },
]);
