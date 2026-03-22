import { Request, Response, NextFunction } from 'express'
import { cadastrarRelatorio } from '../services/relatorio.service'
import { cadastroRelatorioSchema } from '../validators/relatorio.validator'
import { AppError } from '../errors/AppError'

async function criar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dados = cadastroRelatorioSchema.parse(req.body)
    const resultado = await cadastrarRelatorio(dados, (req as any).user as any)
    
    res.status(201).json({ message: 'Relatório criado' })
  } catch (err) {
    next(err)
  }
}

async function editar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // TODO: Implementar lógica de edição
    res.status(200).json({ message: 'Relatório editado' })
  } catch (err) {
    next(err)
  }
}

async function deletar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // TODO: Implementar lógica de exclusão
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

async function avaliar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // TODO: Implementar lógica de avaliação
    res.status(200).json({ message: 'Relatório avaliado' })
  } catch (err) {
    next(err)
  }
}

async function listar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // TODO: Implementar lógica de listagem com paginação
    // Query params: page, limit, codigoPaciente, status, dataInicio, dataFim, ordenacao, tipo, matriculaAluno
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    
    res.status(200).json({
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0
      }
    })
  } catch (err) {
    next(err)
  }
}

async function obterPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // TODO: Implementar lógica de busca por ID
    res.status(200).json({ message: 'Relatório encontrado' })
  } catch (err) {
    next(err)
  }
}

async function gerarPDF(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // TODO: Implementar lógica de geração de PDF
    res.status(200).json({ message: 'PDF gerado' })
  } catch (err) {
    next(err)
  }
}

export { criar, editar, deletar, avaliar, listar, obterPorId, gerarPDF }
