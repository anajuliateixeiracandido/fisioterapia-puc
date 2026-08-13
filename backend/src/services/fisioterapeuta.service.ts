import prisma from '../lib/prisma'
import { hashPassword } from '../utils/hash.utils'
import { AppError } from '../errors/AppError'
import { CadastroInput, AtualizarPerfilInput } from '../validators/fisioterapeuta.validator'

type ProfessorListado = {
  id: number
  fisioterapeutaId: number
  codigoPessoa: string | null
  coordenador: boolean
  alunos?: Array<{ id: number }>
  fisioterapeuta: {
    nomeCompleto: string
    email: string
  }
}

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

type ListarProfessoresParams = {
  page?: number
  limit?: number
}

function normalizarPaginacao(page?: number, limit?: number) {
  const paginaAtual = Number.isFinite(page) && Number(page) > 0 ? Number(page) : 1
  const limite = Number.isFinite(limit) && Number(limit) > 0 ? Math.min(Number(limit), 100) : 10

  return {
    page: paginaAtual,
    limit: limite,
    skip: (paginaAtual - 1) * limite,
  }
}

function professorSelect() {
  return {
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
      alunos: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      fisioterapeuta: {
        nomeCompleto: 'asc',
      },
    },
  } as const
}

function mapearProfessor(professor: ProfessorListado) {
  return {
    id: professor.id,
    fisioterapeutaId: professor.fisioterapeutaId,
    codigoPessoa: professor.codigoPessoa,
    coordenador: professor.coordenador,
    departamento: 'Fisioterapia',
    totalAlunos: professor.alunos?.length ?? 0,
    fisioterapeuta: professor.fisioterapeuta,
  }
}

async function listarProfessores(params: ListarProfessoresParams = {}) {
  const usarPaginacao = params.page !== undefined || params.limit !== undefined

  if (!usarPaginacao) {
    const professores = await prisma.professor.findMany(professorSelect())
    return professores.map(mapearProfessor)
  }

  const { page, limit, skip } = normalizarPaginacao(params.page, params.limit)

  const [professores, total] = await Promise.all([
    prisma.professor.findMany({
      ...professorSelect(),
      skip,
      take: limit,
    }),
    prisma.professor.count(),
  ])

  return {
    data: professores.map(mapearProfessor),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
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
