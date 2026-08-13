import { describe, it, expect, vi, beforeEach } from 'vitest'

const { prismaMock } = vi.hoisted(() => {
  const prismaMock = {
    paciente: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  }
  return { prismaMock }
})

vi.mock('../../lib/prisma', () => ({ default: prismaMock }))

import { listarPacientesFisioterapeuta } from '../../services/paciente.service'

beforeEach(() => {
  vi.clearAllMocks()
})

const pacienteCriado = {
  id: 1,
  codigo: 'PAC-001',
  nomeCompleto: 'Paciente Teste',
  dataNascimento: new Date('2000-01-15T00:00:00.000Z'),
  sexo: 'F',
  cpf: '12345678900',
  telefone: '31999999999',
  endereco: 'Rua Teste, 123',
  email: 'paciente@email.com',
  alergias: null,
  condicaoSaude: 'Dor lombar',
  professor: {
    codigoPessoa: '1448023',
    fisioterapeuta: {
      nomeCompleto: 'Professor Teste',
    },
  },
  alunos: [],
  contatosEmergencia: [],
}

describe('listarPacientesFisioterapeuta', () => {
  const listaPacientes = [pacienteCriado]

  it('deve filtrar por professor quando usuario e PROFESSOR', async () => {
    prismaMock.paciente.findMany.mockResolvedValue(listaPacientes)
    prismaMock.paciente.count.mockResolvedValue(1)

    const resultado = await listarPacientesFisioterapeuta(1, 'PROFESSOR', {
      page: 1,
      limit: 10,
    })

    expect(prismaMock.paciente.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { AND: [{ professor: { fisioterapeutaId: 1 } }, {}] },
        skip: 0,
        take: 10,
        orderBy: { nomeCompleto: 'asc' },
      })
    )
    expect(resultado.data).toHaveLength(1)
    expect(resultado.pagination.total).toBe(1)
  })

  it('deve filtrar por aluno quando usuario e ALUNO', async () => {
    prismaMock.paciente.findMany.mockResolvedValue(listaPacientes)
    prismaMock.paciente.count.mockResolvedValue(1)

    await listarPacientesFisioterapeuta(2, 'ALUNO', {})

    expect(prismaMock.paciente.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { AND: [{ alunos: { some: { fisioterapeutaId: 2 } } }, {}] },
      })
    )
  })

  it('deve buscar por codigo, nome, professor responsavel e data de nascimento', async () => {
    prismaMock.paciente.findMany.mockResolvedValue([])
    prismaMock.paciente.count.mockResolvedValue(0)

    await listarPacientesFisioterapeuta(1, 'PROFESSOR', { busca: '15/01/2000' })

    expect(prismaMock.paciente.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            { professor: { fisioterapeutaId: 1 } },
            expect.objectContaining({ OR: expect.any(Array) }),
          ]),
        }),
      })
    )
  })
})
