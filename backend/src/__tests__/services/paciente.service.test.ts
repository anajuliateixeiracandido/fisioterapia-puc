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
    },
  }
  return { prismaMock }
})

vi.mock('../../lib/prisma', () => ({ default: prismaMock }))

import { cadastrarPaciente } from '../../services/paciente.service'

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
  professor: { fisioterapeuta: { nomeCompleto: 'Professor Teste', codigoPessoa: '1448023' } },
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
})
