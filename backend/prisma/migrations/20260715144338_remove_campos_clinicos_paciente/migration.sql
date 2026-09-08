/*
  Warnings:

  - You are about to drop the column `atividadeLimitacao` on the `Paciente` table. All the data in the column will be lost.
  - You are about to drop the column `demandaReabilitacao` on the `Paciente` table. All the data in the column will be lost.
  - You are about to drop the column `observacoesIniciais` on the `Paciente` table. All the data in the column will be lost.
  - You are about to drop the column `queixaPrincipal` on the `Paciente` table. All the data in the column will be lost.
  - You are about to drop the column `restricaoParticipacao` on the `Paciente` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Paciente" DROP COLUMN "atividadeLimitacao",
DROP COLUMN "demandaReabilitacao",
DROP COLUMN "observacoesIniciais",
DROP COLUMN "queixaPrincipal",
DROP COLUMN "restricaoParticipacao";

-- AlterTable
ALTER TABLE "formulario_cif" ADD COLUMN     "atividadeLimitacao" VARCHAR(400),
ADD COLUMN     "demandaReabilitacao" VARCHAR(400),
ADD COLUMN     "queixaPrincipal" TEXT,
ADD COLUMN     "restricaoParticipacao" VARCHAR(400);
