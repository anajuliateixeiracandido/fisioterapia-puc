import { Request, Response, NextFunction } from 'express'
import {
professorCadastroSchema,
alunoCadastroSchema,
atualizarPerfilSchema,
} from '../validators/fisioterapeuta.validator'
import {
cadastrarFisioterapeuta,
listarProfessores,
obterPerfil,
atualizarPerfil,
} from '../services/fisioterapeuta.service'
import { AppError } from '../errors/AppError'

async function cadastrar(req: Request, res: Response, next: NextFunction): Promise<void> {
try {
  const { role } = req.body

  if (role === 'PROFESSOR') {
    if (!req.user?.coordenador) {
      throw new AppError(403, 'FORBIDDEN', 'Apenas coordenadores podem cadastrar professores')
    }
    const dados = professorCadastroSchema.parse(req.body)
    const resultado = await cadastrarFisioterapeuta(dados)
    res.status(201).json(resultado)
    return
  }

  if (role === 'ALUNO') {
    if (req.user?.role !== 'PROFESSOR') {
      throw new AppError(403, 'FORBIDDEN', 'Apenas professores podem cadastrar alunos')
    }
    const dados = alunoCadastroSchema.parse(req.body)
    const resultado = await cadastrarFisioterapeuta(dados)
    res.status(201).json(resultado)
    return
  }

  throw new AppError(400, 'ROLE_INVALIDO', 'Role inválido para cadastro')
} catch (err) {
  next(err)
}
}

async function listar(req: Request, res: Response, next: NextFunction): Promise<void> {
try {
  const resultado = await listarProfessores()
  res.status(200).json(resultado)
} catch (err) {
  next(err)
}
}

async function obter(req: Request, res: Response, next: NextFunction): Promise<void> {
try {
  const resultado = await obterPerfil(req.user!.fisioterapeutaId)
  res.status(200).json(resultado)
} catch (err) {
  next(err)
}
}

async function atualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
try {
  const dados = atualizarPerfilSchema.parse(req.body)
  const resultado = await atualizarPerfil(req.user!.fisioterapeutaId, dados)
  res.status(200).json(resultado)
} catch (err) {
  next(err)
}
}

export { cadastrar, listar, obter, atualizar }