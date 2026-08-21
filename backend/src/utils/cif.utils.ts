// backend/src/utils/cif.utils.ts

import { ItemCIF, CategoriaCIF } from '@prisma/client'

export type ItemCIFDetalhado = ItemCIF & {
  tipoQualificador1?: string | null
}

export const QUALIFICADOR_GERAL_LABELS: Record<number, string> = {
  0: 'Nenhum problema',
  1: 'Ligeiro',
  2: 'Moderado',
  3: 'Grave',
  4: 'Completo',
  8: 'Não especificado',
  9: 'Não aplicável',
}

export const QUALIFICADOR_DEFICIENCIA_LABELS: Record<number, string> = {
  0: 'NENHUMA deficiência',
  1: 'deficiência LIGEIRA',
  2: 'deficiência MODERADA',
  3: 'deficiência GRAVE',
  4: 'deficiência COMPLETA',
  8: 'não especificada',
  9: 'não aplicável',
}

export const QUALIFICADOR_NATUREZA_ESTRUTURA_LABELS: Record<number, string> = {
  0: 'Nenhuma mudança na estrutura',
  1: 'Ausência total',
  2: 'Ausência parcial',
  3: 'Parte adicional',
  4: 'Dimensões aberrantes',
  5: 'Descontinuidade',
  6: 'Posição desviada',
  7: 'Mudanças qualitativas na estrutura, incluindo acumulação de fluidos',
  8: 'Não especificada',
  9: 'Não aplicável',
}

export const QUALIFICADOR_LOCALIZACAO_ESTRUTURA_LABELS: Record<number, string> = {
  0: 'Mais de uma região',
  1: 'direita',
  2: 'esquerda',
  3: 'ambos os lados',
  4: 'parte anterior',
  5: 'parte posterior',
  6: 'proximal',
  7: 'distal',
  8: 'Não especificada',
  9: 'Não aplicável',
}

export const QUALIFICADOR_OBSTACULO_LABELS: Record<number, string> = {
  0: 'NENHUM obstáculo',
  1: 'obstáculo LEVE',
  2: 'obstáculo MODERADO',
  3: 'obstáculo GRAVE',
  4: 'obstáculo COMPLETO',
  8: 'obstáculo não especificado',
  9: 'não aplicável',
}

export const QUALIFICADOR_FACILITADOR_LABELS: Record<number, string> = {
  0: 'NENHUM facilitador',
  1: 'facilitador LEVE',
  2: 'facilitador MODERADO',
  3: 'facilitador GRAVE',
  4: 'facilitador COMPLETO',
  8: 'facilitador não especificado',
  9: 'não aplicável',
}

export function obterPrefixoCIF(codigo?: string | null) {
  const prefixo = codigo?.replace(/\s+/g, ' ').trim().toLowerCase().charAt(0)
  if (prefixo === 'b' || prefixo === 's' || prefixo === 'd' || prefixo === 'e') {
    return prefixo
  }
  return null
}

export function obterCapituloCIF(codigo?: string | null) {
  const texto = codigo?.replace(/\s+/g, ' ').trim().toLowerCase() || ''
  const match = texto.match(/^[bsde](\d)/)
  return match ? Number(match[1]) : null
}

export function ehLimitacaoAtividade(item: ItemCIFDetalhado) {
  const capitulo = obterCapituloCIF(item.codigoCIF)
  return capitulo !== null && capitulo >= 1 && capitulo <= 6
}

export function ehRestricaoParticipacao(item: ItemCIFDetalhado) {
  const capitulo = obterCapituloCIF(item.codigoCIF)
  return capitulo !== null && capitulo >= 7 && capitulo <= 9
}

export function obterNomeCampoQualificador(item: ItemCIFDetalhado, ordem: 1 | 2 | 3 | 4) {
  const prefixo = obterPrefixoCIF(item.codigoCIF)

  if (ordem === 1) {
    if (prefixo === 'b') return 'Gravidade da deficiência'
    if (prefixo === 's') return 'Extensão da deficiência'
    if (prefixo === 'd') return 'Desempenho'
    if (prefixo === 'e') {
      return item.tipoQualificador1 === 'FACILITADOR'
        ? 'Grau do facilitador'
        : 'Grau do obstáculo'
    }
    return 'Qualificador 1'
  }

  if (ordem === 2) {
    if (prefixo === 's') return 'Natureza da alteração'
    if (prefixo === 'd') return 'Capacidade'
    return 'Qualificador 2'
  }

  if (ordem === 3) {
    if (prefixo === 's') return 'Localização'
    if (prefixo === 'd') return 'Capacidade com auxílio'
    return 'Qualificador 3'
  }

  if (prefixo === 'd') return 'Desempenho sem auxílio'
  return 'Qualificador 4'
}

