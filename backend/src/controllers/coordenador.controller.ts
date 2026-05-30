import { Request, Response, NextFunction } from 'express'
import {
  listarProfessoresParaTransferencia,
  transferirCoordenador,
} from '../services/coordenador.service'
import { AppError } from '../errors/AppError'

async function listarProfessoresTransferencia(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.coordenador) {
      throw new AppError(403, 'FORBIDDEN', 'Apenas coordenadores podem transferir o cargo')
    }

    const page = Number(req.query.page)
    const limit = Number(req.query.limit)
    const resultado = await listarProfessoresParaTransferencia(
      req.user.fisioterapeutaId,
      page,
      limit
    )

    res.status(200).json(resultado)
  } catch (err) {
    next(err)
  }
}

async function associarCoordenador(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.coordenador) {
      throw new AppError(403, 'FORBIDDEN', 'Apenas coordenadores podem transferir o cargo')
    }

    const { coordenadorId, novoCoordenadorId } = req.body
    const resultado = await transferirCoordenador(coordenadorId, novoCoordenadorId)
    res.status(200).json(resultado)
  } catch (err) {
    next(err)
  }
}

export { listarProfessoresTransferencia, associarCoordenador }
