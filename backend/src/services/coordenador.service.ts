import prisma from '../lib/prisma'
import { AppError } from '../errors/AppError'

const LIMITE_PADRAO_PROFESSORES_TRANSFERENCIA = 10
const LIMITE_MAXIMO_PROFESSORES_TRANSFERENCIA = 50

function normalizarPagina(valor?: number) {
  if (!valor || Number.isNaN(valor) || valor < 1) return 1
  return Math.floor(valor)
}

function normalizarLimite(valor?: number) {
  if (!valor || Number.isNaN(valor) || valor < 1) return LIMITE_PADRAO_PROFESSORES_TRANSFERENCIA
  return Math.min(Math.floor(valor), LIMITE_MAXIMO_PROFESSORES_TRANSFERENCIA)
}

async function listarProfessoresParaTransferencia(
  coordenadorId: number,
  paginaInput?: number,
  limiteInput?: number
) {
  const coordenadorAtualId = Number(coordenadorId)

  if (Number.isNaN(coordenadorAtualId)) {
    throw new AppError(400, 'COORDENADOR_ID_INVALIDO', 'Identificador de coordenador invalido')
  }

  const pagina = normalizarPagina(paginaInput)
  const limite = normalizarLimite(limiteInput)
  const skip = (pagina - 1) * limite
  const where = {
    fisioterapeutaId: {
      not: coordenadorAtualId,
    },
  }

  const [professores, total] = await Promise.all([
    prisma.professor.findMany({
      where,
      skip,
      take: limite,
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
    }),
    prisma.professor.count({ where }),
  ])

  return {
    items: professores,
    pagination: {
      page: pagina,
      limit: limite,
      total,
      totalPages: Math.max(Math.ceil(total / limite), 1),
    },
  }
}

async function transferirCoordenador(coordenadorId: number, novoCoordenadorId: number) {
  const coordenadorAtualNum = Number(coordenadorId)
  const novoCoordenadorFisioterapeutaId = Number(novoCoordenadorId)

  if (Number.isNaN(coordenadorAtualNum) || Number.isNaN(novoCoordenadorFisioterapeutaId)) {
    throw new AppError(400, 'COORDENADOR_ID_INVALIDO', 'Identificadores de coordenador invalidos')
  }

  if (coordenadorAtualNum === novoCoordenadorFisioterapeutaId) {
    throw new AppError(400, 'COORDENADOR_IGUAL', 'Novo coordenador deve ser diferente do atual')
  }

  return prisma.$transaction(async (tx) => {
    const coordenadorAtual = await tx.professor.findUnique({
      where: { fisioterapeutaId: coordenadorAtualNum },
    })


    if (!coordenadorAtual) {
      throw new AppError(404, 'COORDENADOR_NOT_FOUND', 'Coordenador atual não encontrado')
    }

    if (!coordenadorAtual.coordenador) {
      throw new AppError(403, 'COORDENADOR_ATUAL_INVALIDO', 'Professor atual nao e coordenador')
    }

    const novoCoordenador = await tx.professor.findUnique({
      where: { fisioterapeutaId: novoCoordenadorFisioterapeutaId },
    })

    if (!novoCoordenador) {
      throw new AppError(404, 'NOVO_COORDENADOR_NOT_FOUND', 'Novo coordenador não encontrado')
    }

    await tx.professor.update({
      where: { id: coordenadorAtual.id },
      data: { coordenador: false },
    })

    const coordenadorTransferido = await tx.professor.update({
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

    return coordenadorTransferido
  })
}

export { listarProfessoresParaTransferencia, transferirCoordenador }
