-- DropForeignKey
ALTER TABLE "Aluno" DROP CONSTRAINT "Aluno_professorId_fkey";

-- AlterTable
ALTER TABLE "Aluno" ALTER COLUMN "professorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Aluno" ADD CONSTRAINT "Aluno_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
