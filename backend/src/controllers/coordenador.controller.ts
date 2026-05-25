import { Request, Response, NextFunction } from 'express'
import { transferirCoordenador } from '../services/coordenador.service'
import { AppError } from '../errors/AppError'

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

export { associarCoordenador }
