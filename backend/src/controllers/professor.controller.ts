import { Request, Response, NextFunction } from 'express'
import { listarProfessores } from '../services/professor.service'

async function getAllProfessores(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const resultado = await listarProfessores()
    res.status(200).json(resultado)
  } catch (err) {
    next(err)
  }
}

const getProfessores = getAllProfessores

export { getAllProfessores, getProfessores }
