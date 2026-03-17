import { Request, Response, NextFunction } from 'express'
import { cadastroPacienteSchema } from '../validators/paciente.validator'
import { cadastrarPaciente } from '../services/paciente.service'

async function cadastrar(req: Request, res: Response, next: NextFunction): Promise<void> {
try {
  const dados = cadastroPacienteSchema.parse(req.body)
  const resultado = await cadastrarPaciente(dados, req.user!.fisioterapeutaId)
  res.status(201).json(resultado)
} catch (err) {
  next(err)
}
}

export { cadastrar }