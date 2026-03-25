import { Request, Response, NextFunction } from 'express'
import {
  cadastrarRelatorio,
  editarRelatorio,
  deletarRelatorio,
  listarRelatorios,
  obterRelatorioPorId,
} from '../services/relatorio.service'
import {
  cadastroRelatorioSchema,
  editarRelatorioSchema,
  listarRelatoriosSchema,
} from '../validators/relatorio.validator'
import { AppError } from '../errors/AppError'

async function criar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dados = cadastroRelatorioSchema.parse(req.body)
    const resultado = await cadastrarRelatorio(dados, (req as any).user)

    res.status(201).json({
      message: 'Relatório criado com sucesso',
      data: resultado,
    })
  } catch (err) {
    next(err)
  }
}

async function editar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id as string)

    if (isNaN(id)) {
      throw new AppError(400, 'INVALID_ID', 'ID inválido')
    }

    const dados = editarRelatorioSchema.parse(req.body)
    const resultado = await editarRelatorio(id, dados, (req as any).user)

    res.status(200).json({
      message: 'Relatório editado com sucesso',
      data: resultado,
    })
  } catch (err) {
    next(err)
  }
}

async function deletar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id as string)

    if (isNaN(id)) {
      throw new AppError(400, 'INVALID_ID', 'ID inválido')
    }

    await deletarRelatorio(id, (req as any).user)

    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

async function listar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filtros = listarRelatoriosSchema.parse(req.query)
    const resultado = await listarRelatorios(filtros, (req as any).user)

    res.status(200).json(resultado)
  } catch (err) {
    next(err)
  }
}

async function obterPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id as string)

    if (isNaN(id)) {
      throw new AppError(400, 'INVALID_ID', 'ID inválido')
    }

    const resultado = await obterRelatorioPorId(id, (req as any).user)

    res.status(200).json(resultado)
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

export { criar, editar, deletar, listar, obterPorId, gerarPDF }
