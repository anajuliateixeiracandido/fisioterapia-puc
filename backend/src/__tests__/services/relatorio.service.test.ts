import { describe, it, expect, vi, beforeEach } from 'vitest'

const { prismaMock } = vi.hoisted(() => {
  const prismaMock = {
    paciente: {
      findUnique: vi.fn(),
    },
    professor: {
      findFirst: vi.fn(),
    },
    aluno: {
      findFirst: vi.fn(),
    },
    relatorio: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    formularioCIF: {
      create: vi.fn(),
      update: vi.fn(),
    },
    itemCIF: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  }
  return { prismaMock }
})

vi.mock('../../lib/prisma', () => ({ default: prismaMock }))

import {
  cadastrarRelatorio,
  editarRelatorio,
  deletarRelatorio,
  listarRelatorios,
  obterRelatorioPorId,
} from '../../services/relatorio.service'
import { TokenPayload } from '../../utils/jwt.utils'

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── helpers ────────────────────────────────────────────────────────────────

const formularioCIFInput = {
  tipoCIF: 'CIF' as const,
  dataPreenchimento: '2026-01-10',
  condicaoSaudeDescricao: 'Descrição da condição',
  itens: [],
}

const usuarioProfessor: TokenPayload = { sub: 'uuid-professor', fisioterapeutaId: 1, role: 'PROFESSOR' }
const usuarioAluno: TokenPayload = { sub: 'uuid-aluno', fisioterapeutaId: 2, role: 'ALUNO' }

const relatorioBase = {
  id: 1,
  status: 'ENVIADO',
  fisioterapeutaId: 2,
  professorResponsavelId: 10,
  formularioCIF: { id: 5, itens: [] },
  fisioterapeuta: {},
  professorResponsavel: null,
}

// ─── cadastrarRelatorio ──────────────────────────────────────────────────────

describe('cadastrarRelatorio', () => {
  it('deve lançar PACIENTE_NOT_FOUND quando paciente não existe', async () => {
    prismaMock.paciente.findUnique.mockResolvedValue(null)

    await expect(
      cadastrarRelatorio({ pacienteId: 99, formularioCIF: formularioCIFInput }, usuarioProfessor)
    ).rejects.toMatchObject({ code: 'PACIENTE_NOT_FOUND' })
  })

  it('deve criar relatório com status APROVADO para PROFESSOR', async () => {
    prismaMock.paciente.findUnique.mockResolvedValue({ id: 1 })
    prismaMock.professor.findFirst.mockResolvedValue({ id: 10 })

    const relatorioCreado = {
      id: 1,
      status: 'APROVADO',
      dataCriacao: new Date(),
      formularioCIF: { id: 5, tipoCIF: 'CIF', itens: [], observacoes: null },
    }

    prismaMock.$transaction.mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (fn: any) => {
      const tx = {
        formularioCIF: { create: vi.fn().mockResolvedValue({ id: 5 }) },
        relatorio: { create: vi.fn().mockResolvedValue(relatorioCreado) },
      }
      return fn(tx)
    })
  })

  it('deve criar relatório com status ENVIADO para ALUNO', async () => {
    prismaMock.paciente.findUnique.mockResolvedValue({ id: 1 })
    prismaMock.aluno.findFirst.mockResolvedValue({ professorId: 10 })

    const relatorioCreado = {
      id: 2,
      status: 'ENVIADO',
      dataCriacao: new Date(),
      formularioCIF: { id: 6, tipoCIF: 'CIF', itens: [], observacoes: null },
    }

    prismaMock.$transaction.mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (fn: any) => {
      const tx = {
        formularioCIF: { create: vi.fn().mockResolvedValue({ id: 6 }) },
        relatorio: { create: vi.fn().mockResolvedValue(relatorioCreado) },
      }
      return fn(tx)
    })

    const resultado = await cadastrarRelatorio(
      { pacienteId: 1, formularioCIF: formularioCIFInput },
      usuarioAluno
    )

    expect(resultado.status).toBe('ENVIADO')
  })

  it('deve aceitar data no formato DD/MM/YYYY', async () => {
    prismaMock.paciente.findUnique.mockResolvedValue({ id: 1 })
    prismaMock.professor.findFirst.mockResolvedValue({ id: 10 })

    let dataCapturada: Date | undefined
    prismaMock.$transaction.mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (fn: any) => {
      const tx = {
        formularioCIF: {
          create: vi.fn().mockImplementation(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            async ({ data }: any) => {
            dataCapturada = data.dataPreenchimento
            return { id: 7 }
          }),
        },
        relatorio: {
          create: vi.fn().mockResolvedValue({
            id: 3,
            status: 'APROVADO',
            dataCriacao: new Date(),
            formularioCIF: { id: 7, tipoCIF: 'CIF', itens: [], observacoes: null },
          }),
        },
      }
      return fn(tx)
    })

    await cadastrarRelatorio(
      { pacienteId: 1, formularioCIF: { ...formularioCIFInput, dataPreenchimento: '10/01/2026' } },
      usuarioProfessor
    )

    expect(dataCapturada).toBeInstanceOf(Date)
    expect(dataCapturada!.getFullYear()).toBe(2026)
    expect(dataCapturada!.getMonth()).toBe(0) // janeiro
  })
})

