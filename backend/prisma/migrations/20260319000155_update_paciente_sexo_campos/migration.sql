/*
  Warnings:

  - The values [MASCULINO,FEMININO,OUTRO,NAO_INFORMAR] on the enum `Sexo` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `createdAt` on the `Paciente` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Paciente` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Sexo_new" AS ENUM ('M', 'F');
ALTER TABLE "Paciente" ALTER COLUMN "sexo" TYPE "Sexo_new" USING ("sexo"::text::"Sexo_new");
ALTER TYPE "Sexo" RENAME TO "Sexo_old";
ALTER TYPE "Sexo_new" RENAME TO "Sexo";
DROP TYPE "public"."Sexo_old";
COMMIT;

-- AlterTable
ALTER TABLE "Paciente" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ALTER COLUMN "telefone" DROP NOT NULL,
ALTER COLUMN "endereco" DROP NOT NULL;
