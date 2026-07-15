// ─── Utilitários de String e XML ──────────────────────────────────────────────

export function escapeXml(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function normalizarTexto(valor?: string | null, fallback = ''): string {
  const texto = valor?.replace(/\s+/g, ' ').trim()
  return texto ? texto : fallback
}

export function primeiroTextoDisponivel(...valores: Array<string | null | undefined>): string {
  for (const valor of valores) {
    const texto = normalizarTexto(valor)
    if (texto) return texto
  }
  return ''
}

export function normalizarTextoBusca(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

export function quebrarTexto(texto: string, limite: number): string[] {
  const valor = normalizarTexto(texto)
  if (!valor) return []

  const palavras = valor.split(' ')
  const linhas: string[] = []
  let linhaAtual = ''

  for (const palavra of palavras) {
    const candidato = linhaAtual ? `${linhaAtual} ${palavra}` : palavra
    if (candidato.length <= limite || !linhaAtual) {
      linhaAtual = candidato
      continue
    }
    linhas.push(linhaAtual)
    linhaAtual = palavra
  }
  if (linhaAtual) linhas.push(linhaAtual)

  return linhas
}

export function distribuirTexto(texto: string, larguras: number[]): string[] {
  const linhas = quebrarTexto(texto, Math.max(...larguras, 1))

  if (linhas.length <= 1) {
    return larguras.map((_, index) => (index === 0 ? normalizarTexto(texto) : ''))
  }

  const partes = normalizarTexto(texto).split(' ')
  const resultado = larguras.map(() => '')
  let linhaAtual = 0

  for (const palavra of partes) {
    if (linhaAtual >= larguras.length) {
      resultado[larguras.length - 1] = normalizarTexto(`${resultado[larguras.length - 1]} ${palavra}`)
      continue
    }

    const candidato = resultado[linhaAtual] ? `${resultado[linhaAtual]} ${palavra}` : palavra

    if (candidato.length <= larguras[linhaAtual] || !resultado[linhaAtual]) {
      resultado[linhaAtual] = candidato
      continue
    }

    linhaAtual += 1

    if (linhaAtual >= larguras.length) {
      resultado[larguras.length - 1] = normalizarTexto(`${resultado[larguras.length - 1]} ${palavra}`)
      continue
    }
    resultado[linhaAtual] = palavra
  }

  return resultado
}

export function extrairTextoParagrafo(paragrafo: string): string {
  return [...paragrafo.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)]
    .map((match) =>
      match[1]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
    )
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}

export function extrairTextoTextbox(conteudoBox: string): string {
  return [...conteudoBox.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)]
    .map((match) => extrairTextoParagrafo(match[0]))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ─── Manipulação e Substituição em Parágrafos XML ───────────────────────────

export function substituirTextoParagrafo(paragrafo: string, novoTexto: string): string {
  const abertura = paragrafo.match(/^<w:p\b[^>]*>/)?.[0] ?? '<w:p>'
  const propriedadesParagrafo = paragrafo.match(/<w:pPr[\s\S]*?<\/w:pPr>/)?.[0] ?? ''
  const propriedadesRun = paragrafo.match(/<w:rPr[\s\S]*?<\/w:rPr>/)?.[0] ?? ''

  const conteudo = novoTexto
    .split('\n')
    .map((linha) => normalizarTexto(linha))
    .filter((linha, indice, linhas) => linha || indice < linhas.length - 1)

  if (!conteudo.length || (conteudo.length === 1 && !conteudo[0])) {
    return `${abertura}${propriedadesParagrafo}</w:p>`
  }

  const corpo = conteudo
    .map((linha, indice) => {
      const quebra = indice < conteudo.length - 1 ? '<w:br/>' : ''
      return `<w:r>${propriedadesRun}<w:t xml:space="preserve">${escapeXml(linha)}</w:t>${quebra}</w:r>`
    })
    .join('')

  return `${abertura}${propriedadesParagrafo}${corpo}</w:p>`
}

export function encontrarInicioProximoParagrafo(xml: string, inicioBusca: number): number {
  const regex = /<w:p(?:\s|>)[^>]*>/g
  regex.lastIndex = inicioBusca
  const match = regex.exec(xml)
  return match?.index ?? -1
}

export function localizarParagrafoPorTexto(xml: string, texto: string, ocorrencia = 1) {
  let encontrados = 0
  const buscaNormalizada = normalizarTextoBusca(texto)
  const paragrafos = [...xml.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)]

  for (const paragrafo of paragrafos) {
    if (paragrafo.index === undefined) continue

    const conteudo = paragrafo[0]
    if (conteudo.includes('<w:drawing') || conteudo.includes('<mc:AlternateContent') || conteudo.includes('<w:sectPr')) {
      continue
    }

    const textoParagrafo = extrairTextoParagrafo(conteudo)
    if (!textoParagrafo) continue

    if (!normalizarTextoBusca(textoParagrafo).includes(buscaNormalizada)) continue

    encontrados += 1
    if (encontrados === ocorrencia) {
      return {
        inicio: paragrafo.index,
        fim: paragrafo.index + conteudo.length,
        conteudo,
      }
    }
  }
  return null
}

