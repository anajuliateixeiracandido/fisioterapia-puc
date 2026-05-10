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

export { listarProfessores }
