import prisma from '../lib/prisma'
import { hashPassword } from '../utils/hash.utils'
import { AppError } from '../errors/AppError'
import { CadastroInput } from '../validators/fisioterapeuta.validator'

async function transferirCoordenador(coordenadorId: number, novoCoordenadorId: number) {

  if (coordenadorId === novoCoordenadorId) {
    throw new AppError(400, 'COORDENADOR_IGUAL', 'Novo coordenador deve ser diferente do atual')
  }

  await prisma.$transaction(async (tx) => {
    const coordenadorAtual = await tx.professor.findUnique({
      where: { fisioterapeutaId: coordenadorId },
    })

    const novoCoordenador = await tx.professor.findUnique({
      where: { fisioterapeutaId: novoCoordenadorId },
    })

    if (!coordenadorAtual) {
      throw new AppError(404, 'COORDENADOR_NOT_FOUND', 'Coordenador atual não encontrado')
    }

    if (!novoCoordenador) {
      throw new AppError(404, 'NOVO_COORDENADOR_NOT_FOUND', 'Novo coordenador não encontrado')
    }

    await tx.professor.update({
      where: { fisioterapeutaId: coordenadorAtual.fisioterapeutaId },
      data: { coordenador: false },
    })

    await tx.professor.update({
      where: { fisioterapeutaId: novoCoordenador.fisioterapeutaId },
      data: { coordenador: true },
    })

  })
}



export {
    transferirCoordenador,
  }
