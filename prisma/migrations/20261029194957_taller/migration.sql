-- AlterEnum
ALTER TYPE "EstadoPedido" ADD VALUE 'CONFIRMADO';

-- CreateTable
CREATE TABLE "resenas" (
    "id" SERIAL NOT NULL,
    "calificacion" SMALLINT NOT NULL,
    "comentario" VARCHAR(300),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,
    "postre_id" INTEGER NOT NULL,

    CONSTRAINT "resenas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_estado_pedido" (
    "id" SERIAL NOT NULL,
    "pedido_id" INTEGER NOT NULL,
    "estado_anterior" "EstadoPedido" NOT NULL,
    "estado_nuevo" "EstadoPedido" NOT NULL,
    "nota" VARCHAR(200),
    "cambiado_por_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_estado_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CategoriaToPostre" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CategoriaToPostre_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "resenas_user_id_postre_id_key" ON "resenas"("user_id", "postre_id");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");

-- CreateIndex
CREATE INDEX "historial_estado_pedido_pedido_id_idx" ON "historial_estado_pedido"("pedido_id");

-- CreateIndex
CREATE INDEX "_CategoriaToPostre_B_index" ON "_CategoriaToPostre"("B");

-- AddForeignKey
ALTER TABLE "resenas" ADD CONSTRAINT "resenas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resenas" ADD CONSTRAINT "resenas_postre_id_fkey" FOREIGN KEY ("postre_id") REFERENCES "postres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_estado_pedido" ADD CONSTRAINT "historial_estado_pedido_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_estado_pedido" ADD CONSTRAINT "historial_estado_pedido_cambiado_por_id_fkey" FOREIGN KEY ("cambiado_por_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoriaToPostre" ADD CONSTRAINT "_CategoriaToPostre_A_fkey" FOREIGN KEY ("A") REFERENCES "categorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoriaToPostre" ADD CONSTRAINT "_CategoriaToPostre_B_fkey" FOREIGN KEY ("B") REFERENCES "postres"("id") ON DELETE CASCADE ON UPDATE CASCADE;