export function substituirTrecho(xml: string, inicio: number, fim: number, novoConteudo: string): string {
  return `${xml.slice(0, inicio)}${novoConteudo}${xml.slice(fim)}`
}

export function preencherParagrafoPorTexto(xml: string, textoBusca: string, texto: string, ocorrencia = 1): string {
  const alvo = localizarParagrafoPorTexto(xml, textoBusca, ocorrencia)
  if (!alvo) return xml
  return substituirTrecho(xml, alvo.inicio, alvo.fim, substituirTextoParagrafo(alvo.conteudo, texto))
}

export function preencherParagrafosSeguintesPorTexto(xml: string, textoAncora: string, linhas: string[], ocorrencia = 1): string {
  const ancora = localizarParagrafoPorTexto(xml, textoAncora, ocorrencia)
  if (!ancora) return xml

  let atualizado = xml
  let cursor = ancora.fim

  for (const linha of linhas) {
    const inicioParagrafo = encontrarInicioProximoParagrafo(atualizado, cursor)
    if (inicioParagrafo === -1) break

    const fimParagrafo = atualizado.indexOf('</w:p>', inicioParagrafo)
    if (fimParagrafo === -1) break

    const conteudo = atualizado.slice(inicioParagrafo, fimParagrafo + 6)
    const substituido = substituirTextoParagrafo(conteudo, linha)
    atualizado = substituirTrecho(atualizado, inicioParagrafo, fimParagrafo + 6, substituido)
    cursor = inicioParagrafo + substituido.length
  }
  return atualizado
}

export function removerParagrafosSeguintesPorTexto(xml: string, textoAncora: string, quantidade: number, ocorrencia = 1, pular = 0): string {
  const ancora = localizarParagrafoPorTexto(xml, textoAncora, ocorrencia)
  if (!ancora || quantidade <= 0) return xml

  let atualizado = xml
  let cursor = ancora.fim

  for (let indice = 0; indice < pular; indice += 1) {
    const inicioParagrafo = encontrarInicioProximoParagrafo(atualizado, cursor)
    if (inicioParagrafo === -1) return atualizado
    const fimParagrafo = atualizado.indexOf('</w:p>', inicioParagrafo)
    if (fimParagrafo === -1) return atualizado
    cursor = fimParagrafo + 6
  }

  for (let indice = 0; indice < quantidade; indice += 1) {
    const inicioParagrafo = encontrarInicioProximoParagrafo(atualizado, cursor)
    if (inicioParagrafo === -1) break
    const fimParagrafo = atualizado.indexOf('</w:p>', inicioParagrafo)
    if (fimParagrafo === -1) break

    atualizado = substituirTrecho(atualizado, inicioParagrafo, fimParagrafo + 6, '')
    cursor = inicioParagrafo
  }
  return atualizado
}

// ─── Estilização e Criação de XML do Word ────────────────────────────────────

export function normalizarAberturaParagrafo(paragrafo: string): string {
  const abertura = paragrafo.match(/^<w:p\b[^>]*>/)?.[0] ?? '<w:p>'
  return abertura
    .replace(/\s+w14:paraId="[^"]*"/g, '')
    .replace(/\s+w14:textId="[^"]*"/g, '')
    .replace(/\s+w:rsidRDefault="[^"]*"/g, '')
}

