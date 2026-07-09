/**
 * Regras e utilitários para trabalhar com CIF
 */

export const QUALIFICADOR_0_A_4_8_9 = [
  { valor: 0, rotulo: '0 - Nenhum problema' },
  { valor: 1, rotulo: '1 - Ligeiro' },
  { valor: 2, rotulo: '2 - Moderado' },
  { valor: 3, rotulo: '3 - Grave' },
  { valor: 4, rotulo: '4 - Completo' },
  { valor: 8, rotulo: '8 - Não especificado' },
  { valor: 9, rotulo: '9 - Não aplicável' },
]

export const QUALIFICADOR_DEFICIENCIA_0_A_4_8_9 = [
  { valor: 0, rotulo: '0 - Nenhuma deficiência' },
  { valor: 1, rotulo: '1 - Deficiência ligeira' },
  { valor: 2, rotulo: '2 - Deficiência moderada' },
  { valor: 3, rotulo: '3 - Deficiência grave' },
  { valor: 4, rotulo: '4 - Deficiência completa' },
  { valor: 8, rotulo: '8 - Não especificada' },
  { valor: 9, rotulo: '9 - Não aplicável' },
]

export const QUALIFICADOR_OBSTACULO_0_A_4_8_9 = [
  { valor: 0, rotulo: '0 - Nenhum obstáculo' },
  { valor: 1, rotulo: '1 - Obstáculo leve' },
  { valor: 2, rotulo: '2 - Obstáculo moderado' },
  { valor: 3, rotulo: '3 - Obstáculo grave' },
  { valor: 4, rotulo: '4 - Obstáculo completo' },
  { valor: 8, rotulo: '8 - Obstáculo não especificado' },
  { valor: 9, rotulo: '9 - Não aplicável' },
]

export const QUALIFICADOR_FACILITADOR_0_A_4_8_9 = [
  { valor: 0, rotulo: '0 - Nenhum facilitador' },
  { valor: 1, rotulo: '1 - Facilitador leve' },
  { valor: 2, rotulo: '2 - Facilitador moderado' },
  { valor: 3, rotulo: '3 - Facilitador grave' },
  { valor: 4, rotulo: '4 - Facilitador completo' },
  { valor: 8, rotulo: '8 - Facilitador não especificado' },
  { valor: 9, rotulo: '9 - Não aplicável' },
]

export const OPCOES_NATUREZA_ESTRUTURA = [
  { valor: 0, rotulo: '0 - Nenhuma mudança na estrutura' },
  { valor: 1, rotulo: '1 - Ausência total' },
  { valor: 2, rotulo: '2 - Ausência parcial' },
  { valor: 3, rotulo: '3 - Parte adicional' },
  { valor: 4, rotulo: '4 - Dimensões aberrantes' },
  { valor: 5, rotulo: '5 - Descontinuidade' },
  { valor: 6, rotulo: '6 - Posição desviada' },
  { valor: 7, rotulo: '7 - Mudança qualitativa' },
  { valor: 8, rotulo: '8 - Não especificada' },
  { valor: 9, rotulo: '9 - Não aplicável' },
]

export const OPCOES_LOCALIZACAO_ESTRUTURA = [
  { valor: 0, rotulo: '0 - Mais de uma região' },
  { valor: 1, rotulo: '1 - Direita' },
  { valor: 2, rotulo: '2 - Esquerda' },
  { valor: 3, rotulo: '3 - Ambos os lados' },
  { valor: 4, rotulo: '4 - Parte anterior' },
  { valor: 5, rotulo: '5 - Parte posterior' },
  { valor: 6, rotulo: '6 - Proximal' },
  { valor: 7, rotulo: '7 - Distal' },
  { valor: 8, rotulo: '8 - Não especificada' },
  { valor: 9, rotulo: '9 - Não aplicável' },
]

/**
 * Extrai o prefixo (b, s, d, e) de um código CIF
 * @param {string} codigo - Código CIF
 * @returns {'b'|'s'|'d'|'e'|null}
 */
export function obterPrefixoCIF(codigo) {
  if (!codigo) return null
  const p = codigo.trim().toLowerCase()[0]
  if (p === 'b' || p === 's' || p === 'd' || p === 'e') return p
  return null
}

/**
 * Retorna o label do qualificador 1 baseado no prefixo
 * @param {object} item - Item CIF
 * @returns {string}
 */
export function obterRotuloQualificador1(item) {
  const prefixo = obterPrefixoCIF(item.codigoCIF)

  const rotulosPorPrefixo = {
    b: 'Gravidade da deficiência',
    s: 'Extensão da deficiência',
    d: 'Desempenho',
  }

  if (prefixo in rotulosPorPrefixo) {
    return rotulosPorPrefixo[prefixo]
  }

  if (prefixo === 'e') {
    return item.tipoQualificador1 === 'FACILITADOR'
      ? 'Grau do facilitador'
      : item.tipoQualificador1 === 'BARREIRA'
        ? 'Grau do obstáculo'
        : 'Grau (selecione o tipo)'
  }

  return 'Qualificador 1'
}

