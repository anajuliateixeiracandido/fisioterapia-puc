import prisma from '../lib/prisma'

async function listarProfessores() {
  return prisma.professor.findMany({
    select: {
      id: true,
      codigoPessoa: true,
      coordenador: true,
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

async function associarAlunoProfessor(idProfessor: number, idAluno: number) {
  return prisma.professor.update({
    where: {
      id: idProfessor,
    },
    data: {
      alunos: {
        connect: {
          id: idAluno,
        },
      },
    },
  })
}

async function associarPacienteProfessor(idProfessor: number, idPaciente: number) {
  return prisma.professor.update({
    where: {
      id: idProfessor,
    },
    data: {
      pacientes: {
        connect: {
          id: idPaciente,
        },
      },
    },
  })
}

export { listarProfessores, associarAlunoProfessor, associarPacienteProfessor }