export function ajustarPropriedadesParagrafo(
  propriedadesParagrafo: string,
  alinhamento: 'center' | 'left',
  espacoAntes = '0',
  espacoDepois = '0',
  opcoes: {
    alturaLinha?: string
    recuoEsquerda?: string
    recuoDireita?: string
    recuoPrimeiraLinha?: string
  } = {}
): string {
  let resultado = propriedadesParagrafo || '<w:pPr></w:pPr>'

  if (resultado.includes('<w:jc ')) {
    resultado = resultado.replace(/<w:jc[^>]*w:val="[^"]*"\/>/, `<w:jc w:val="${alinhamento}"/>`)
  } else {
    resultado = resultado.replace('</w:pPr>', `<w:jc w:val="${alinhamento}"/></w:pPr>`)
  }

  const spacing =
    `<w:spacing w:before="${espacoAntes}" w:after="${espacoDepois}" ` +
    `w:line="${opcoes.alturaLinha ?? '210'}" w:lineRule="auto"/>`

  if (resultado.includes('<w:spacing ')) {
    resultado = resultado.replace(/<w:spacing[^>]*\/>/, spacing)
  } else {
    resultado = resultado.replace('</w:pPr>', `${spacing}</w:pPr>`)
  }

  const atributosInd = [
    opcoes.recuoEsquerda ? `w:left="${opcoes.recuoEsquerda}"` : '',
    opcoes.recuoDireita ? `w:right="${opcoes.recuoDireita}"` : '',
    opcoes.recuoPrimeiraLinha ? `w:firstLine="${opcoes.recuoPrimeiraLinha}"` : '',
  ]
    .filter(Boolean)
    .join(' ')

  if (atributosInd) {
    const ind = `<w:ind ${atributosInd}/>`
    if (resultado.includes('<w:ind ')) {
      resultado = resultado.replace(/<w:ind[^>]*\/>/, ind)
    } else {
      resultado = resultado.replace('</w:pPr>', `${ind}</w:pPr>`)
    }
  }

  return resultado
}

export function aplicarTamanhoFonte(
  propriedadesRun: string,
  tamanho = '18',
  opcoes: { negrito?: boolean; cor?: string; fonte?: string } = {}
): string {
  let resultado = propriedadesRun || '<w:rPr></w:rPr>'
  const fonte = opcoes.fonte ?? 'Calibri'
  const rFonts = `<w:rFonts w:ascii="${fonte}" w:hAnsi="${fonte}" w:cs="${fonte}"/>`

  if (resultado.includes('<w:rFonts ')) {
    resultado = resultado.replace(/<w:rFonts[^>]*\/>/, rFonts)
  } else {
    resultado = resultado.replace('</w:rPr>', `${rFonts}</w:rPr>`)
  }

  if (resultado.includes('<w:sz ')) {
    resultado = resultado.replace(/<w:sz[^>]*\/>/, `<w:sz w:val="${tamanho}"/>`)
  } else {
    resultado = resultado.replace('</w:rPr>', `<w:sz w:val="${tamanho}"/></w:rPr>`)
  }

  if (resultado.includes('<w:szCs ')) {
    resultado = resultado.replace(/<w:szCs[^>]*\/>/, `<w:szCs w:val="${tamanho}"/>`)
  } else {
    resultado = resultado.replace('</w:rPr>', `<w:szCs w:val="${tamanho}"/></w:rPr>`)
  }

  if (opcoes.cor) {
    if (resultado.includes('<w:color ')) {
      resultado = resultado.replace(/<w:color[^>]*\/>/, `<w:color w:val="${opcoes.cor}"/>`)
    } else {
      resultado = resultado.replace('</w:rPr>', `<w:color w:val="${opcoes.cor}"/></w:rPr>`)
    }
  }

  if (opcoes.negrito !== undefined) {
    resultado = resultado.replace(/<w:b(?:\s[^>]*)?\/>/g, '')
    resultado = resultado.replace(/<w:bCs(?:\s[^>]*)?\/>/g, '')
    if (opcoes.negrito) {
      resultado = resultado.replace('</w:rPr>', '<w:b/><w:bCs/></w:rPr>')
    }
  }

  return resultado
}

