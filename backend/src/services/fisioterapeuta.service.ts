import prisma from '../lib/prisma'
import { hashPassword } from '../utils/hash.utils'
import { AppError } from '../errors/AppError'
import { CadastroInput, AtualizarPerfilInput } from '../validators/fisioterapeuta.validator'

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
            coordenador: dados.coordenador ?? false,
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

  const professor = await prisma.professor.findFirst({
    where: { codigoPessoa: dados.codigoPessoaProfessor },
  })

  if (!professor) {
    throw new AppError(404, 'PROFESSOR_NOT_FOUND', 'Professor não encontrado')
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
          professorId: professor.id,
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

async function listarProfessores() {
  return prisma.professor.findMany({
    select: {
      id: true,
      fisioterapeutaId: true,
      codigoPessoa: true,
      coordenador: true,
      fisioterapeuta: {
        select: {
          nomeCompleto: true,
          email: true,
        },
      },
    },
    orderBy: {
      fisioterapeuta: {
        nomeCompleto: 'asc',
      },
    },
  })
}

async function obterPerfil(fisioterapeutaId: number) {
  const fisioterapeuta = await prisma.fisioterapeuta.findUnique({
    where: { id: fisioterapeutaId },
    select: {
      uid: true,
      nomeCompleto: true,
      email: true,
      role: true,
      professor: {
        select: {
          codigoPessoa: true,
          coordenador: true,
        },
      },
      aluno: {
        select: {
          matricula: true,
          professor: {
            select: {
              codigoPessoa: true,
              fisioterapeuta: {
                select: {
                  nomeCompleto: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!fisioterapeuta) {
    throw new AppError(404, 'NOT_FOUND', 'Usuário não encontrado')
  }

  return fisioterapeuta
}

async function atualizarPerfil(fisioterapeutaId: number, dados: AtualizarPerfilInput) {
  return prisma.fisioterapeuta.update({
    where: { id: fisioterapeutaId },
    data: {
      nomeCompleto: dados.nomeCompleto,
    },
    select: {
      uid: true,
      nomeCompleto: true,
      email: true,
      role: true,
      professor: {
        select: {
          codigoPessoa: true,
          coordenador: true,
        },
      },
      aluno: {
        select: {
          matricula: true,
          professor: {
            select: {
              codigoPessoa: true,
              fisioterapeuta: {
                select: {
                  nomeCompleto: true,
                },
              },
            },
          },
        },
      },
    },
  })
}

export { cadastrarFisioterapeuta, listarProfessores, obterPerfil, atualizarPerfil }
