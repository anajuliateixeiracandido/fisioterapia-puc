import * as fs from 'fs'
import * as path from 'path'
import { CategoriaCIF, TipoCIF } from '@prisma/client'
import prisma from '../lib/prisma'

export type CIFSeedItem = {
  tipoCIF: TipoCIF
  codigo: string
  codigoPai: string | null
  descricao: string
  categoria: CategoriaCIF
  nivel: number
  capitulo: number | null
  ordemExibicao: number | null
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function normalizarDadosCIF(raw: unknown): CIFSeedItem[] {
  if (!Array.isArray(raw)) {
    throw new Error('Arquivo CIF deve ser um array de itens.')
  }

  return raw.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Item CIF na posição ${index} é inválido.`)
    }

    const entry = item as Record<string, unknown>

    if (!isNonEmptyString(entry.tipoCIF) || !['CIF', 'CIF_CJ'].includes(entry.tipoCIF)) {
      throw new Error(`Item CIF na posição ${index} possui tipoCIF inválido: ${String(entry.tipoCIF)}`)
    }

    if (!isNonEmptyString(entry.codigo)) {
      throw new Error(`Item CIF na posição ${index} está sem codigo.`)
    }

    if (!isNonEmptyString(entry.descricao)) {
      throw new Error(`Item CIF ${String(entry.codigo)} está sem descrição.`)
    }

    if (!isNonEmptyString(entry.categoria) || !Object.values(CategoriaCIF).includes(entry.categoria as CategoriaCIF)) {
      throw new Error(`Item CIF ${String(entry.codigo)} possui categoria inválida: ${String(entry.categoria)}`)
    }

    const nivel = Number(entry.nivel)
    if (!Number.isFinite(nivel)) {
      throw new Error(`Item CIF ${String(entry.codigo)} possui nível inválido.`)
    }

    const capitulo = entry.capitulo == null ? null : Number(entry.capitulo)
    const ordemExibicao = entry.ordemExibicao == null ? null : Number(entry.ordemExibicao)

    return {
      tipoCIF: entry.tipoCIF as TipoCIF,
      codigo: entry.codigo.trim(),
      codigoPai: isNonEmptyString(entry.codigoPai) ? entry.codigoPai.trim() : null,
      descricao: entry.descricao.trim(),
      categoria: entry.categoria as CategoriaCIF,
      nivel,
      capitulo: Number.isFinite(capitulo) ? capitulo : null,
      ordemExibicao: Number.isFinite(ordemExibicao) ? ordemExibicao : null,
    }
  })
}

export async function carregarItensCIF(): Promise<{ total: number }> {
  const filePath = path.join(process.cwd(), 'prisma', 'data', 'cif.json')
  const raw = fs.readFileSync(filePath, 'utf-8')
  const data = normalizarDadosCIF(JSON.parse(raw))

  let total = 0
  const chunkSize = 1000

  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize)
    await prisma.cIFReferencia.createMany({
      data: chunk,
      skipDuplicates: true,
    })
    total += chunk.length
  }

  return { total }
}
