import { describe, it, expect, vi, beforeEach } from 'vitest'

const { prismaMock } = vi.hoisted(() => {
  const txMock = {
    professor: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
  }

  const prismaMock = {
    $transaction: vi.fn((callback) => callback(txMock)),
    professor: txMock.professor,
    txMock,
  }

  return { prismaMock }
})

vi.mock('../../lib/prisma', () => ({ default: prismaMock }))

import {
  listarProfessoresParaTransferencia,
  transferirCoordenador,
} from '../../services/coordenador.service'

beforeEach(() => {
  vi.resetAllMocks()
  prismaMock.$transaction.mockImplementation((callback) => callback(prismaMock.txMock))
})

describe('listarProfessoresParaTransferencia', () => {
  it('deve listar professores paginados excluindo o coordenador atual na query', async () => {
    const professores = [
      {
        id: 11,
        fisioterapeutaId: 5,
        codigoPessoa: '654321',
        coordenador: false,
        fisioterapeuta: {
          nomeCompleto: 'Professor Novo Coordenador',
          email: 'novo.coordenador@pucminas.edu.br',
        },
      },
    ]

    prismaMock.professor.findMany.mockResolvedValue(professores)
    prismaMock.professor.count.mockResolvedValue(12)

    const resultado = await listarProfessoresParaTransferencia(4, 2, 10)

    const where = {
      fisioterapeutaId: {
        not: 4,
      },
    }

    expect(prismaMock.professor.findMany).toHaveBeenCalledWith({
      where,
      skip: 10,
      take: 10,
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
    expect(prismaMock.professor.count).toHaveBeenCalledWith({ where })
    expect(resultado).toEqual({
      items: professores,
      pagination: {
        page: 2,
        limit: 10,
        total: 12,
        totalPages: 2,
      },
    })
  })

  it('deve rejeitar coordenador invalido', async () => {
    await expect(listarProfessoresParaTransferencia(Number.NaN)).rejects.toMatchObject({
      code: 'COORDENADOR_ID_INVALIDO',
    })

    expect(prismaMock.professor.findMany).not.toHaveBeenCalled()
  })
})

describe('transferirCoordenador', () => {
  const coordenadorAtual = {
    id: 10,
    fisioterapeutaId: 4,
    codigoPessoa: '123456',
    coordenador: true,
  }

  const novoCoordenador = {
    id: 11,
    fisioterapeutaId: 5,
    codigoPessoa: '654321',
    coordenador: false,
  }

  const coordenadorTransferido = {
    ...novoCoordenador,
    coordenador: true,
    fisioterapeuta: {
      nomeCompleto: 'Professor Novo Coordenador',
      email: 'novo.coordenador@pucminas.edu.br',
    },
  }

  it('deve transferir o cargo para o novo coordenador', async () => {
    prismaMock.txMock.professor.findUnique
      .mockResolvedValueOnce(coordenadorAtual)
      .mockResolvedValueOnce(novoCoordenador)
    prismaMock.txMock.professor.update
      .mockResolvedValueOnce({ ...coordenadorAtual, coordenador: false })
      .mockResolvedValueOnce(coordenadorTransferido)

    const resultado = await transferirCoordenador(4, 5)

    expect(prismaMock.txMock.professor.findUnique).toHaveBeenNthCalledWith(1, {
      where: { fisioterapeutaId: 4 },
    })
    expect(prismaMock.txMock.professor.findUnique).toHaveBeenNthCalledWith(2, {
      where: { fisioterapeutaId: 5 },
    })
    expect(prismaMock.txMock.professor.update).toHaveBeenNthCalledWith(1, {
      where: { id: coordenadorAtual.id },
      data: { coordenador: false },
    })
    expect(prismaMock.txMock.professor.update).toHaveBeenNthCalledWith(2, {
      where: { id: novoCoordenador.id },
      data: { coordenador: true },
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
    })
    expect(resultado).toEqual(coordenadorTransferido)
  })

  it('deve rejeitar quando o novo coordenador for o mesmo atual', async () => {
    await expect(transferirCoordenador(4, 4)).rejects.toMatchObject({
      code: 'COORDENADOR_IGUAL',
    })

    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })

  it('deve rejeitar identificadores invalidos', async () => {
    await expect(transferirCoordenador(Number.NaN, 5)).rejects.toMatchObject({
      code: 'COORDENADOR_ID_INVALIDO',
    })

    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })

  it('deve rejeitar quando o coordenador atual nao existir', async () => {
    prismaMock.txMock.professor.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(novoCoordenador)

    await expect(transferirCoordenador(999, 5)).rejects.toMatchObject({
      code: 'COORDENADOR_NOT_FOUND',
    })
  })

  it('deve rejeitar quando o professor atual nao for coordenador', async () => {
    prismaMock.txMock.professor.findUnique
      .mockResolvedValueOnce({ ...coordenadorAtual, coordenador: false })
      .mockResolvedValueOnce(novoCoordenador)

    await expect(transferirCoordenador(4, 5)).rejects.toMatchObject({
      code: 'COORDENADOR_ATUAL_INVALIDO',
    })
  })

  it('deve rejeitar quando o novo coordenador nao existir', async () => {
    prismaMock.txMock.professor.findUnique
      .mockResolvedValueOnce(coordenadorAtual)
      .mockResolvedValueOnce(null)

    await expect(transferirCoordenador(4, 999)).rejects.toMatchObject({
      code: 'NOVO_COORDENADOR_NOT_FOUND',
    })
  })
})
