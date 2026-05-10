import { Request, Response, NextFunction } from 'express'
import { cadastroPacienteSchema, listarPacientesSchema } from '../validators/paciente.validator'
import {
  buscarPacientePorId,
  cadastrarPaciente,
  listarPacientes,
  listarPacientesFisioterapeuta,
  associarPacienteAluno,
  associarPacienteProfessor,
} from '../services/paciente.service'

async function cadastrar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dados = cadastroPacienteSchema.parse(req.body)
    const resultado = await cadastrarPaciente(dados, req.user!.fisioterapeutaId)
    res.status(201).json(resultado)
  } catch (err) {
    next(err)
  }
}

async function associarPaciAluno(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pacienteId = Number(req.params.pacienteId)
    const alunoId = Number(req.params.alunoId)

    if (Number.isNaN(pacienteId) || Number.isNaN(alunoId)) {
      res.status(400).json({ code: 'ID_INVALIDO' })
      return
    }

    const resultado = await associarPacienteAluno(pacienteId, alunoId)
    res.status(200).json(resultado)
  } catch (err) {
    next(err)
  }
}

async function associarPaciProfessor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pacienteId = Number(req.params.pacienteId);
    const professorId = req.user!.fisioterapeutaId;

    if (Number.isNaN(pacienteId)) {
      res.status(400).json({ code: 'ID_INVALIDO' })
      return
    }

    const resultado = await associarPacienteProfessor(pacienteId, professorId)
    res.status(200).json(resultado)
  } catch (err) {
    next(err)
  }
}


async function getTodosPacientes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filtros = listarPacientesSchema.parse(req.query)
    const resultado = await listarPacientes(filtros)
    res.status(200).json(resultado)
  } catch (err) {
    next(err)
  }
}

async function getPacientesFisioterapeuta(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filtros = listarPacientesSchema.parse(req.query)
    const resultado = await listarPacientesFisioterapeuta(req.user!.fisioterapeutaId, req.user!.role, filtros)
    res.status(200).json(resultado)
  } catch (err) {
    next(err)
  }
}

async function getPacientesID(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pacienteId = Number(req.params.id)

    if (Number.isNaN(pacienteId)) {
      res.status(400).json({ code: 'ID_INVALIDO' })
      return
    }

    const resultado = await buscarPacientePorId(
      pacienteId,
      req.user!.fisioterapeutaId,
      req.user!.role
    )
    res.status(200).json(resultado)
  } catch (err) {
    next(err)
  }
}

export { 
  cadastrar, 
  getTodosPacientes, 
  getPacientesFisioterapeuta,
  getPacientesID, 
  associarPaciProfessor,
  associarPaciAluno 
}
