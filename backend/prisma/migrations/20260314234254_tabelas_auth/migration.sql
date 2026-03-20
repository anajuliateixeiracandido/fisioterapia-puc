-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ALUNO', 'PROFESSOR', 'COORDENADOR');

-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('MASCULINO', 'FEMININO', 'OUTRO', 'NAO_INFORMAR');

-- CreateTable
CREATE TABLE "Fisioterapeuta" (
    "id" SERIAL NOT NULL,
    "nomeCompleto" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "matricula" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fisioterapeuta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Professor" (
    "id" SERIAL NOT NULL,
    "fisioterapeutaId" INTEGER NOT NULL,

    CONSTRAINT "Professor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Aluno" (
    "id" SERIAL NOT NULL,
    "fisioterapeutaId" INTEGER NOT NULL,
    "professorId" INTEGER NOT NULL,

    CONSTRAINT "Aluno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paciente" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nomeCompleto" VARCHAR(200) NOT NULL,
    "dataNascimento" TIMESTAMP(3) NOT NULL,
    "sexo" "Sexo" NOT NULL,
    "cpf" TEXT,
    "telefone" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "email" TEXT,
    "alergias" TEXT,
    "condicaoSaude" VARCHAR(400),
    "demandaReabilitacao" VARCHAR(400),
    "atividadeLimitacao" VARCHAR(400),
    "queixaPrincipal" TEXT,
    "observacoesIniciais" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "professorId" INTEGER NOT NULL,

    CONSTRAINT "Paciente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContatoEmergencia" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "parentesco" TEXT NOT NULL,
    "pacienteId" INTEGER NOT NULL,

    CONSTRAINT "ContatoEmergencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AlunoPacientes" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AlunoPacientes_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Fisioterapeuta_email_key" ON "Fisioterapeuta"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Professor_fisioterapeutaId_key" ON "Professor"("fisioterapeutaId");

-- CreateIndex
CREATE UNIQUE INDEX "Aluno_fisioterapeutaId_key" ON "Aluno"("fisioterapeutaId");

-- CreateIndex
CREATE UNIQUE INDEX "Paciente_codigo_key" ON "Paciente"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Paciente_cpf_key" ON "Paciente"("cpf");

-- CreateIndex
CREATE INDEX "_AlunoPacientes_B_index" ON "_AlunoPacientes"("B");

-- AddForeignKey
ALTER TABLE "Professor" ADD CONSTRAINT "Professor_fisioterapeutaId_fkey" FOREIGN KEY ("fisioterapeutaId") REFERENCES "Fisioterapeuta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aluno" ADD CONSTRAINT "Aluno_fisioterapeutaId_fkey" FOREIGN KEY ("fisioterapeutaId") REFERENCES "Fisioterapeuta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aluno" ADD CONSTRAINT "Aluno_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paciente" ADD CONSTRAINT "Paciente_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContatoEmergencia" ADD CONSTRAINT "ContatoEmergencia_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlunoPacientes" ADD CONSTRAINT "_AlunoPacientes_A_fkey" FOREIGN KEY ("A") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlunoPacientes" ADD CONSTRAINT "_AlunoPacientes_B_fkey" FOREIGN KEY ("B") REFERENCES "Paciente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
