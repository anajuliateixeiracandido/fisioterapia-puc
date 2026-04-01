import { Request, Response, NextFunction } from 'express'
import { cadastroPacienteSchema } from '../validators/paciente.validator'
import {
  cadastrarPaciente,
  listarPacientes,
  obterPacientePorId,
} from '../services/paciente.service'

async function cadastrar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dados = cadastroPacienteSchema.parse(req.body)
    const resultado = await cadastrarPaciente(dados, (req as any).user.fisioterapeutaId)
    res.status(201).json(resultado)
  } catch (err) {
    next(err)
  }
}

async function listar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const resultado = await listarPacientes((req as any).user)
    res.json(resultado)
  } catch (err) {
    next(err)
  }
}

async function obterPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id as string)
    const resultado = await obterPacientePorId(id, (req as any).user)
    res.json(resultado)
  } catch (err) {
    next(err)
  }
}

export { cadastrar, listar, obterPorId }