import { Request, Response, NextFunction } from 'express'
import {
  professorCadastroSchema,
  alunoCadastroSchema,
} from '../validators/fisioterapeuta.validator'
import { cadastrarFisioterapeuta, exibirTodosFisioterapeutas } from '../services/fisioterapeuta.service'
import { AppError } from '../errors/AppError'

async function cadastrar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { role } = req.body

    if (role === 'PROFESSOR') {
      const dados = professorCadastroSchema.parse(req.body)
      const resultado = await cadastrarFisioterapeuta(dados)
      res.status(201).json(resultado)
      return
    }

    if (role === 'ALUNO') {
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

async function getFisioterapeutas(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const resultado = await exibirTodosFisioterapeutas()
    res.status(200).json(resultado)
  } catch (err) {
    next(err)
  }
}


export { cadastrar, getFisioterapeutas }
