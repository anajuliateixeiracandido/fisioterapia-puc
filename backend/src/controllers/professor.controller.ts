import { Request, Response, NextFunction } from 'express'
import { listarProfessores, associarAlunoProfessor, associarPacienteProfessor } from '../services/professor.service'

async function getAllProfessores(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const resultado = await listarProfessores()
    res.status(200).json(resultado)
  } catch (err) {
    next(err)
  }
}

async function associarAluno(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { idProfessor, idAluno } = req.body
    const resultado = await associarAlunoProfessor(idProfessor, idAluno)
    res.status(201).json(resultado)
  } catch (err) {
    next(err)
  }
}

async function associarPaciente(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { idProfessor, idPaciente } = req.body
    const resultado = await associarPacienteProfessor(idProfessor, idPaciente)
    res.status(201).json(resultado)
  } catch (err) {
    next(err)
  }
}

export { getAllProfessores, associarAluno, associarPaciente }