export function criarParagrafoComo(
  paragrafoBase: string,
  texto: string,
  opcoes: {
    alinhamento?: 'center' | 'left'
    espacoAntes?: string
    espacoDepois?: string
    bordaInferior?: boolean
    tamanhoFonte?: string
    negrito?: boolean
    cor?: string
    fonte?: string
    alturaLinha?: string
    recuoEsquerda?: string
    recuoDireita?: string
    recuoPrimeiraLinha?: string
  } = {}
): string {
  const abertura = normalizarAberturaParagrafo(paragrafoBase)
  let propriedadesParagrafo = paragrafoBase.match(/<w:pPr[\s\S]*?<\/w:pPr>/)?.[0] ?? ''

  propriedadesParagrafo = ajustarPropriedadesParagrafo(
    propriedadesParagrafo,
    opcoes.alinhamento ?? 'left',
    opcoes.espacoAntes ?? '0',
    opcoes.espacoDepois ?? '0',
    {
      alturaLinha: opcoes.alturaLinha ?? '210',
      recuoEsquerda: opcoes.recuoEsquerda,
      recuoDireita: opcoes.recuoDireita,
      recuoPrimeiraLinha: opcoes.recuoPrimeiraLinha,
    }
  )

  if (opcoes.bordaInferior) {
    const pBdr = '<w:pBdr><w:bottom w:val="single" w:sz="8" w:space="4" w:color="333333"/></w:pBdr>'
    if (propriedadesParagrafo.includes('<w:pBdr>')) {
      propriedadesParagrafo = propriedadesParagrafo.replace(/<w:pBdr>[\s\S]*?<\/w:pBdr>/, pBdr)
    } else {
      propriedadesParagrafo = propriedadesParagrafo.replace('</w:pPr>', `${pBdr}</w:pPr>`)
    }
  } else {
    propriedadesParagrafo = propriedadesParagrafo.replace(/<w:pBdr>[\s\S]*?<\/w:pBdr>/, '')
  }

  let propriedadesRun = '<w:rPr></w:rPr>'
  propriedadesRun = aplicarTamanhoFonte(propriedadesRun, opcoes.tamanhoFonte ?? '18', {
    negrito: opcoes.negrito ?? false,
    cor: opcoes.cor ?? '000000',
    fonte: opcoes.fonte ?? 'Calibri',
  })

  const conteudo = normalizarTexto(texto)
  if (!conteudo) return `${abertura}${propriedadesParagrafo}</w:p>`

  return `${abertura}${propriedadesParagrafo}<w:r>${propriedadesRun}<w:t xml:space="preserve">${escapeXml(conteudo)}</w:t></w:r></w:p>`
}

// ─── Manipulação de Textboxes e Tabelas XML ─────────────────────────────────

export function preencherTextboxPorTitulo(
  xml: string,
  tituloBusca: string,
  corpo: string,
  opcoes: { alinhamentoCorpo?: 'center' | 'left'; tamanhoFonteTitulo?: string; tamanhoFonteCorpo?: string; recuoCorpo?: string } = {}
): string {
  const matches = [...xml.matchAll(/<w:txbxContent>[\s\S]*?<\/w:txbxContent>/g)]
  const tituloNormalizado = normalizarTextoBusca(tituloBusca)

  for (const match of matches) {
    if (match.index === undefined) continue

    const conteudoBox = match[0]
    const textoBox = extrairTextoTextbox(conteudoBox)

    if (!normalizarTextoBusca(textoBox).includes(tituloNormalizado)) continue

    const paragrafos = [...conteudoBox.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)]
    if (!paragrafos.length) return xml

    const indiceTitulo = paragrafos.findIndex((paragrafo) =>
      normalizarTextoBusca(extrairTextoParagrafo(paragrafo[0])).includes(tituloNormalizado)
    )

    const paragrafoTituloBase = paragrafos[indiceTitulo >= 0 ? indiceTitulo : 0][0]
    const paragrafoCorpoBase = paragrafos[indiceTitulo + 1]?.[0] ?? paragrafos[1]?.[0] ?? paragrafoTituloBase

    const tituloParagrafo = criarParagrafoComo(paragrafoTituloBase, tituloBusca, {
      alinhamento: 'center',
      espacoAntes: '0',
      espacoDepois: '100',
      bordaInferior: false,
      tamanhoFonte: opcoes.tamanhoFonteTitulo ?? '22',
      negrito: true,
      cor: '000000',
      alturaLinha: '220',
    })

    const linhas = corpo.split(/\n+/).map((l) => normalizarTexto(l)).filter(Boolean)
    const paragrafosCorpo = linhas
      .map((linha, index) =>
        criarParagrafoComo(paragrafoCorpoBase, linha, {
          alinhamento: opcoes.alinhamentoCorpo ?? 'left',
          espacoAntes: index === 0 ? '40' : '20',
          espacoDepois: '25',
          bordaInferior: false,
          tamanhoFonte: opcoes.tamanhoFonteCorpo ?? '17',
          negrito: false,
          cor: '000000',
          alturaLinha: '205',
          recuoEsquerda: opcoes.recuoCorpo ?? '80',
          recuoDireita: '80',
        })
      )
      .join('')

    const novoConteudoBox = `<w:txbxContent>${tituloParagrafo}${paragrafosCorpo}</w:txbxContent>`
    return substituirTrecho(xml, match.index, match.index + conteudoBox.length, novoConteudoBox)
  }

  return xml
}

