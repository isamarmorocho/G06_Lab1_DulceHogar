# Hito 1 · ¿Qué dato de nuestro emprendimiento va a NoSQL?

**Grupo:** G06  **Emprendimiento:** Dulce Hogar (repostería casera)

| Dato | ¿Por qué no encaja bien en una tabla? | Tipo NoSQL | Razón |
|---|---|---|---|
| Fichas de receta de cada postre (ingredientes con cantidad y unidad, alérgenos, tiempo, dificultad) | Cada receta trae un número distinto de ingredientes y de alérgenos; en tablas serían 3 tablas extra y varios JOIN solo para mostrar una receta | **Documental** | La receta se lee completa y de una vez; un documento guarda los ingredientes anidados y cada receta puede tener campos distintos |
| Carrito de compras temporal del cliente (postres y cantidades antes de confirmar el pedido) | Son datos que viven minutos u horas y se descartan; no justifican filas permanentes ni relaciones | **Clave-valor** | Se busca siempre por una sola clave (el id del cliente), se lee y escribe muy seguido y puede caducar solo (TTL) |
| Recomendaciones «quien compró este postre también compró…» | Hay que recorrer relaciones cliente → pedido → postre → otros clientes, que en SQL son JOIN encadenados cada vez más lentos | **Grafo** | El valor está en las conexiones entre clientes y postres, y el grafo las recorre directamente |

**Colección elegida:** `recetas` (documental, MongoDB)

```json
{
  "postreId": 1,
  "codigo": "REC-001",
  "nombre": "Torta de chocolate húmeda",
  "dificultad": "media",
  "tiempoMin": 90,
  "ingredientes": [
    { "nombre": "harina de trigo", "cantidad": 300, "unidad": "g" },
    { "nombre": "cacao amargo", "cantidad": 80, "unidad": "g" },
    { "nombre": "huevos", "cantidad": 4, "unidad": "unidad" },
    { "nombre": "leche", "cantidad": 250, "unidad": "ml" }
  ],
  "alergenos": ["gluten", "lactosa", "huevo"],
  "fotoUrl": "https://dulcehogar.example.com/fotos/torta-chocolate.jpg"
}
```

**Se queda en PostgreSQL:** usuarios, clientes, postres (precio y stock), pedidos e ítems del pedido, reseñas y categorías, y el historial de estados. Son datos con estructura fija y relaciones que deben ser consistentes (por ejemplo, un pedido siempre pertenece a un cliente y descuenta stock en una transacción), y las claves foráneas con `onDelete` y los JOIN de la Unidad 1 ya resuelven eso bien. Del postre, MongoDB solo guarda su `postreId`.
