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
      findUnique: vi.fn(),
    },
  }
  return { prismaMock }
})

vi.mock('../../lib/prisma', () => ({ default: prismaMock }))

import { cadastrarPaciente, listarPacientes, obterPacientePorId } from '../../services/paciente.service'
import { TokenPayload } from '../../utils/jwt.utils'

beforeEach(() => {
  vi.clearAllMocks()
})

const dadosPaciente = {
  nomeCompleto: 'Paciente Teste',
  dataNascimento: '2000-01-15T00:00:00.000Z',
  sexo: 'M' as const,
  cpf: '12345678901',
  contatosEmergencia: [{ nome: 'Contato', telefone: '31999999999', parentesco: 'Pai' }],
}

const pacienteCriado = {
  codigo: 'codigo-teste',
  nomeCompleto: dadosPaciente.nomeCompleto,
  dataNascimento: new Date(dadosPaciente.dataNascimento),
  sexo: 'M',
  cpf: dadosPaciente.cpf,
  telefone: null,
  endereco: null,
  email: null,
  alergias: null,
  // novo shape após refactor: codigoPessoa em professor, matricula em aluno
  professor: { codigoPessoa: '1448023', fisioterapeuta: { nomeCompleto: 'Professor Teste' } },
  alunos: [],
  contatosEmergencia: dadosPaciente.contatosEmergencia,
}

describe('cadastrarPaciente', () => {
  it('deve lançar FORBIDDEN se fisioterapeuta não for professor', async () => {
    prismaMock.professor.findUnique.mockResolvedValue(null)

    await expect(cadastrarPaciente(dadosPaciente, 1)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
  })

  it('deve cadastrar paciente sem aluno vinculado', async () => {
    prismaMock.professor.findUnique.mockResolvedValue({ id: 1 })
    prismaMock.paciente.create.mockResolvedValue(pacienteCriado)

    const resultado = await cadastrarPaciente(dadosPaciente, 1)

    expect(resultado).toHaveProperty('codigo')
    expect(prismaMock.aluno.findFirst).not.toHaveBeenCalled()
  })

  it('deve cadastrar paciente com aluno vinculado', async () => {
    prismaMock.professor.findUnique.mockResolvedValue({ id: 1 })
    prismaMock.aluno.findFirst.mockResolvedValue({ id: 2 })
    prismaMock.paciente.create.mockResolvedValue({
      ...pacienteCriado,
      alunos: [{ fisioterapeuta: { nomeCompleto: 'Aluno Teste', matricula: '123456' } }],
    })

    const resultado = await cadastrarPaciente({ ...dadosPaciente, matriculaAluno: '123456' }, 1)

    expect(resultado).toHaveProperty('codigo')
    expect(prismaMock.aluno.findFirst).toHaveBeenCalledOnce()
  })

  it('deve lançar ALUNO_NOT_FOUND para matrícula inexistente', async () => {
    prismaMock.professor.findUnique.mockResolvedValue({ id: 1 })
    prismaMock.aluno.findFirst.mockResolvedValue(null)

    await expect(
      cadastrarPaciente({ ...dadosPaciente, matriculaAluno: '999999' }, 1)
    ).rejects.toMatchObject({ code: 'ALUNO_NOT_FOUND' })
  })

  it('deve buscar aluno diretamente por matricula sem filtro ativo', async () => {
    prismaMock.professor.findUnique.mockResolvedValue({ id: 1 })
    prismaMock.aluno.findFirst.mockResolvedValue({ id: 3 })
    prismaMock.paciente.create.mockResolvedValue({
      ...pacienteCriado,
      alunos: [{ matricula: '654321', fisioterapeuta: { nomeCompleto: 'Aluno Teste' } }],
    })

    await cadastrarPaciente({ ...dadosPaciente, matriculaAluno: '654321' }, 1)

    expect(prismaMock.aluno.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { matricula: '654321' } })
    )
  })
})

// ─── listarPacientes ──────────────────────────────────────────────────────────

describe('listarPacientes', () => {
  const usuarioProfessor: TokenPayload = { sub: 'uuid-professor', fisioterapeutaId: 1, role: 'PROFESSOR' }
  const usuarioAluno: TokenPayload = { sub: 'uuid-aluno', fisioterapeutaId: 2, role: 'ALUNO' }

  const listaPacientes = [
    { id: 1, codigo: 'P001', nomeCompleto: 'Paciente A', dataNascimento: new Date(), sexo: 'M', cpf: '111', telefone: null },
  ]

  it('deve filtrar por professorId quando usuário é PROFESSOR', async () => {
    prismaMock.paciente.findMany.mockResolvedValue(listaPacientes)

    const resultado = await listarPacientes(usuarioProfessor)

    expect(prismaMock.paciente.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { professor: { fisioterapeutaId: 1 } },
      })
    )
    expect(resultado).toHaveLength(1)
  })

  it('deve filtrar por aluno quando usuário é ALUNO', async () => {
    prismaMock.paciente.findMany.mockResolvedValue(listaPacientes)

    await listarPacientes(usuarioAluno)

    expect(prismaMock.paciente.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { alunos: { some: { fisioterapeuta: { id: 2 } } } },
      })
    )
  })

  it('deve ordenar por nomeCompleto ascendente', async () => {
    prismaMock.paciente.findMany.mockResolvedValue([])

    await listarPacientes(usuarioProfessor)

    expect(prismaMock.paciente.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { nomeCompleto: 'asc' } })
    )
  })
})

// ─── obterPacientePorId ───────────────────────────────────────────────────────

describe('obterPacientePorId', () => {
  const pacienteCompleto = {
    id: 1,
    codigo: 'P001',
    nomeCompleto: 'Paciente A',
    dataNascimento: new Date(),
    sexo: 'M',
    cpf: '111',
    professor: { codigoPessoa: '12345', fisioterapeuta: { nomeCompleto: 'Prof' } },
    alunos: [],
    contatosEmergencia: [],
  }

  it('deve retornar paciente quando encontrado', async () => {
    prismaMock.paciente.findUnique.mockResolvedValue(pacienteCompleto)

    const resultado = await obterPacientePorId(1, { sub: 'uuid', fisioterapeutaId: 1, role: 'PROFESSOR' } as TokenPayload)
    expect(resultado.id).toBe(1)
    expect(resultado.nomeCompleto).toBe('Paciente A')
  })

  it('deve lançar PACIENTE_NOT_FOUND quando paciente não existe', async () => {
    prismaMock.paciente.findUnique.mockResolvedValue(null)

    await expect(obterPacientePorId(999, { sub: 'uuid', fisioterapeutaId: 1, role: 'PROFESSOR' } as TokenPayload)).rejects.toMatchObject({
      code: 'PACIENTE_NOT_FOUND',
    })
  })
})
