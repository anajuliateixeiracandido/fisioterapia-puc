import prisma from '../lib/prisma'
import { hashPassword } from '../utils/hash.utils'
import { AppError } from '../errors/AppError'
import { CadastroInput } from '../validators/fisioterapeuta.validator'

async function cadastrarFisioterapeuta(dados: CadastroInput) {
  const senhaHash = await hashPassword(dados.senha)

  if (dados.role === 'PROFESSOR') {
    return prisma.fisioterapeuta.create({
      data: {
        nomeCompleto: dados.nomeCompleto,
        email: dados.email,
        senha: senhaHash,
        role: 'PROFESSOR',
        professor: {
          create: {
            codigoPessoa: dados.codigoPessoa ?? null,
            coordenador: false,
          },
        },
      },
      select: {
        uid: true,
        nomeCompleto: true,
        email: true,
        role: true,
        createdAt: true,
        professor: {
          select: {
            id: true,
            codigoPessoa: true,
          },
        },
      },
    })
  }

  let professorId: number | null = null

  if (dados.codigoPessoaProfessor) {
    const professor = await prisma.professor.findFirst({
      where: { codigoPessoa: dados.codigoPessoaProfessor },
    })

    if (!professor) {
      throw new AppError(404, 'PROFESSOR_NOT_FOUND', 'Professor não encontrado')
    }

    professorId = professor.id
  }

  return prisma.fisioterapeuta.create({
    data: {
      nomeCompleto: dados.nomeCompleto,
      email: dados.email,
      senha: senhaHash,
      role: 'ALUNO',
      aluno: {
        create: {
          matricula: dados.matricula ?? null,
          professorId: professorId,
        },
      },
    },
    select: {
      uid: true,
      nomeCompleto: true,
      email: true,
      role: true,
      createdAt: true,
      aluno: {
        select: {
          id: true,
          matricula: true,
        },
      },
    },
  })
}

export { cadastrarFisioterapeuta }