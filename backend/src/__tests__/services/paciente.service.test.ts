import { describe, it, expect, vi, beforeEach } from 'vitest'

const { prismaMock } = vi.hoisted(() => {
  const prismaMock = {
    professor: {
      findUnique: vi.fn(),
    },
    aluno: {
      findFirst: vi.fn(),
    },
    paciente: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
    },
  }
  return { prismaMock }
})

vi.mock('../../lib/prisma', () => ({ default: prismaMock }))

import {
  buscarPacientePorId,
  cadastrarPaciente,
  listarPacientesFisioterapeuta,
} from '../../services/paciente.service'
import { TokenPayload } from '../../utils/jwt.utils'

beforeEach(() => {
  vi.clearAllMocks()
})

const dadosPaciente = {
  nomeCompleto: 'Paciente Teste',
  dataNascimento: '15/01/2000',
  sexo: 'M' as const,
  cpf: '12345678901',
  contatosEmergencia: [{ nome: 'Contato', telefone: '31999999999', parentesco: 'Pai' }],
}

const pacienteCriado = {
  id: 1,
  codigo: 'codigo-teste',
  nomeCompleto: dadosPaciente.nomeCompleto,
  dataNascimento: new Date('2000-01-15T00:00:00.000Z'),
  sexo: 'M',
  cpf: dadosPaciente.cpf,
  telefone: null,
  endereco: null,
  email: null,
  alergias: null,
  condicaoSaude: null,
  professor: { codigoPessoa: '1448023', fisioterapeuta: { nomeCompleto: 'Professor Teste' } },
  alunos: [],
  contatosEmergencia: dadosPaciente.contatosEmergencia,
}

const usuarioProfessor: TokenPayload = {
  sub: 'uuid-professor',
  fisioterapeutaId: 1,
  role: 'PROFESSOR',
  coordenador: false,
}

const usuarioAluno: TokenPayload = {
  sub: 'uuid-aluno',
  fisioterapeutaId: 2,
  role: 'ALUNO',
  coordenador: false,
}

describe('cadastrarPaciente', () => {
  it('deve lancar FORBIDDEN se professor nao existir', async () => {
    prismaMock.professor.findUnique.mockResolvedValue(null)

    await expect(cadastrarPaciente(dadosPaciente, usuarioProfessor)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
  })

  it('deve cadastrar paciente associando apenas ao professor quando usuario e PROFESSOR', async () => {
    prismaMock.professor.findUnique.mockResolvedValue({ id: 1 })
    prismaMock.paciente.create.mockResolvedValue(pacienteCriado)

    const resultado = await cadastrarPaciente(dadosPaciente, usuarioProfessor)

    expect(resultado).toHaveProperty('codigo')
    expect(prismaMock.aluno.findFirst).not.toHaveBeenCalled()
    expect(prismaMock.paciente.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          professorId: 1,
        }),
      })
    )
  })

  it('deve cadastrar paciente associando aluno e professor do aluno quando usuario e ALUNO', async () => {
    prismaMock.aluno.findFirst.mockResolvedValue({ id: 2, professorId: 1 })
    prismaMock.paciente.create.mockResolvedValue({
      ...pacienteCriado,
      alunos: [{ matricula: '123456', fisioterapeuta: { nomeCompleto: 'Aluno Teste' } }],
    })

    const resultado = await cadastrarPaciente(dadosPaciente, usuarioAluno)

    expect(resultado).toHaveProperty('codigo')
    expect(prismaMock.paciente.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          professorId: 1,
          alunos: {
            connect: { id: 2 },
          },
        }),
      })
    )
  })

  it('deve cadastrar paciente com aluno vinculado', async () => {
    prismaMock.professor.findUnique.mockResolvedValue({ id: 1 })
    prismaMock.aluno.findFirst.mockResolvedValue({ id: 2 })
    prismaMock.paciente.create.mockResolvedValue({
      ...pacienteCriado,
      alunos: [{ matricula: '123456', fisioterapeuta: { nomeCompleto: 'Aluno Teste' } }],
    })

    const resultado = await cadastrarPaciente(
      { ...dadosPaciente, matriculaAluno: '123456' },
      usuarioProfessor
    )

    expect(resultado).toHaveProperty('codigo')
    expect(prismaMock.aluno.findFirst).toHaveBeenCalledOnce()
  })

  it('deve lancar ALUNO_NOT_FOUND para matricula inexistente', async () => {
    prismaMock.professor.findUnique.mockResolvedValue({ id: 1 })
    prismaMock.aluno.findFirst.mockResolvedValue(null)

    await expect(
      cadastrarPaciente({ ...dadosPaciente, matriculaAluno: '999999' }, usuarioProfessor)
    ).rejects.toMatchObject({ code: 'ALUNO_NOT_FOUND' })
  })
})

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

describe('buscarPacientePorId', () => {
  it('deve retornar paciente quando encontrado', async () => {
    prismaMock.paciente.findFirst.mockResolvedValue(pacienteCriado)

    const resultado = await buscarPacientePorId(1, 1, 'PROFESSOR')

    expect(resultado.id).toBe(1)
    expect(resultado.nomeCompleto).toBe('Paciente Teste')
    expect(resultado.relatorios).toEqual([])
  })

  it('deve lancar PACIENTE_NOT_FOUND quando paciente nao existe', async () => {
    prismaMock.paciente.findFirst.mockResolvedValue(null)

    await expect(buscarPacientePorId(999, 1, 'PROFESSOR')).rejects.toMatchObject({
      code: 'PACIENTE_NOT_FOUND',
    })
  })
})
