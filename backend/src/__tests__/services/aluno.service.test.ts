import { describe, it, expect, vi, beforeEach } from 'vitest'

const { prismaMock } = vi.hoisted(() => {
  const prismaMock = {
    aluno: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  }
  return { prismaMock }
})

vi.mock('../../lib/prisma', () => ({ default: prismaMock }))

import { listarAlunos, listarAlunosPorProfessor } from '../../services/aluno.service'

beforeEach(() => {
  vi.clearAllMocks()
})

const alunos = [
  {
    id: 1,
    matricula: '123456',
    fisioterapeutaId: 10,
    professorId: 20,
    fisioterapeuta: {
      id: 10,
      uid: 'uid-aluno',
      nomeCompleto: 'Aluno Teste',
      email: 'aluno@pucminas.edu.br',
      role: 'ALUNO',
      createdAt: new Date(),
    },
    professor: {
      id: 20,
      codigoPessoa: '654321',
      fisioterapeutaId: 30,
      fisioterapeuta: {
        nomeCompleto: 'Professor Teste',
        email: 'professor@pucminas.edu.br',
      },
    },
  },
]

describe('listarAlunos', () => {
  it('deve listar alunos com paginacao padrao', async () => {
    prismaMock.aluno.findMany.mockResolvedValue(alunos)
    prismaMock.aluno.count.mockResolvedValue(1)

    const resultado = await listarAlunos()

    expect(prismaMock.aluno.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        skip: 0,
        take: 10,
      })
    )
    expect(resultado.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    })
  })

  it('deve aplicar page e limit', async () => {
    prismaMock.aluno.findMany.mockResolvedValue([])
    prismaMock.aluno.count.mockResolvedValue(25)

    await listarAlunos({ page: 3, limit: 5 })

    expect(prismaMock.aluno.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 5,
      })
    )
  })

  it('deve pesquisar por matricula, nome ou email', async () => {
    prismaMock.aluno.findMany.mockResolvedValue([])
    prismaMock.aluno.count.mockResolvedValue(0)

    await listarAlunos({ busca: 'teste' })

    expect(prismaMock.aluno.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            {
              OR: [
                { matricula: { contains: 'teste', mode: 'insensitive' } },
                {
                  fisioterapeuta: {
                    nomeCompleto: { contains: 'teste', mode: 'insensitive' },
                  },
                },
                {
                  fisioterapeuta: {
                    email: { contains: 'teste', mode: 'insensitive' },
                  },
                },
              ],
            },
          ],
        },
      })
    )
  })
})

describe('listarAlunosPorProfessor', () => {
  it('deve filtrar alunos pelo fisioterapeutaId do professor', async () => {
    prismaMock.aluno.findMany.mockResolvedValue(alunos)
    prismaMock.aluno.count.mockResolvedValue(1)

    await listarAlunosPorProfessor(30, { page: 1, limit: 20 })

    expect(prismaMock.aluno.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            {
              professor: {
                fisioterapeutaId: 30,
              },
            },
          ],
        },
        take: 20,
      })
    )
  })

  it('deve combinar filtro por professor com busca', async () => {
    prismaMock.aluno.findMany.mockResolvedValue([])
    prismaMock.aluno.count.mockResolvedValue(0)

    await listarAlunosPorProfessor(30, { busca: '123456' })

    expect(prismaMock.aluno.count).toHaveBeenCalledWith({
      where: {
        AND: [
          {
            professor: {
              fisioterapeutaId: 30,
            },
          },
          {
            OR: [
              { matricula: { contains: '123456', mode: 'insensitive' } },
              {
                fisioterapeuta: {
                  nomeCompleto: { contains: '123456', mode: 'insensitive' },
                },
              },
              {
                fisioterapeuta: {
                  email: { contains: '123456', mode: 'insensitive' },
                },
              },
            ],
          },
        ],
      },
    })
  })
})
