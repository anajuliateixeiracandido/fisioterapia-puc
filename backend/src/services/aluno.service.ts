import { Prisma } from '@prisma/client'
import prisma from '../lib/prisma'

type ListarAlunosParams = {
  page?: number
  limit?: number
  busca?: string
  professorFisioterapeutaId?: number
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

function montarWhere({ busca, professorFisioterapeutaId }: ListarAlunosParams): Prisma.AlunoWhereInput {
  const andConditions: Prisma.AlunoWhereInput[] = []
  const termoBusca = busca?.trim()

  if (professorFisioterapeutaId) {
    andConditions.push({
      professor: {
        fisioterapeutaId: professorFisioterapeutaId,
      },
    })
  }

  if (termoBusca) {
    andConditions.push({
      OR: [
        {
          matricula: {
            contains: termoBusca,
            mode: 'insensitive',
          },
        },
        {
          fisioterapeuta: {
            nomeCompleto: {
              contains: termoBusca,
              mode: 'insensitive',
            },
          },
        },
        {
          fisioterapeuta: {
            email: {
              contains: termoBusca,
              mode: 'insensitive',
            },
          },
        },
      ],
    })
  }

  return andConditions.length > 0 ? { AND: andConditions } : {}
}

async function listarAlunos(params: ListarAlunosParams = {}) {
  const { page, limit, skip } = normalizarPaginacao(params.page, params.limit)
  const where = montarWhere(params)

  const [alunos, total] = await Promise.all([
    prisma.aluno.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        fisioterapeuta: {
          nomeCompleto: 'asc',
        },
      },
      select: {
        id: true,
        matricula: true,
        fisioterapeutaId: true,
        professorId: true,
        fisioterapeuta: {
          select: {
            nomeCompleto: true,
            email: true,
          },
        },
        professor: {
          select: {
            id: true,
            codigoPessoa: true,
            fisioterapeutaId: true,
            fisioterapeuta: {
              select: {
                nomeCompleto: true,
                email: true,
              },
            },
          },
        },
      },
    }),
    prisma.aluno.count({ where }),
  ])

  return {
    data: alunos,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

async function listarAlunosPorProfessor(professorFisioterapeutaId: number, params: ListarAlunosParams = {}) {
  return listarAlunos({
    ...params,
    professorFisioterapeutaId,
  })
}

export { listarAlunos, listarAlunosPorProfessor }
