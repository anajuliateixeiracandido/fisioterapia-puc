import { Request, Response } from 'express'
import prisma from '../lib/prisma'

export async function listarReferencias(req: Request, res: Response) {
    try {
        let { categoria, tipoCIF, busca, limit = 2000, offset = 0 } = req.query

        if (Array.isArray(tipoCIF)) tipoCIF = tipoCIF[0]
        if (Array.isArray(categoria)) categoria = categoria[0]
        if (Array.isArray(busca)) busca = busca[0]
        if (Array.isArray(limit)) limit = limit[0]
        if (Array.isArray(offset)) offset = offset[0]

        const where: any = {}

        if (categoria) {
            where.categoria = categoria
        }

        if (tipoCIF === 'CIF') {
            where.tipoCIF = 'CIF'
        } else if (tipoCIF === 'CIF_CJ') {
            where.tipoCIF = { in: ['CIF', 'CIF_CJ'] }
        } else {
            where.tipoCIF = 'CIF'
        }

        if (busca) {
            where.OR = [
                { codigo: { contains: String(busca), mode: 'insensitive' } },
                { descricao: { contains: String(busca), mode: 'insensitive' } },
            ]
        }

        const [referencias, total] = await Promise.all([
            prisma.cIFReferencia.findMany({
                where,
                orderBy: [{ ordemExibicao: 'asc' }, { codigo: 'asc' }],
                take: Math.min(Number(limit), 5000),
                skip: Number(offset),
            }),
            prisma.cIFReferencia.count({ where }),
        ])

        res.json({ data: referencias, total, limit: Number(limit), offset: Number(offset) })
    } catch (error) {
        console.error('Erro ao listar referências CIF:', error)
        res.status(500).json({ erro: 'Erro ao buscar referências CIF' })
    }
}

export async function obterPorCodigo(req: Request, res: Response) {
    try {
        const codigo = Array.isArray(req.params.codigo)
            ? req.params.codigo[0]
            : String(req.params.codigo)

        const referencia = await prisma.cIFReferencia.findUnique({
            where: { codigo },
        })

        if (!referencia) {
            return res.status(404).json({ erro: 'Referência CIF não encontrada' })
        }

        res.json(referencia)
    } catch (error) {
        console.error('Erro ao obter referência CIF:', error)
        res.status(500).json({ erro: 'Erro ao buscar referência CIF' })
    }
}
