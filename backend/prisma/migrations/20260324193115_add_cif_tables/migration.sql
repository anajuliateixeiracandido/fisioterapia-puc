/*
  Warnings:

  - The values [COORDENADOR] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `ativo` on the `Fisioterapeuta` table. All the data in the column will be lost.
  - You are about to drop the column `codigoPessoa` on the `Fisioterapeuta` table. All the data in the column will be lost.
  - You are about to drop the column `matricula` on the `Fisioterapeuta` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "StatusRelatorio" AS ENUM ('ENVIADO', 'APROVADO', 'NEGADO', 'CORRIGIDO');

-- CreateEnum
CREATE TYPE "CategoriaCIF" AS ENUM ('ESTRUTURA', 'FUNCAO', 'ACTIVIDADE_PARTICIPACAO', 'FACTOR_AMBIENTAL');

-- CreateEnum
CREATE TYPE "TipoCIF" AS ENUM ('CIF', 'CIF_CJ');

-- CreateEnum
CREATE TYPE "TipoFactorAmbiental" AS ENUM ('BARREIRA', 'FACILITADOR');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('ALUNO', 'PROFESSOR');
ALTER TABLE "Fisioterapeuta" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
COMMIT;

-- AlterTable
ALTER TABLE "Aluno" ADD COLUMN     "matricula" TEXT;

-- AlterTable
ALTER TABLE "Fisioterapeuta" DROP COLUMN "ativo",
DROP COLUMN "codigoPessoa",
DROP COLUMN "matricula";

-- AlterTable
ALTER TABLE "Professor" ADD COLUMN     "codigoPessoa" TEXT,
ADD COLUMN     "coordenador" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "formulario_cif" (
    "id" SERIAL NOT NULL,
    "tipoCIF" "TipoCIF" NOT NULL,
    "dataPreenchimento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimaAlteracao" TIMESTAMP(3),
    "condicaoSaude" TEXT,
    "condicaoSaudeDescricao" TEXT NOT NULL,
    "factoresPessoais" TEXT,
    "planoTerapeutico" TEXT,

    CONSTRAINT "formulario_cif_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_cif" (
    "id" SERIAL NOT NULL,
    "formularioCIFId" INTEGER NOT NULL,
    "codigoCIF" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" "CategoriaCIF" NOT NULL,
    "nivel" INTEGER,
    "qualificador1" INTEGER,
    "tipoQualificador1" "TipoFactorAmbiental",
    "qualificador2" INTEGER,
    "qualificador3" INTEGER,
    "qualificador4" INTEGER,
    "observacao" TEXT,

    CONSTRAINT "item_cif_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cif_referencia" (
    "id" SERIAL NOT NULL,
    "tipoCIF" "TipoCIF" NOT NULL,
    "codigo" TEXT NOT NULL,
    "codigoPai" TEXT,
    "descricao" TEXT NOT NULL,
    "categoria" "CategoriaCIF" NOT NULL,
    "nivel" INTEGER NOT NULL,
    "capitulo" INTEGER,
    "ordemExibicao" INTEGER,

    CONSTRAINT "cif_referencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relatorio" (
    "id" SERIAL NOT NULL,
    "status" "StatusRelatorio" NOT NULL DEFAULT 'ENVIADO',
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAprovacao" TIMESTAMP(3),
    "feedbacks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "datasFeedback" TIMESTAMP(3)[] DEFAULT ARRAY[]::TIMESTAMP(3)[],
    "datasEdicao" TIMESTAMP(3)[] DEFAULT ARRAY[]::TIMESTAMP(3)[],
    "fisioterapeutaId" INTEGER NOT NULL,
    "pacienteId" INTEGER NOT NULL,
    "professorResponsavelId" INTEGER,
    "formularioCIFId" INTEGER,

    CONSTRAINT "relatorio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "item_cif_formularioCIFId_idx" ON "item_cif"("formularioCIFId");

-- CreateIndex
CREATE INDEX "item_cif_codigoCIF_idx" ON "item_cif"("codigoCIF");

-- CreateIndex
CREATE INDEX "item_cif_categoria_idx" ON "item_cif"("categoria");

-- CreateIndex
CREATE UNIQUE INDEX "cif_referencia_codigo_key" ON "cif_referencia"("codigo");

-- CreateIndex
CREATE INDEX "cif_referencia_categoria_idx" ON "cif_referencia"("categoria");

-- CreateIndex
CREATE INDEX "cif_referencia_tipoCIF_idx" ON "cif_referencia"("tipoCIF");

-- CreateIndex
CREATE UNIQUE INDEX "relatorio_formularioCIFId_key" ON "relatorio"("formularioCIFId");

-- CreateIndex
CREATE INDEX "relatorio_fisioterapeutaId_idx" ON "relatorio"("fisioterapeutaId");

-- CreateIndex
CREATE INDEX "relatorio_pacienteId_idx" ON "relatorio"("pacienteId");

-- CreateIndex
CREATE INDEX "relatorio_professorResponsavelId_idx" ON "relatorio"("professorResponsavelId");

-- CreateIndex
CREATE INDEX "relatorio_status_idx" ON "relatorio"("status");

-- CreateIndex
CREATE INDEX "relatorio_dataCriacao_idx" ON "relatorio"("dataCriacao");

-- CreateIndex
CREATE INDEX "relatorio_status_dataCriacao_idx" ON "relatorio"("status", "dataCriacao");

-- AddForeignKey
ALTER TABLE "item_cif" ADD CONSTRAINT "item_cif_formularioCIFId_fkey" FOREIGN KEY ("formularioCIFId") REFERENCES "formulario_cif"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_cif" ADD CONSTRAINT "item_cif_codigoCIF_fkey" FOREIGN KEY ("codigoCIF") REFERENCES "cif_referencia"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relatorio" ADD CONSTRAINT "relatorio_fisioterapeutaId_fkey" FOREIGN KEY ("fisioterapeutaId") REFERENCES "Fisioterapeuta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relatorio" ADD CONSTRAINT "relatorio_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relatorio" ADD CONSTRAINT "relatorio_professorResponsavelId_fkey" FOREIGN KEY ("professorResponsavelId") REFERENCES "Professor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relatorio" ADD CONSTRAINT "relatorio_formularioCIFId_fkey" FOREIGN KEY ("formularioCIFId") REFERENCES "formulario_cif"("id") ON DELETE SET NULL ON UPDATE CASCADE;