// ─── editarRelatorio ─────────────────────────────────────────────────────────

describe('editarRelatorio', () => {
  it('deve lançar RELATORIO_NOT_FOUND quando relatório não existe', async () => {
    prismaMock.relatorio.findUnique.mockResolvedValue(null)

    await expect(
      editarRelatorio(99, { status: 'APROVADO' }, usuarioProfessor)
    ).rejects.toMatchObject({ code: 'RELATORIO_NOT_FOUND' })
  })

  it('deve lançar NO_DATA_TO_UPDATE quando nenhum dado é fornecido', async () => {
    prismaMock.relatorio.findUnique.mockResolvedValue(relatorioBase)

    await expect(editarRelatorio(1, {}, usuarioProfessor)).rejects.toMatchObject({
      code: 'NO_DATA_TO_UPDATE',
    })
  })

  it('deve lançar FORBIDDEN quando ALUNO tenta editar relatório de outro', async () => {
    prismaMock.relatorio.findUnique.mockResolvedValue({
      ...relatorioBase,
      fisioterapeutaId: 99, // diferente do usuarioAluno.fisioterapeutaId = 2
    })

    await expect(
      editarRelatorio(1, { professorResponsavelId: 5 }, usuarioAluno)
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('deve lançar RELATORIO_JA_APROVADO ao tentar editar relatório aprovado', async () => {
    prismaMock.relatorio.findUnique.mockResolvedValue({
      ...relatorioBase,
      fisioterapeutaId: 2,
      status: 'APROVADO',
    })

    await expect(
      editarRelatorio(1, { professorResponsavelId: 5 }, usuarioAluno)
    ).rejects.toMatchObject({ code: 'RELATORIO_JA_APROVADO' })
  })

  it('deve mudar status de NEGADO para CORRIGIDO ao editar professorResponsavelId', async () => {
    prismaMock.relatorio.findUnique.mockResolvedValue({
      ...relatorioBase,
      fisioterapeutaId: 2,
      status: 'NEGADO',
    })

    const relatorioAtualizado = { ...relatorioBase, status: 'CORRIGIDO' }
    prismaMock.relatorio.update.mockResolvedValue(relatorioAtualizado)

    const resultado = await editarRelatorio(1, { professorResponsavelId: 5 }, usuarioAluno)

    expect(prismaMock.relatorio.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'CORRIGIDO' }),
      })
    )
    expect(resultado.status).toBe('CORRIGIDO')
  })

  it('deve lançar FEEDBACK_OBRIGATORIO ao negar sem feedback', async () => {
    prismaMock.relatorio.findUnique.mockResolvedValue({
      ...relatorioBase,
      status: 'ENVIADO',
    })
    prismaMock.professor.findFirst.mockResolvedValue({ id: 10, coordenador: false })

    await expect(
      editarRelatorio(1, { status: 'NEGADO' }, usuarioProfessor)
    ).rejects.toMatchObject({ code: 'FEEDBACK_OBRIGATORIO' })
  })

  it('deve aprovar relatório com status APROVADO e salvar dataAprovacao', async () => {
    prismaMock.relatorio.findUnique.mockResolvedValue({
      ...relatorioBase,
      status: 'ENVIADO',
      professorResponsavelId: 10,
    })
    prismaMock.professor.findFirst.mockResolvedValue({ id: 10, coordenador: false })

    const relatorioAtualizado = { ...relatorioBase, status: 'APROVADO' }
    prismaMock.relatorio.update.mockResolvedValue(relatorioAtualizado)

    const resultado = await editarRelatorio(1, { status: 'APROVADO' }, usuarioProfessor)

    expect(prismaMock.relatorio.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'APROVADO',
          dataAprovacao: expect.any(Date),
        }),
      })
    )
    expect(resultado.status).toBe('APROVADO')
  })

  it('deve lançar RELATORIO_JA_APROVADO ao tentar avaliar relatório aprovado', async () => {
    prismaMock.relatorio.findUnique.mockResolvedValue({
      ...relatorioBase,
      status: 'APROVADO',
    })

    await expect(
      editarRelatorio(1, { status: 'NEGADO', feedback: 'Comentário' }, usuarioProfessor)
    ).rejects.toMatchObject({ code: 'RELATORIO_JA_APROVADO' })
  })

  it('deve lançar FORBIDDEN quando professor não for responsável e não for coordenador', async () => {
    prismaMock.relatorio.findUnique.mockResolvedValue({
      ...relatorioBase,
      professorResponsavelId: 99, // outro professor
    })
    prismaMock.professor.findFirst.mockResolvedValue({ id: 10, coordenador: false })

    await expect(
      editarRelatorio(1, { status: 'APROVADO' }, usuarioProfessor)
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('coordenador pode aprovar qualquer relatório', async () => {
    prismaMock.relatorio.findUnique.mockResolvedValue({
      ...relatorioBase,
      status: 'ENVIADO',
      professorResponsavelId: 99, // professor diferente
    })
    prismaMock.professor.findFirst.mockResolvedValue({ id: 10, coordenador: true })

    const relatorioAtualizado = { ...relatorioBase, status: 'APROVADO' }
    prismaMock.relatorio.update.mockResolvedValue(relatorioAtualizado)

    const resultado = await editarRelatorio(1, { status: 'APROVADO' }, usuarioProfessor)
    expect(resultado.status).toBe('APROVADO')
  })

  it('deve editar formularioCIF e mudar status de NEGADO para CORRIGIDO quando ALUNO corrige', async () => {
    prismaMock.relatorio.findUnique.mockResolvedValue({
      ...relatorioBase,
      fisioterapeutaId: 2,
      status: 'NEGADO',
    })

    const relatorioAtualizado = { ...relatorioBase, status: 'CORRIGIDO' }

    prismaMock.$transaction.mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (fn: any) => {
      const tx = {
        itemCIF: { deleteMany: vi.fn().mockResolvedValue({}) },
        formularioCIF: { update: vi.fn().mockResolvedValue({}) },
        relatorio: { update: vi.fn().mockResolvedValue(relatorioAtualizado) },
      }
      return fn(tx)
    })

    const resultado = await editarRelatorio(
      1,
      { formularioCIF: formularioCIFInput },
      usuarioAluno
    )

    expect(resultado.status).toBe('CORRIGIDO')
  })

  it('deve lançar FORBIDDEN quando ALUNO tenta editar formularioCIF de relatório aprovado', async () => {
    prismaMock.relatorio.findUnique.mockResolvedValue({
      ...relatorioBase,
      fisioterapeutaId: 2,
      status: 'APROVADO',
    })

    await expect(
      editarRelatorio(1, { formularioCIF: formularioCIFInput }, usuarioAluno)
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })
})

// ─── deletarRelatorio ─────────────────────────────────────────────────────────

describe('deletarRelatorio', () => {
  it('deve lançar RELATORIO_NOT_FOUND quando relatório não existe', async () => {
    prismaMock.relatorio.findUnique.mockResolvedValue(null)

    await expect(deletarRelatorio(99, usuarioAluno)).rejects.toMatchObject({
      code: 'RELATORIO_NOT_FOUND',
    })
  })

  it('deve lançar FORBIDDEN ao deletar relatório de outro fisioterapeuta', async () => {
    prismaMock.relatorio.findUnique.mockResolvedValue({
      ...relatorioBase,
      fisioterapeutaId: 99,
    })

    await expect(deletarRelatorio(1, usuarioAluno)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
  })

  it('deve deletar relatório do próprio fisioterapeuta', async () => {
    prismaMock.relatorio.findUnique.mockResolvedValue({
      ...relatorioBase,
      fisioterapeutaId: 2,
    })
    prismaMock.relatorio.delete.mockResolvedValue({})

    await expect(deletarRelatorio(1, usuarioAluno)).resolves.toBeUndefined()
    expect(prismaMock.relatorio.delete).toHaveBeenCalledWith({ where: { id: 1 } })
  })
})

// ─── obterRelatorioPorId ─────────────────────────────────────────────────────

describe('obterRelatorioPorId', () => {
  it('deve lançar RELATORIO_NOT_FOUND quando relatório não existe', async () => {
    prismaMock.relatorio.findUnique.mockResolvedValue(null)

    await expect(obterRelatorioPorId(99, usuarioAluno)).rejects.toMatchObject({
      code: 'RELATORIO_NOT_FOUND',
    })
  })

  it('deve lançar FORBIDDEN quando ALUNO tenta ver relatório de outro', async () => {
    prismaMock.relatorio.findUnique.mockResolvedValue({
      ...relatorioBase,
      fisioterapeutaId: 99,
    })

    await expect(obterRelatorioPorId(1, usuarioAluno)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
  })

  it('ALUNO deve visualizar seu próprio relatório', async () => {
    prismaMock.relatorio.findUnique.mockResolvedValue({
      ...relatorioBase,
      fisioterapeutaId: 2,
    })

    const resultado = await obterRelatorioPorId(1, usuarioAluno)
    expect(resultado.id).toBe(1)
  })

  it('deve lançar FORBIDDEN quando PROFESSOR não tem acesso ao relatório', async () => {
    prismaMock.relatorio.findUnique.mockResolvedValue({
      ...relatorioBase,
      fisioterapeutaId: 99,
      professorResponsavelId: 99,
    })
    prismaMock.professor.findFirst.mockResolvedValue({ id: 10, coordenador: false })

    await expect(obterRelatorioPorId(1, usuarioProfessor)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
  })

  it('coordenador pode visualizar qualquer relatório', async () => {
    prismaMock.relatorio.findUnique.mockResolvedValue({
      ...relatorioBase,
      fisioterapeutaId: 99,
      professorResponsavelId: 99,
    })
    prismaMock.professor.findFirst.mockResolvedValue({ id: 10, coordenador: true })

    const resultado = await obterRelatorioPorId(1, usuarioProfessor)
    expect(resultado.id).toBe(1)
  })

  it('PROFESSOR autor deve visualizar seu próprio relatório', async () => {
    prismaMock.relatorio.findUnique.mockResolvedValue({
      ...relatorioBase,
      fisioterapeutaId: 1, // mesmo que usuarioProfessor.fisioterapeutaId
      professorResponsavelId: 99,
    })
    prismaMock.professor.findFirst.mockResolvedValue({ id: 10, coordenador: false })

    const resultado = await obterRelatorioPorId(1, usuarioProfessor)
    expect(resultado.id).toBe(1)
  })
})

// ─── listarRelatorios ─────────────────────────────────────────────────────────

describe('listarRelatorios', () => {
  const filtrosPadrao = {
    page: 1,
    limit: 10,
    ordenarPor: 'dataCriacao' as const,
    ordem: 'desc' as const,
    tipo: 'authored' as const,
  }

  it('deve retornar lista paginada de relatórios', async () => {
    prismaMock.relatorio.findMany.mockResolvedValue([relatorioBase])
    prismaMock.relatorio.count.mockResolvedValue(1)

    const resultado = await listarRelatorios(filtrosPadrao, usuarioAluno)

    expect(resultado.data).toHaveLength(1)
    expect(resultado.pagination.total).toBe(1)
    expect(resultado.pagination.totalPages).toBe(1)
  })

  it('deve filtrar por fisioterapeutaId no tipo "authored"', async () => {
    prismaMock.relatorio.findMany.mockResolvedValue([])
    prismaMock.relatorio.count.mockResolvedValue(0)

    await listarRelatorios({ ...filtrosPadrao, tipo: 'authored' }, usuarioAluno)

    expect(prismaMock.relatorio.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ fisioterapeutaId: 2 }),
      })
    )
  })

  it('deve usar professorResponsavelId no tipo "all" para PROFESSOR', async () => {
    prismaMock.professor.findFirst.mockResolvedValue({ id: 10 })
    prismaMock.relatorio.findMany.mockResolvedValue([])
    prismaMock.relatorio.count.mockResolvedValue(0)

    await listarRelatorios({ ...filtrosPadrao, tipo: 'all' }, usuarioProfessor)

    expect(prismaMock.relatorio.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ professorResponsavelId: 10 }),
      })
    )
  })

  it('deve calcular paginação corretamente', async () => {
    prismaMock.relatorio.findMany.mockResolvedValue([])
    prismaMock.relatorio.count.mockResolvedValue(25)

    const resultado = await listarRelatorios({ ...filtrosPadrao, page: 2, limit: 10 }, usuarioAluno)

    expect(resultado.pagination).toMatchObject({
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
    })
  })
})
