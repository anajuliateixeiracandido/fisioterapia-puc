import {
  obterPrefixoCIF,
  ehLimitacaoAtividade,
  ehRestricaoParticipacao,
  QUALIFICADOR_GERAL_LABELS,
  QUALIFICADOR_DEFICIENCIA_LABELS,
  QUALIFICADOR_NATUREZA_ESTRUTURA_LABELS,
  QUALIFICADOR_LOCALIZACAO_ESTRUTURA_LABELS,
  QUALIFICADOR_OBSTACULO_LABELS,
  QUALIFICADOR_FACILITADOR_LABELS,
} from './cif.utils'
import {
  preencherParagrafoPorTexto,
  preencherParagrafosSeguintesPorTexto,
  removerParagrafosSeguintesPorTexto,
  distribuirTexto,
  normalizarTexto,
  primeiroTextoDisponivel,
  preencherCelulaTabelaPorTitulo,
  preencherTextboxPorTitulo,
  ativarAutoResizeTextboxes,
  preencherParagrafoComRotulo,
  type Segmento,
} from './docx.utils'

// ─── Utilitários de Data ──────────────────────────────────────────────────────

export function parseDateBR(data: string): Date {
  if (data.includes('-') && !data.includes('/')) return new Date(data)
  const [dia, mes, ano] = data.split('/')
  return new Date(`${ano}-${mes}-${dia}`)
}

export function formatarDataExportacao(valor?: Date | string | null): string {
  if (!valor) return ''
  const data = valor instanceof Date ? valor : new Date(valor)
  if (Number.isNaN(data.getTime())) return ''
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(data)
}

export function calcularIdade(dataNascimento?: Date | string | null): string {
  if (!dataNascimento) return ''
  const nascimento = dataNascimento instanceof Date ? dataNascimento : new Date(dataNascimento)
  if (Number.isNaN(nascimento.getTime())) return ''

  const hoje = new Date()
  let idade = hoje.getFullYear() - nascimento.getFullYear()
  const aniversarioAindaNaoPassou =
    hoje.getMonth() < nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate())

  if (aniversarioAindaNaoPassou) idade -= 1
  return String(Math.max(idade, 0))
}

// ─── Formatador legível de itens CIF ─────────────────────────────────────────

function formatarItemCIFLegivel(item: any): string {
  const codigo    = normalizarTexto(item.codigoCIF)
  const descricao = normalizarTexto(item.descricao)
  const prefixo   = obterPrefixoCIF(codigo)
  const quals: string[] = []

  const lbl = (tabela: Record<number, string>, v: number) => tabela[v] ?? String(v)

  if (prefixo === 'b') {
    if (item.qualificador1 != null)
      quals.push(`Grau ${item.qualificador1} — ${lbl(QUALIFICADOR_DEFICIENCIA_LABELS, item.qualificador1)}`)
  } else if (prefixo === 's') {
    if (item.qualificador1 != null)
      quals.push(`Extensão ${item.qualificador1} — ${lbl(QUALIFICADOR_DEFICIENCIA_LABELS, item.qualificador1)}`)
    if (item.qualificador2 != null)
      quals.push(`Natureza ${item.qualificador2} — ${lbl(QUALIFICADOR_NATUREZA_ESTRUTURA_LABELS, item.qualificador2)}`)
    if (item.qualificador3 != null)
      quals.push(`Local ${item.qualificador3} — ${lbl(QUALIFICADOR_LOCALIZACAO_ESTRUTURA_LABELS, item.qualificador3)}`)
  } else if (prefixo === 'd') {
    if (item.qualificador1 != null)
      quals.push(`Desemp. ${item.qualificador1} — ${lbl(QUALIFICADOR_GERAL_LABELS, item.qualificador1)}`)
    if (item.qualificador2 != null)
      quals.push(`Cap. ${item.qualificador2} — ${lbl(QUALIFICADOR_GERAL_LABELS, item.qualificador2)}`)
    if (item.qualificador3 != null)
      quals.push(`Cap.+aux. ${item.qualificador3} — ${lbl(QUALIFICADOR_GERAL_LABELS, item.qualificador3)}`)
    if (item.qualificador4 != null)
      quals.push(`Desemp.-aux. ${item.qualificador4} — ${lbl(QUALIFICADOR_GERAL_LABELS, item.qualificador4)}`)
  } else if (prefixo === 'e') {
    if (item.qualificador1 != null) {
      const tabelaE = item.tipoQualificador1 === 'FACILITADOR' ? QUALIFICADOR_FACILITADOR_LABELS : QUALIFICADOR_OBSTACULO_LABELS
      const rotulo  = item.tipoQualificador1 === 'FACILITADOR' ? 'Facilitador' : 'Barreira'
      quals.push(`${rotulo} ${item.qualificador1} — ${lbl(tabelaE, item.qualificador1)}`)
    }
  }

  const linhaItem = quals.length > 0
    ? `• ${descricao} (${codigo}) · ${quals.join(' · ')}`
    : `• ${descricao} (${codigo})`

  return item.observacao?.trim()
    ? `${linhaItem}\n  Obs.: ${item.observacao.trim()}`
    : linhaItem
}

