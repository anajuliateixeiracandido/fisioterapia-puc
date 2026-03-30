import { Request, Response, NextFunction } from 'express'
import {
  transferirCoordenador,
} from '../services/coordenador.service'

async function associarCoordenador(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { coordenadorId, novoCoordenadorId } = req.body
    const resultado = await transferirCoordenador(coordenadorId, novoCoordenadorId)
    res.status(201).json(resultado)
  } catch (err) {
    next(err)
  }
}


export { 
    associarCoordenador,
}
