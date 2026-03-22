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
  if (prefixo === 'b') return 'Gravidade da deficiência'
  if (prefixo === 's') return 'Extensão da deficiência'
  if (prefixo === 'd') return 'Desempenho'
  if (prefixo === 'e') {
    if (item.tipoQualificador1 === 'FACILITADOR') return 'Grau do facilitador'
    return 'Grau da barreira'
  }
  return 'Qualificador 1'
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

/**
 * Retorna os valores de qualificadores usados no item
 * @param {object} item - Item CIF
 * @returns {number[]}
 */
export function obterValoresQualificadoresUsados(item) {
  const prefixo = obterPrefixoCIF(item.codigoCIF)
  if (prefixo === 'b') {
    return [item.qualificador1].filter((v) => typeof v === 'number')
  }
  if (prefixo === 's') {
    return [item.qualificador1, item.qualificador2, item.qualificador3].filter(
      (v) => typeof v === 'number'
    )
  }
  if (prefixo === 'd') {
    const base = [item.qualificador1, item.qualificador2]
    const avancado = item.modoAvancado
      ? [item.qualificador3, item.qualificador4]
      : []
    return [...base, ...avancado].filter((v) => typeof v === 'number')
  }
  if (prefixo === 'e') {
    return [item.qualificador1].filter((v) => typeof v === 'number')
  }
  return []
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
  if (prefixo === 'b') {
    if (typeof item.qualificador1 !== 'number') {
      erros.push('Itens de função do corpo exigem qualificador1.')
    }
  }
  if (prefixo === 's') {
    if (typeof item.qualificador1 !== 'number') {
      erros.push('Itens de estrutura do corpo exigem qualificador1.')
    }
  }
  if (prefixo === 'd') {
    if (typeof item.qualificador1 !== 'number') {
      erros.push('Itens de atividade/participação exigem desempenho.')
    }
    if (typeof item.qualificador2 !== 'number') {
      erros.push('Itens de atividade/participação exigem capacidade.')
    }
  }
  if (prefixo === 'e') {
    if (!item.tipoQualificador1) {
      erros.push('Fator ambiental exige tipo: barreira ou facilitador.')
    }
    if (typeof item.qualificador1 !== 'number') {
      erros.push('Fator ambiental exige grau.')
    }
  }
  if (possuiNaoEspecificado(item) && !item.justificativaNaoEspecificado?.trim()) {
    erros.push('Preencha o feedback de não especificado.')
  }
  if (possuiNaoAplicavel(item) && !item.justificativaNaoAplicavel?.trim()) {
    erros.push('Preencha o feedback de não aplicável.')
  }
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
export const STRUCTURE_NATURE_OPTIONS = OPCOES_NATUREZA_ESTRUTURA
export const STRUCTURE_LOCATION_OPTIONS = OPCOES_LOCALIZACAO_ESTRUTURA