export function localizarCelulaPorTitulo(xml: string, tituloBusca: string, ocorrencia = 1) {
  const ancora = localizarParagrafoPorTexto(xml, tituloBusca, ocorrencia)
  if (!ancora) return null

  const trechoAnterior = xml.slice(0, ancora.inicio)
  const aberturasCelula = [...trechoAnterior.matchAll(/<w:tc(?:\s|>)[^>]*>/g)]
  const abertura = aberturasCelula[aberturasCelula.length - 1]

  if (!abertura || abertura.index === undefined) return null

  const inicioCelula = abertura.index
  const fimCelula = xml.indexOf('</w:tc>', ancora.fim)
  if (fimCelula === -1) return null

  return {
    inicio: inicioCelula,
    fim: fimCelula + 7,
    conteudo: xml.slice(inicioCelula, fimCelula + 7),
  }
}

export function ajustarPropriedadesCelula(propriedadesCelula: string, opcoes: { margemHorizontal?: string; margemVertical?: string } = {}): string {
  let resultado = propriedadesCelula || '<w:tcPr></w:tcPr>'
  const margemHorizontal = opcoes.margemHorizontal ?? '120'
  const margemVertical = opcoes.margemVertical ?? '100'

  const tcMar =
    `<w:tcMar>` +
    `<w:top w:w="${margemVertical}" w:type="dxa"/>` +
    `<w:left w:w="${margemHorizontal}" w:type="dxa"/>` +
    `<w:bottom w:w="${margemVertical}" w:type="dxa"/>` +
    `<w:right w:w="${margemHorizontal}" w:type="dxa"/>` +
    `</w:tcMar>`

  if (resultado.includes('<w:tcMar>')) {
    resultado = resultado.replace(/<w:tcMar>[\s\S]*?<\/w:tcMar>/, tcMar)
  } else {
    resultado = resultado.replace('</w:tcPr>', `${tcMar}</w:tcPr>`)
  }

  if (resultado.includes('<w:vAlign')) {
    resultado = resultado.replace(/<w:vAlign[^>]*\/>/, '<w:vAlign w:val="top"/>')
  } else {
    resultado = resultado.replace('</w:tcPr>', '<w:vAlign w:val="top"/></w:tcPr>')
  }

  return resultado
}

