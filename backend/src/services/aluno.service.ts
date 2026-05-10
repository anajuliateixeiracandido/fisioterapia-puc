import prisma from '../lib/prisma'

async function buscarAlunos() {
  return prisma.aluno.findMany({
    select: {
      id: true,
      matricula: true,
      fisioterapeuta: {
        select: {
          uid: true,
          nomeCompleto: true,
          email: true,
          role: true,
        },
      },
    },
  })
}

async function associarPacienteAluno(pacienteId: number, alunoId: number) {
  return prisma.paciente.update({
    where: { id: pacienteId },
    data: {
      alunos: {
        connect: { id: alunoId },
      },
    },
    select: {
      codigo: true,
    },
  })
}

export { buscarAlunos, associarPacienteAluno }
