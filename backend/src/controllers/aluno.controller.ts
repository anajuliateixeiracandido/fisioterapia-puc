import { Request, Response, NextFunction } from 'express'
import { AppError } from '../errors/AppError'
import { listarAlunos, listarAlunosPorProfessor } from '../services/aluno.service'

function obterParametrosListagem(req: Request) {
  return {
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    busca: typeof req.query.busca === 'string' ? req.query.busca : undefined,
  }
}

async function listar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const resultado = await listarAlunos(obterParametrosListagem(req))
    res.status(200).json(resultado)
  } catch (err) {
    next(err)
  }
}

async function listarPorProfessor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const professorFisioterapeutaId = Number(req.params.professorFisioterapeutaId)

    if (!Number.isInteger(professorFisioterapeutaId) || professorFisioterapeutaId <= 0) {
      throw new AppError(400, 'INVALID_ID', 'ID invalido')
    }

    const resultado = await listarAlunosPorProfessor(
      professorFisioterapeutaId,
      obterParametrosListagem(req)
    )

    res.status(200).json(resultado)
  } catch (err) {
    next(err)
  }
}

export { listar, listarPorProfessor }
