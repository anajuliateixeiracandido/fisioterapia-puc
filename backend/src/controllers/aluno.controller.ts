import { Request, Response, NextFunction } from 'express'
import {
  associarPacienteAluno,
} from '../services/aluno.service'

async function associarPaciente(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { alunoId, pacienteId } = req.body
    const resultado = await associarPacienteAluno(alunoId, pacienteId)
    res.status(201).json(resultado)
  } catch (err) {
    next(err)
  }
}


export { 
    associarPaciente,
}