function resumirItensLegiveis(itens: any[], categorias: string[]): string {
  const filtrados = itens.filter((i) => categorias.includes(i.categoria))
  if (!filtrados.length) return ''
  return filtrados.map(formatarItemCIFLegivel).join('\n\n')
}

function resumirTabelaClinica(rotulo: string, texto: string): string {
  const valor = normalizarTexto(texto)
  return valor ? `${rotulo}: ${valor}` : ''
}

// ─── Preenchimento do Template ────────────────────────────────────────────────

export function preencherTemplate(xml: string, relatorio: any): string {
  const responsavel = relatorio.paciente.contatosEmergencia?.[0]
  const itens = relatorio.formularioCIF?.itens ?? []
  const cif   = relatorio.formularioCIF

  // ── Separação por prefixo CIF ─────────────────────────────────────────────
  const itensFuncao     = itens.filter((i: any) => obterPrefixoCIF(i.codigoCIF) === 'b')
  const itensEstrutura  = itens.filter((i: any) => obterPrefixoCIF(i.codigoCIF) === 's')
  const itensDominiod   = itens.filter((i: any) => obterPrefixoCIF(i.codigoCIF) === 'd')
  const itensAmbientais = itens.filter((i: any) => obterPrefixoCIF(i.codigoCIF) === 'e')

  // ── Resumos ───────────────────────────────────────────────────────────────
  const resumoFuncoes    = resumirItensLegiveis(itensFuncao,    ['FUNCAO'])
  const resumoEstruturas = resumirItensLegiveis(itensEstrutura, ['ESTRUTURA'])
  const resumoAmbientais = resumirItensLegiveis(itensAmbientais,['FACTOR_AMBIENTAL'])

  const resumoAtividadesD1a6 = resumirItensLegiveis(
    itensDominiod.filter((i: any) => ehLimitacaoAtividade(i)),
    ['ACTIVIDADE_PARTICIPACAO']
  )
  const resumoParticipacaoD7a9 = resumirItensLegiveis(
    itensDominiod.filter((i: any) => ehRestricaoParticipacao(i)),
    ['ACTIVIDADE_PARTICIPACAO']
  )

  // ── Diagrama CIF ──────────────────────────────────────────────────────────
  const resumoFuncoesEstruturasDiagrama = resumirItensLegiveis(
    itens.filter((i: any) => { const p = obterPrefixoCIF(i.codigoCIF); return p === 'b' || p === 's' }),
    ['FUNCAO', 'ESTRUTURA']
  )
  const resumoLimitacoesDiagrama   = resumirItensLegiveis(itensDominiod.filter((i: any) => ehLimitacaoAtividade(i)),   ['ACTIVIDADE_PARTICIPACAO'])
  const resumoParticipacaoDiagrama = resumirItensLegiveis(itensDominiod.filter((i: any) => ehRestricaoParticipacao(i)),['ACTIVIDADE_PARTICIPACAO'])

  // ── Campos clínicos ───────────────────────────────────────────────────────
  const condicaoSaude       = normalizarTexto(cif?.condicaoSaude)
  const queixaPrincipal     = normalizarTexto(cif?.queixaPrincipal)
  const demandaReabilitacao = normalizarTexto(cif?.demandaReabilitacao)
  const atividade1          = normalizarTexto(cif?.atividadeLimitacao)
  const atividade2          = normalizarTexto(cif?.restricaoParticipacao) || queixaPrincipal
  const fatoresPessoais     = normalizarTexto(cif?.factoresPessoais)

  const diagnostico = primeiroTextoDisponivel(
    normalizarTexto(cif?.diagnosticoFisioterapeutico),
    [
      queixaPrincipal ? `Queixa principal: ${queixaPrincipal}` : '',
      normalizarTexto(cif?.condicaoSaudeDescricao) ? `Condição: ${normalizarTexto(cif?.condicaoSaudeDescricao)}` : '',
      resumoFuncoes    ? `Achados de função:\n${resumoFuncoes}`      : '',
      resumoEstruturas ? `Achados de estrutura:\n${resumoEstruturas}` : '',
    ].filter(Boolean).join('\n')
  )

  const condutasDerivadas = primeiroTextoDisponivel(
    [
      normalizarTexto(cif?.planoTerapeutico),
      normalizarTexto(cif?.observacoes),
      relatorio.feedbacks?.length ? `Feedbacks:\n${relatorio.feedbacks.join('\n')}` : '',
    ].filter(Boolean).join('\n'),
    [
      'Treino funcional direcionado às limitações descritas.',
      atividade1 ? `Ênfase: ${atividade1}` : '',
      resumoAmbientais ? `Fator ambiental:\n${resumoAmbientais}` : '',
    ].filter(Boolean).join('\n')
  )

  const objetivoCurtoPrazo = primeiroTextoDisponivel(normalizarTexto(cif?.objetivoCurtoPrazo), normalizarTexto(cif?.planoTerapeutico))
  const objetivoLongoPrazo = primeiroTextoDisponivel(normalizarTexto(cif?.objetivoLongoPrazo), demandaReabilitacao, normalizarTexto(cif?.planoTerapeutico))

  // ── Tabelas ───────────────────────────────────────────────────────────────
  const componentesAtividade1   = resumoFuncoes
  const comportamentoAtividade1 = [
    atividade1,
    resumoAtividadesD1a6 ? `Impacto nas atividades:\n${resumoAtividadesD1a6}` : '',
  ].filter(Boolean).join('\n\n')
  const deficienciasAtividade1  = [
    resumirTabelaClinica('Queixa', queixaPrincipal),
    resumirTabelaClinica('Condição', normalizarTexto(cif?.condicaoSaudeDescricao)),
    resumoEstruturas ? `Estruturas comprometidas:\n${resumoEstruturas}` : '',
  ].filter(Boolean).join('\n\n')

  const componentesAtividade2   = resumoParticipacaoD7a9 || demandaReabilitacao
  const comportamentoAtividade2 = queixaPrincipal || normalizarTexto(cif?.observacoes)
  const deficienciasAtividade2  = resumoAmbientais ? `Fatores ambientais:\n${resumoAmbientais}` : ''

  const condicaoComplementarLinhas = [
    queixaPrincipal ? `Queixa principal: ${queixaPrincipal}` : '',
  ]

  let atualizado = xml

  // ─── 1. IDENTIFICAÇÃO — labels em negrito, valores separados ─────────────
  atualizado = preencherParagrafoComRotulo(atualizado, 'Nome do paciente:', [
    { texto: 'Nome do paciente: ', negrito: true },
    { texto: normalizarTexto(relatorio.paciente.nomeCompleto) },
    { texto: '    Prontuário nº: ', negrito: true },
    { texto: normalizarTexto(relatorio.paciente.codigo) },
  ])

  atualizado = preencherParagrafoComRotulo(atualizado, 'Data da Aval.:', [
    { texto: 'Data da Aval.: ', negrito: true },
    { texto: formatarDataExportacao(cif?.dataPreenchimento ?? relatorio.dataCriacao) },
    { texto: '    Data de Nascimento: ', negrito: true },
    { texto: formatarDataExportacao(relatorio.paciente.dataNascimento) },
    { texto: '    Idade Cronológica: ', negrito: true },
    { texto: calcularIdade(relatorio.paciente.dataNascimento) },
    { texto: '    Idade Corrigida: ', negrito: true },
  ])

  atualizado = preencherParagrafoComRotulo(atualizado, 'Nome do(a) Responsável / parentesco:', [
    { texto: 'Nome do(a) Responsável / parentesco: ', negrito: true },
    { texto: normalizarTexto(responsavel ? `${responsavel.nome} / ${responsavel.parentesco}` : '') },
  ])

  // ─── 2. QUADRO CLÍNICO — labels em negrito ───────────────────────────────
  const linhasCondicao = distribuirTexto(condicaoSaude, [75, 95, 95])
  const linhasComplementaresCondicao = [...linhasCondicao.slice(1), ...condicaoComplementarLinhas].filter(Boolean).slice(0, 2)

  atualizado = preencherParagrafoComRotulo(atualizado, 'Condição de Saúde ou diagnóstico clínico:', [
    { texto: 'Condição de Saúde ou diagnóstico clínico: ', negrito: true },
    { texto: linhasCondicao[0] },
  ])
  atualizado = preencherParagrafosSeguintesPorTexto(atualizado, 'Condição de Saúde ou diagnóstico clínico:', linhasComplementaresCondicao)
  atualizado = removerParagrafosSeguintesPorTexto(atualizado, 'Condição de Saúde ou diagnóstico clínico:', Math.max(2 - linhasComplementaresCondicao.length, 0), 1, linhasComplementaresCondicao.length)

  const linhasDemanda = distribuirTexto(demandaReabilitacao, [70, 95, 95])
  atualizado = preencherParagrafoComRotulo(atualizado, 'Demanda atual da FAMÍLIA/PACIENTE para a reabilitação:', [
    { texto: 'Demanda atual da FAMÍLIA/PACIENTE para a reabilitação: ', negrito: true },
    { texto: linhasDemanda[0] },
  ])
  atualizado = removerParagrafosSeguintesPorTexto(atualizado, 'Demanda atual da FAMÍLIA/PACIENTE para a reabilitação:', 2)

  const linhasAtividade = distribuirTexto(atividade1, [75, 95, 95])
  atualizado = preencherParagrafoComRotulo(atualizado, 'Atividade que executa com limitação:', [
    { texto: 'Atividade que executa com limitação: ', negrito: true },
    { texto: linhasAtividade[0] },
  ])
  atualizado = removerParagrafosSeguintesPorTexto(atualizado, 'Atividade que executa com limitação:', 2)

  // ─── 3. TABELAS ───────────────────────────────────────────────────────────
  atualizado = preencherParagrafoComRotulo(atualizado, 'Atividade 1:', [
    { texto: 'Atividade 1: ', negrito: true },
    { texto: atividade1 },
  ])
  atualizado = preencherParagrafoComRotulo(atualizado, 'Atividade 2:', [
    { texto: 'Atividade 2: ', negrito: true },
    { texto: atividade2 },
  ])

  atualizado = preencherCelulaTabelaPorTitulo(atualizado, 'Componentes neuromotores do movimento típico ausentes', 'Componentes neuromotores do movimento típico ausentes', componentesAtividade1, 1)
  atualizado = preencherCelulaTabelaPorTitulo(atualizado, 'Comportamento motor adaptativo utilizado pelo paciente ao realizar a atividade', 'Comportamento motor adaptativo utilizado pelo paciente ao realizar a atividade', comportamentoAtividade1, 1)
  atualizado = preencherCelulaTabelaPorTitulo(atualizado, 'Deficiências de função que impedem os componentes neuromotores e determinam o comportamento adaptativo', 'Deficiências de função que impedem os componentes neuromotores e determinam o comportamento adaptativo', deficienciasAtividade1, 1)
  atualizado = preencherCelulaTabelaPorTitulo(atualizado, 'Componentes neuromotores do movimento típico ausentes', 'Componentes neuromotores do movimento típico ausentes', componentesAtividade2, 2)
  atualizado = preencherCelulaTabelaPorTitulo(atualizado, 'Comportamento motor adaptativo utilizado pelo paciente ao realizar a atividade', 'Comportamento motor adaptativo utilizado pelo paciente ao realizar a atividade', comportamentoAtividade2, 2)
  atualizado = preencherCelulaTabelaPorTitulo(atualizado, 'Deficiências de função que impedem os componentes neuromotores e determinam o comportamento adaptativo', 'Deficiências de função que impedem os componentes neuromotores e determinam o comportamento adaptativo', deficienciasAtividade2, 2)

  // ─── 4. DIAGNÓSTICO ───────────────────────────────────────────────────────
  const linhasDiagnostico = distribuirTexto(diagnostico, [105, 105, 105])
  atualizado = preencherParagrafosSeguintesPorTexto(atualizado, 'DIAGNÓSTICO FISIOTERAPÊUTICO', linhasDiagnostico)

  // ─── 5. OBJETIVOS — labels em negrito ────────────────────────────────────
  const linhasCurtoPrazo = distribuirTexto(objetivoCurtoPrazo, [80, 105])
  atualizado = preencherParagrafoComRotulo(atualizado, 'Objetivo de curto prazo:', [
    { texto: 'Objetivo de curto prazo: ', negrito: true },
    { texto: linhasCurtoPrazo[0] },
  ])
  atualizado = preencherParagrafosSeguintesPorTexto(atualizado, 'Objetivo de curto prazo:', linhasCurtoPrazo.slice(1))

  const linhasLongoPrazo = distribuirTexto(objetivoLongoPrazo, [80, 105, 105])
  atualizado = preencherParagrafoComRotulo(atualizado, 'Objetivo de longo prazo:', [
    { texto: 'Objetivo de longo prazo: ', negrito: true },
    { texto: linhasLongoPrazo[0] },
  ])
  atualizado = preencherParagrafosSeguintesPorTexto(atualizado, 'Objetivo de longo prazo:', linhasLongoPrazo.slice(1))

  // ─── 6. CONDUTAS ──────────────────────────────────────────────────────────
  const MAX_LINHAS_CONDUTAS = 14
  const linhasCondutas = distribuirTexto(condutasDerivadas, Array.from({ length: MAX_LINHAS_CONDUTAS }, () => 105))
  atualizado = preencherParagrafosSeguintesPorTexto(atualizado, 'CONDUTAS', linhasCondutas)
  atualizado = removerParagrafosSeguintesPorTexto(atualizado, 'CONDUTAS', MAX_LINHAS_CONDUTAS - linhasCondutas.length, 1, linhasCondutas.length)

  // ─── 7. ASSINATURAS — labels em negrito ──────────────────────────────────
  atualizado = preencherParagrafoComRotulo(
    atualizado,
    'Nome (legível)/ nº de matrícula e assinatura do(s) aluno(s)',
    [
      { texto: 'Nome (legível)/ nº de matrícula e assinatura do(s) aluno(s): ', negrito: true },
      { texto: normalizarTexto(relatorio.fisioterapeuta.nomeCompleto) },
    ]
  )

  const nomeProfessor       = normalizarTexto(relatorio.professorResponsavel?.fisioterapeuta?.nomeCompleto)
  const nomeAutor           = normalizarTexto(relatorio.fisioterapeuta.nomeCompleto)
  const assinaturaProfessor = (nomeProfessor && nomeProfessor !== nomeAutor) ? nomeProfessor : ''

  atualizado = preencherParagrafoComRotulo(atualizado, 'Assinatura e carimbo do professor:', [
    { texto: 'Assinatura e carimbo do professor: ', negrito: true },
    { texto: assinaturaProfessor },
  ])

  // ─── 8. DIAGRAMA CIF ──────────────────────────────────────────────────────
  atualizado = preencherTextboxPorTitulo(
    atualizado, 'Condição de Saúde', normalizarTexto(cif?.condicaoSaude),
    { alinhamentoCorpo: 'center', tamanhoFonteTitulo: '22', tamanhoFonteCorpo: '20' }
  )
  atualizado = preencherTextboxPorTitulo(atualizado, 'Deficiências de Estrutura e Função do Corpo', resumoFuncoesEstruturasDiagrama, { alinhamentoCorpo: 'left', tamanhoFonteTitulo: '23', tamanhoFonteCorpo: '17', recuoCorpo: '80' })
  atualizado = preencherTextboxPorTitulo(atualizado, 'Limitações de Atividade',              resumoLimitacoesDiagrama,   { alinhamentoCorpo: 'left', tamanhoFonteTitulo: '23', tamanhoFonteCorpo: '17', recuoCorpo: '80' })
  atualizado = preencherTextboxPorTitulo(atualizado, 'Restrições de Participação Social',     resumoParticipacaoDiagrama, { alinhamentoCorpo: 'left', tamanhoFonteTitulo: '22', tamanhoFonteCorpo: '16', recuoCorpo: '80' })
  atualizado = preencherTextboxPorTitulo(atualizado, 'Fatores Ambientais (barreiras e facilitadores)', resumoAmbientais, { alinhamentoCorpo: 'left', tamanhoFonteTitulo: '22', tamanhoFonteCorpo: '16', recuoCorpo: '80' })
  atualizado = preencherTextboxPorTitulo(atualizado, 'Fatores Pessoais', fatoresPessoais,     { alinhamentoCorpo: 'left', tamanhoFonteTitulo: '22', tamanhoFonteCorpo: '16', recuoCorpo: '80' })

  // ─── 9. AUTO-RESIZE ───────────────────────────────────────────────────────
  atualizado = ativarAutoResizeTextboxes(atualizado)

  return atualizado
}