export function preencherCelulaTabelaPorTitulo(xml: string, tituloBusca: string, titulo: string, corpo: string, ocorrencia = 1): string {
  const celula = localizarCelulaPorTitulo(xml, tituloBusca, ocorrencia)
  if (!celula) return xml

  const paragrafos = [...celula.conteudo.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)]
  if (!paragrafos.length) return xml

  const paragrafoCabecalhoBase = paragrafos[0][0]
  const paragrafoCorpoBase = paragrafos[1]?.[0] ?? paragrafos[0][0]

  const tituloParagrafo = criarParagrafoComo(paragrafoCabecalhoBase, titulo, {
    alinhamento: 'center',
    espacoAntes: '0',
    espacoDepois: '90',
    bordaInferior: true,
    tamanhoFonte: '20',
    negrito: true,
    cor: '000000',
    alturaLinha: '220',
    recuoEsquerda: '80',
    recuoDireita: '80',
  })

  const blocosCorpo = normalizarTexto(corpo)
    ? corpo.split(/\n+/).map((parte) => normalizarTexto(parte)).filter(Boolean)
    : ['']

  const paragrafosCorpo = blocosCorpo
    .map((bloco, index) =>
      criarParagrafoComo(paragrafoCorpoBase, bloco, {
        alinhamento: 'left',
        espacoAntes: index === 0 ? '60' : '30',
        espacoDepois: '30',
        bordaInferior: false,
        tamanhoFonte: '17',
        negrito: false,
        cor: '000000',
        alturaLinha: '210',
        recuoEsquerda: '80',
        recuoDireita: '80',
      })
    )
    .join('')

  const tcPrOriginal = celula.conteudo.match(/<w:tcPr[\s\S]*?<\/w:tcPr>/)?.[0] ?? '<w:tcPr></w:tcPr>'
  const tcPrFinal = ajustarPropriedadesCelula(tcPrOriginal, { margemHorizontal: '120', margemVertical: '100' })

  const novaCelula = `<w:tc>${tcPrFinal}${tituloParagrafo}${paragrafosCorpo}</w:tc>`
  return substituirTrecho(xml, celula.inicio, celula.fim, novaCelula)
}

// ─── Parágrafo com label em negrito e valor normal ────────────────────────────

export type Segmento = { texto: string; negrito?: boolean }

export function substituirTextoParagrafoComSegmentos(
  paragrafo: string,
  segmentos: Segmento[],
  opcoes: { tamanhoFonte?: string } = {}
): string {
  const abertura = paragrafo.match(/^<w:p\b[^>]*>/)?.[0] ?? '<w:p>'
  const propriedadesParagrafo = paragrafo.match(/<w:pPr[\s\S]*?<\/w:pPr>/)?.[0] ?? ''
  const rPrBase = paragrafo.match(/<w:rPr[\s\S]*?<\/w:rPr>/)?.[0] ?? '<w:rPr></w:rPr>'

  // Filtra por .trim() mas usa o texto ORIGINAL (com espaços) no XML
  const filtrados = segmentos.filter((s) => s.texto?.trim())
  if (!filtrados.length) return `${abertura}${propriedadesParagrafo}</w:p>`

  const runs = filtrados
    .map((seg) => {
      const rPr = aplicarTamanhoFonte(rPrBase, opcoes.tamanhoFonte ?? '18', {
        negrito: seg.negrito ?? false,
        cor: '000000',
        fonte: 'Calibri',
      })
      // escapeXml direto — sem normalizarTexto — preserva espaços
      return `<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(seg.texto)}</w:t></w:r>`
    })
    .join('')

  return `${abertura}${propriedadesParagrafo}${runs}</w:p>`
}

export function preencherParagrafoComRotulo(
  xml: string,
  textoBusca: string,
  segmentos: Segmento[],
  ocorrencia = 1
): string {
  const alvo = localizarParagrafoPorTexto(xml, textoBusca, ocorrencia)
  if (!alvo) return xml
  return substituirTrecho(
    xml,
    alvo.inicio,
    alvo.fim,
    substituirTextoParagrafoComSegmentos(alvo.conteudo, segmentos)
  )
}

// ─── Auto-resize das caixas de texto ─────────────────────────────────────────

export function ativarAutoResizeTextboxes(xml: string): string {
  let resultado = xml

  resultado = resultado.replace(/<a:noAutofit\/>/g, '')
  resultado = resultado.replace(/<a:normAutofit[^/]*\/>/g, '')
  resultado = resultado.replace(/<a:spAutoFit\/>/g, '')

  resultado = resultado.replace(
    /<wps:bodyPr([^>]*?)\/>/g,
    '<wps:bodyPr$1><a:spAutoFit/></wps:bodyPr>'
  )
  resultado = resultado.replace(
    /(<wps:bodyPr\b[^>]*>)/g,
    '$1<a:spAutoFit/>'
  )
  resultado = resultado.replace(
    /<a:bodyPr([^>]*?)\/>/g,
    '<a:bodyPr$1><a:spAutoFit/></a:bodyPr>'
  )
  resultado = resultado.replace(
    /(<a:bodyPr\b[^>]*>)/g,
    '$1<a:spAutoFit/>'
  )

  return resultado
}