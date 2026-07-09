import { Request, Response, NextFunction } from 'express'
import {
  cadastrarRelatorio,
  editarRelatorio,
  deletarRelatorio,
  listarRelatorios,
  obterRelatorioPorId,
  gerarRelatorioDocx,
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
    const resultado = await cadastrarRelatorio(dados, req.user!)

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
    const resultado = await editarRelatorio(id, dados, req.user!)

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

    await deletarRelatorio(id, req.user!)

    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

async function listar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filtros = listarRelatoriosSchema.parse(req.query)
    const resultado = await listarRelatorios(filtros, req.user!)

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

    const resultado = await obterRelatorioPorId(id, req.user!)

    res.status(200).json(resultado)
  } catch (err) {
    next(err)
  }
}

async function gerarPDF(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id as string)

    if (isNaN(id)) {
      throw new AppError(400, 'INVALID_ID', 'ID inválido')
    }

    const arquivo = await gerarRelatorioDocx(id, req.user!)

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
    res.setHeader('Content-Disposition', `attachment; filename="${arquivo.fileName}"`)
    res.status(200).send(arquivo.buffer)
  } catch (err) {
    next(err)
  }
}

export { criar, editar, deletar, listar, obterPorId, gerarPDF }