/**
 * Retorna as opções válidas de qualificador 1 por tipo de item
 * @param {object} item - Item CIF
 * @returns {Array<{valor:number,rotulo:string}>}
 */
export function obterOpcoesQualificador1(item) {
  const prefixo = obterPrefixoCIF(item.codigoCIF)

  if (prefixo === 'b' || prefixo === 's') {
    return QUALIFICADOR_DEFICIENCIA_0_A_4_8_9
  }

  if (prefixo === 'd') {
    return QUALIFICADOR_0_A_4_8_9
  }

  if (prefixo === 'e') {
    if (item.tipoQualificador1 === 'FACILITADOR') {
      return QUALIFICADOR_FACILITADOR_0_A_4_8_9
    }
    if (item.tipoQualificador1 === 'BARREIRA') {
      return QUALIFICADOR_OBSTACULO_0_A_4_8_9
    }
    return []
  }

  return QUALIFICADOR_0_A_4_8_9
}

/**
 * Retorna um mapa valor -> descrição para exibição do qualificador 1
 * @param {object} item - Item CIF
 * @returns {Record<number,string>}
 */
export function obterMapaRotulosQualificador1(item) {
  return Object.fromEntries(
    obterOpcoesQualificador1(item).map((op) => [
      op.valor,
      op.rotulo.replace(/^\d+\s*-\s*/, ''),
    ])
  )
}

/**
 * Retorna o label do qualificador 2 baseado no prefixo
 * @param {object} item - Item CIF
 * @returns {string}
 */
export function obterRotuloQualificador2(item) {
  const prefixo = obterPrefixoCIF(item.codigoCIF)
  if (prefixo === 's') return 'Natureza da alteração'
  if (prefixo === 'd') return 'Capacidade'
  return 'Qualificador 2'
}

/**
 * Retorna o label do qualificador 3 baseado no prefixo
 * @param {object} item - Item CIF
 * @returns {string}
 */
export function obterRotuloQualificador3(item) {
  const prefixo = obterPrefixoCIF(item.codigoCIF)
  if (prefixo === 's') return 'Localização'
  if (prefixo === 'd') return 'Capacidade com auxílio'
  return 'Qualificador 3'
}

/**
 * Retorna o label do qualificador 4 baseado no prefixo
 * @param {object} item - Item CIF
 * @returns {string}
 */
export function obterRotuloQualificador4(item) {
  const prefixo = obterPrefixoCIF(item.codigoCIF)
  if (prefixo === 'd') return 'Desempenho sem auxílio'
  return 'Qualificador 4'
}

/**
 * Determina quais campos devem ser exibidos baseado no prefixo do item
 * @param {object} item - Item CIF
 * @returns {object}
 */
export function obterCamposVisiveis(item) {
  const prefixo = obterPrefixoCIF(item.codigoCIF)
  return {
    exibirQualificador1: prefixo !== null,
    exibirTipoQualificador1: prefixo === 'e',
    exibirQualificador2: prefixo === 's' || prefixo === 'd',
    exibirQualificador3:
      prefixo === 's' || (prefixo === 'd' && item.modoAvancado === true),
    exibirQualificador4: prefixo === 'd' && item.modoAvancado === true,
    exibirModoAvancado: prefixo === 'd',
    exibirRelacionamento: prefixo === 'e',
    exibirObservacao: prefixo !== null,
  }
}

function apenasNumeros(valores) {
  return valores.filter((valor) => typeof valor === 'number')
}

/**
 * Retorna os valores de qualificadores usados no item
 * @param {object} item - Item CIF
 * @returns {number[]}
 */
export function obterValoresQualificadoresUsados(item) {
  const prefixo = obterPrefixoCIF(item.codigoCIF)

  const qualificadores = {
    b: [item.qualificador1],
    s: [item.qualificador1, item.qualificador2, item.qualificador3],
    d: [
      item.qualificador1,
      item.qualificador2,
      ...(item.modoAvancado ? [item.qualificador3, item.qualificador4] : []),
    ],
    e: [item.qualificador1],
  }

  return apenasNumeros(qualificadores[prefixo] ?? [])
}

/**
 * Verifica se o item tem qualificador 8 (não especificado)
 * @param {object} item - Item CIF
 * @returns {boolean}
 */
export function possuiNaoEspecificado(item) {
  return obterValoresQualificadoresUsados(item).includes(8)
}

/**
 * Verifica se o item tem qualificador 9 (não aplicável)
 * @param {object} item - Item CIF
 * @returns {boolean}
 */
