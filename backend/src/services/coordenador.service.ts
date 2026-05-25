import prisma from '../lib/prisma'
import { AppError } from '../errors/AppError'

async function transferirCoordenador(coordenadorId: number, novoCoordenadorId: number) {
  const coordenadorAtualId = Number(coordenadorId)
  const novoCoordenadorFisioterapeutaId = Number(novoCoordenadorId)

  if (Number.isNaN(coordenadorAtualId) || Number.isNaN(novoCoordenadorFisioterapeutaId)) {
    throw new AppError(400, 'COORDENADOR_ID_INVALIDO', 'Identificadores de coordenador invalidos')
  }

  if (coordenadorAtualId === novoCoordenadorFisioterapeutaId) {
    throw new AppError(400, 'COORDENADOR_IGUAL', 'Novo coordenador deve ser diferente do atual')
  }

  return prisma.$transaction(async (tx) => {
    const coordenadorAtual = await tx.professor.findUnique({
      where: { fisioterapeutaId: coordenadorAtualId },
    })

    const novoCoordenador = await tx.professor.findUnique({
      where: { fisioterapeutaId: novoCoordenadorFisioterapeutaId },
    })

    if (!coordenadorAtual) {
      throw new AppError(404, 'COORDENADOR_NOT_FOUND', 'Coordenador atual não encontrado')
    }

    if (!coordenadorAtual.coordenador) {
      throw new AppError(403, 'COORDENADOR_ATUAL_INVALIDO', 'Professor atual nao e coordenador')
    }

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

export { transferirCoordenador }