export function obterNomeValorQualificador(item: ItemCIFDetalhado, ordem: 1 | 2 | 3 | 4, valor: number) {
  const prefixo = obterPrefixoCIF(item.codigoCIF)

  if ((prefixo === 'b' || prefixo === 's') && ordem === 1) {
    return QUALIFICADOR_DEFICIENCIA_LABELS[valor] ?? String(valor)
  }

  if (prefixo === 'e' && ordem === 1) {
    if (item.tipoQualificador1 === 'FACILITADOR') {
      return QUALIFICADOR_FACILITADOR_LABELS[valor] ?? String(valor)
    }
    return QUALIFICADOR_OBSTACULO_LABELS[valor] ?? String(valor)
  }

  if (prefixo === 's' && ordem === 2) {
    return QUALIFICADOR_NATUREZA_ESTRUTURA_LABELS[valor] ?? String(valor)
  }

  if (prefixo === 's' && ordem === 3) {
    return QUALIFICADOR_LOCALIZACAO_ESTRUTURA_LABELS[valor] ?? String(valor)
  }

  return QUALIFICADOR_GERAL_LABELS[valor] ?? String(valor)
}

export function formatarQualificador(item: ItemCIFDetalhado, ordem: 1 | 2 | 3 | 4, valor: number) {
  const campo = obterNomeCampoQualificador(item, ordem)
  const nomeValor = obterNomeValorQualificador(item, ordem, valor)
  return `${campo}: ${valor} - ${nomeValor}`
}

export function formatarItemCIFDiagrama(item: ItemCIFDetalhado) {
  const qualificadores = [
    item.qualificador1 !== null && item.qualificador1 !== undefined
      ? formatarQualificador(item, 1, item.qualificador1)
      : null,
    item.qualificador2 !== null && item.qualificador2 !== undefined
      ? formatarQualificador(item, 2, item.qualificador2)
      : null,
    item.qualificador3 !== null && item.qualificador3 !== undefined
      ? formatarQualificador(item, 3, item.qualificador3)
      : null,
    item.qualificador4 !== null && item.qualificador4 !== undefined
      ? formatarQualificador(item, 4, item.qualificador4)
      : null,
  ].filter(Boolean)

  const obs = item.observacao?.trim()

  return [
    `• ${item.codigoCIF} - ${item.descricao?.trim() || ''}`,
    qualificadores.length ? `Qualificadores: ${qualificadores.join('; ')}` : '',
    obs ? `Obs.: ${obs}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

export function formatarItemCIF(item: ItemCIFDetalhado) {
  const qualificadores = [
    item.qualificador1 !== null && item.qualificador1 !== undefined
      ? formatarQualificador(item, 1, item.qualificador1)
      : null,
    item.qualificador2 !== null && item.qualificador2 !== undefined
      ? formatarQualificador(item, 2, item.qualificador2)
      : null,
    item.qualificador3 !== null && item.qualificador3 !== undefined
      ? formatarQualificador(item, 3, item.qualificador3)
      : null,
    item.qualificador4 !== null && item.qualificador4 !== undefined
      ? formatarQualificador(item, 4, item.qualificador4)
      : null,
  ].filter(Boolean)

  const partes = [
    item.codigoCIF,
    item.descricao?.trim() || '',
    qualificadores.length ? `(${qualificadores.join(', ')})` : '',
    item.observacao?.trim() || '',
  ].filter(Boolean)

  return partes.join(' - ')
}

export function resumirItens(itens: ItemCIFDetalhado[], categorias: CategoriaCIF[]) {
  const filtrados = itens.filter((item) => categorias.includes(item.categoria))
  if (!filtrados.length) return ''
  return filtrados.map(formatarItemCIF).join(' | ')
}