export function possuiNaoAplicavel(item) {
  return obterValoresQualificadoresUsados(item).includes(9)
}

/**
 * Sugere fator ambiental baseado na diferença entre desempenho e capacidade
 * @param {object} item - Item CIF
 * @returns {object|null}
 */
export function sugerirFatorAmbiental(item) {
  const prefixo = obterPrefixoCIF(item.codigoCIF)
  if (prefixo !== 'd') return null
  if (
    typeof item.qualificador1 !== 'number' ||
    typeof item.qualificador2 !== 'number'
  ) {
    return null
  }
  if (item.qualificador1 === item.qualificador2) return null
  if (item.qualificador1 < item.qualificador2) {
    return {
      tipo: 'FACILITADOR',
      mensagem:
        'O desempenho está melhor que a capacidade. O ambiente habitual parece estar ajudando.',
    }
  }
  return {
    tipo: 'BARREIRA',
    mensagem:
      'O desempenho está pior que a capacidade. O ambiente habitual parece estar dificultando.',
  }
}

/**
 * Valida um item CIF
 * @param {object} item - Item CIF
 * @returns {string[]} - Array de mensagens de erro
 */
export function validarItemCIF(item) {
  const erros = []
  const prefixo = obterPrefixoCIF(item.codigoCIF)

  if (!item.codigoCIF) erros.push('Selecione um código CIF.')
  if (!prefixo) erros.push('Código CIF inválido.')

  const validacoesPorPrefixo = {
    b: () => {
      if (typeof item.qualificador1 !== 'number') erros.push('Itens de função do corpo exigem qualificador1.')
    },
    s: () => {
      if (typeof item.qualificador1 !== 'number') erros.push('Itens de estrutura do corpo exigem qualificador1.')
      if (typeof item.qualificador2 !== 'number') erros.push('Itens de estrutura do corpo exigem qualificador2.')
      if (typeof item.qualificador3 !== 'number') erros.push('Itens de estrutura do corpo exigem qualificador3.')
    },
    d: () => {
      if (typeof item.qualificador1 !== 'number') erros.push('Itens de atividade/participação exigem desempenho.')
      if (typeof item.qualificador2 !== 'number') erros.push('Itens de atividade/participação exigem capacidade.')
    },
    e: () => {
      if (!item.tipoQualificador1) erros.push('Fator ambiental exige tipo: barreira ou facilitador.')
      if (typeof item.qualificador1 !== 'number') erros.push('Fator ambiental exige grau.')
    },
  }

  validacoesPorPrefixo[prefixo]?.()

  if (possuiNaoEspecificado(item) && !item.justificativaNaoEspecificado?.trim())
    erros.push('Preencha o feedback de não especificado.')
  if (possuiNaoAplicavel(item) && !item.justificativaNaoAplicavel?.trim())
    erros.push('Preencha o feedback de não aplicável.')

  return erros
}

/**
 * Busca uma referência CIF pelo código
 * @param {Array} references - Array de referências CIF
 * @param {string} codigo - Código a buscar
 * @returns {object|undefined}
 */
export function buscarReferenciaPorCodigo(referencias, codigo) {
  return referencias.find((r) => r.codigo === codigo)
}

// Aliases para compatibilidade com código legado (manter temporariamente)
export const getPrefixoCIF = obterPrefixoCIF
export const getQualificador1Label = obterRotuloQualificador1
export const getQualificador2Label = obterRotuloQualificador2
export const getQualificador3Label = obterRotuloQualificador3
export const getQualificador4Label = obterRotuloQualificador4
export const getVisibleFields = obterCamposVisiveis
export const getUsedQualifierValues = obterValoresQualificadoresUsados
export const hasNaoEspecificado = possuiNaoEspecificado
export const hasNaoAplicavel = possuiNaoAplicavel
export const getDifferenceSuggestion = sugerirFatorAmbiental
export const validateItem = validarItemCIF
export const getReferenceByCode = buscarReferenciaPorCodigo
export const QUALIFIER_0_TO_4_8_9 = QUALIFICADOR_0_A_4_8_9
export const DEFICIENCY_QUALIFIER_0_TO_4_8_9 = QUALIFICADOR_DEFICIENCIA_0_A_4_8_9
export const OBSTACLE_QUALIFIER_0_TO_4_8_9 = QUALIFICADOR_OBSTACULO_0_A_4_8_9
export const FACILITATOR_QUALIFIER_0_TO_4_8_9 = QUALIFICADOR_FACILITADOR_0_A_4_8_9
export const STRUCTURE_NATURE_OPTIONS = OPCOES_NATUREZA_ESTRUTURA
export const STRUCTURE_LOCATION_OPTIONS = OPCOES_LOCALIZACAO_ESTRUTURA
export const getQualifier1Options = obterOpcoesQualificador1
export const getQualifier1LabelMap = obterMapaRotulosQualificador1

