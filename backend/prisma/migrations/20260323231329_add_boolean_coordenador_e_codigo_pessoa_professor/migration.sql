/*
  Warnings:

  - The values [COORDENADOR] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `ativo` on the `Fisioterapeuta` table. All the data in the column will be lost.
  - You are about to drop the column `codigoPessoa` on the `Fisioterapeuta` table. All the data in the column will be lost.
  - You are about to drop the column `matricula` on the `Fisioterapeuta` table. All the data in the column will be lost.

*/
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
DROP COLUMN "matricula",
ADD COLUMN     "coordenador" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Professor" ADD COLUMN     "codigoPessoa" TEXT;
