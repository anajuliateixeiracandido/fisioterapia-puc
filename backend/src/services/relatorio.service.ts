import fs from 'node:fs/promises'
import path from 'node:path'
import JSZip from 'jszip'
import prisma from '../lib/prisma'
import { AppError } from '../errors/AppError'
import {
  CadastroRelatorioInput,
  EditarRelatorioInput,
  ListarRelatoriosInput,
} from '../validators/relatorio.validator'
import { Prisma, CategoriaCIF, TipoFactorAmbiental } from '@prisma/client'
import { TokenPayload } from '../utils/jwt.utils'

// ─── Tipos e Constantes ───────────────────────────────────────────────────────

const RELATORIO_INCLUDE = {
  paciente: {
    include: {
      contatosEmergencia: {
        select: {
          nome: true,
          parentesco: true,
          telefone: true,
        },
      },
    },
  },
  fisioterapeuta: {
    select: {
      id: true,
      uid: true,
      nomeCompleto: true,
      email: true,
      role: true,
      aluno: {
        select: {
          matricula: true,
        },
      },
      professor: {
        select: {
          codigoPessoa: true,
        },
      },
    },
  },
  professorResponsavel: {
    select: {
      id: true,
      codigoPessoa: true,
      fisioterapeuta: {
        select: {
          id: true,
          nomeCompleto: true,
        },
      },
    },
  },
  formularioCIF: {
    include: {
      itens: {
        orderBy: {
          id: 'asc',
        },
      },
    },
  },
} satisfies Prisma.RelatorioInclude

type RelatorioDetalhado = Prisma.RelatorioGetPayload<{
  include: typeof RELATORIO_INCLUDE
}>

type FormularioCIFDetalhado = NonNullable<RelatorioDetalhado['formularioCIF']>
type ItemCIFDetalhado = FormularioCIFDetalhado['itens'][number]

const TEMPLATE_PATH = path.resolve(__dirname, '../../templates/avaliacao-funcional-pediatrica.docx')

// ─── Utilitários de Data e Texto ──────────────────────────────────────────────

function parseDateBR(data: string): Date {
  if (data.includes('-') && !data.includes('/')) {
    return new Date(data)
  }
  const [dia, mes, ano] = data.split('/')
  return new Date(`${ano}-${mes}-${dia}`)
}

function escapeXml(valor: string) {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatarDataExportacao(valor?: Date | string | null) {
  if (!valor) return ''

  const data = valor instanceof Date ? valor : new Date(valor)
  if (Number.isNaN(data.getTime())) return ''

  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(data)
}

function calcularIdade(dataNascimento?: Date | string | null) {
  if (!dataNascimento) return ''

  const nascimento = dataNascimento instanceof Date ? dataNascimento : new Date(dataNascimento)
  if (Number.isNaN(nascimento.getTime())) return ''

  const hoje = new Date()
  let idade = hoje.getFullYear() - nascimento.getFullYear()
  const aniversarioAindaNaoPassou =
    hoje.getMonth() < nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate())

  if (aniversarioAindaNaoPassou) {
    idade -= 1
  }

  return String(Math.max(idade, 0))
}

function normalizarTexto(valor?: string | null, fallback = '') {
  const texto = valor?.replace(/\s+/g, ' ').trim()
  return texto ? texto : fallback
}

function primeiroTextoDisponivel(...valores: Array<string | null | undefined>) {
  for (const valor of valores) {
    const texto = normalizarTexto(valor)
    if (texto) {
      return texto
    }
  }

  return ''
}

function montarCodigoRelatorio(relatorioId: number, dataCriacao: Date | string) {
  const data = dataCriacao instanceof Date ? dataCriacao : new Date(dataCriacao)
  const ano = Number.isNaN(data.getTime()) ? new Date().getFullYear() : data.getFullYear()
  return `REL-${ano}-${String(relatorioId).padStart(3, '0')}`
}

function quebrarTexto(texto: string, limite: number) {
  const valor = normalizarTexto(texto)

  if (!valor) {
    return []
  }

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

  if (linhaAtual) {
    linhas.push(linhaAtual)
  }

  return linhas
}

function distribuirTexto(texto: string, larguras: number[]) {
  const linhas = quebrarTexto(texto, Math.max(...larguras, 1))

  if (linhas.length <= 1) {
    return larguras.map((_, index) => (index === 0 ? normalizarTexto(texto) : ''))
  }

  const partes = normalizarTexto(texto).split(' ')
  const resultado = larguras.map(() => '')
  let linhaAtual = 0

  for (const palavra of partes) {
    if (linhaAtual >= larguras.length) {
      resultado[larguras.length - 1] = normalizarTexto(
        `${resultado[larguras.length - 1]} ${palavra}`
      )
      continue
    }

    const candidato = resultado[linhaAtual]
      ? `${resultado[linhaAtual]} ${palavra}`
      : palavra

    if (candidato.length <= larguras[linhaAtual] || !resultado[linhaAtual]) {
      resultado[linhaAtual] = candidato
      continue
    }

    linhaAtual += 1

    if (linhaAtual >= larguras.length) {
      resultado[larguras.length - 1] = normalizarTexto(
        `${resultado[larguras.length - 1]} ${palavra}`
      )
      continue
    }

    resultado[linhaAtual] = palavra
  }

  return resultado
}

// ─── Utilitários de Parsing XML ──────────────────────────────────────────────

function extrairTextoParagrafo(paragrafo: string) {
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

function normalizarTextoBusca(valor: string) {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function quebrarTextoPreservandoLinhas(texto: string, largura: number) {
  const blocos = texto
    .split(/\n+/)
    .map((linha) => normalizarTexto(linha))
    .filter(Boolean)

  const linhas: string[] = []

  for (const bloco of blocos) {
    const quebradas = quebrarTexto(bloco, largura)

    if (quebradas.length) {
      linhas.push(...quebradas)
    }
  }

  return linhas
}

// ─── Formatação de Itens CIF (diagrama) ──────────────────────────────────────

function formatarItemCIFDiagrama(item: ItemCIFDetalhado) {
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

  return [
    `• ${item.codigoCIF} - ${normalizarTexto(item.descricao)}`,
    qualificadores.length ? `Qualificadores: ${qualificadores.join('; ')}` : '',
    normalizarTexto(item.observacao) ? `Obs.: ${normalizarTexto(item.observacao)}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

// ─── Manipulação de Parágrafos XML ───────────────────────────────────────────

function substituirTextoParagrafo(paragrafo: string, novoTexto: string) {
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

function encontrarInicioProximoParagrafo(xml: string, inicioBusca: number) {
  const regex = /<w:p(?:\s|>)[^>]*>/g
  regex.lastIndex = inicioBusca
  const match = regex.exec(xml)

  return match?.index ?? -1
}

function localizarParagrafoPorParaId(xml: string, paraId: string) {
  const regex = new RegExp(`<w:p[^>]*w14:paraId="${paraId}"[^>]*>[\\s\\S]*?<\\/w:p>`)
  const match = regex.exec(xml)

  if (!match || match.index === undefined) {
    return null
  }

  return {
    inicio: match.index,
    fim: match.index + match[0].length,
    conteudo: match[0],
  }
}

function localizarParagrafoPorTexto(xml: string, texto: string, ocorrencia = 1) {
  let encontrados = 0
  const buscaNormalizada = normalizarTextoBusca(texto)
  const paragrafos = [...xml.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)]

  for (const paragrafo of paragrafos) {
    if (paragrafo.index === undefined) {
      continue
    }

    const conteudo = paragrafo[0]

    if (
      conteudo.includes('<w:drawing') ||
      conteudo.includes('<mc:AlternateContent') ||
      conteudo.includes('<w:sectPr')
    ) {
      continue
    }

    const textoParagrafo = extrairTextoParagrafo(conteudo)

    if (!textoParagrafo) {
      continue
    }

    if (!normalizarTextoBusca(textoParagrafo).includes(buscaNormalizada)) {
      continue
    }

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

function substituirTrecho(xml: string, inicio: number, fim: number, novoConteudo: string) {
  return `${xml.slice(0, inicio)}${novoConteudo}${xml.slice(fim)}`
}

function preencherParagrafoPorTexto(xml: string, textoBusca: string, texto: string, ocorrencia = 1) {
  const alvo = localizarParagrafoPorTexto(xml, textoBusca, ocorrencia)

  if (!alvo) {
    return xml
  }

  return substituirTrecho(xml, alvo.inicio, alvo.fim, substituirTextoParagrafo(alvo.conteudo, texto))
}

function preencherParagrafosSeguintesPorTexto(
  xml: string,
  textoAncora: string,
  linhas: string[],
  ocorrencia = 1
) {
  const ancora = localizarParagrafoPorTexto(xml, textoAncora, ocorrencia)

  if (!ancora) {
    return xml
  }

  let atualizado = xml
  let cursor = ancora.fim

  for (const linha of linhas) {
    const inicioParagrafo = encontrarInicioProximoParagrafo(atualizado, cursor)

    if (inicioParagrafo === -1) {
      break
    }

    const fimParagrafo = atualizado.indexOf('</w:p>', inicioParagrafo)

    if (fimParagrafo === -1) {
      break
    }

    const conteudo = atualizado.slice(inicioParagrafo, fimParagrafo + 6)
    const substituido = substituirTextoParagrafo(conteudo, linha)
    atualizado = substituirTrecho(atualizado, inicioParagrafo, fimParagrafo + 6, substituido)
    cursor = inicioParagrafo + substituido.length
  }

  return atualizado
}

function removerParagrafosSeguintesPorTexto(
  xml: string,
  textoAncora: string,
  quantidade: number,
  ocorrencia = 1,
  pular = 0
) {
  const ancora = localizarParagrafoPorTexto(xml, textoAncora, ocorrencia)

  if (!ancora || quantidade <= 0) {
    return xml
  }

  let atualizado = xml
  let cursor = ancora.fim

  for (let indice = 0; indice < pular; indice += 1) {
    const inicioParagrafo = encontrarInicioProximoParagrafo(atualizado, cursor)

    if (inicioParagrafo === -1) {
      return atualizado
    }

    const fimParagrafo = atualizado.indexOf('</w:p>', inicioParagrafo)

    if (fimParagrafo === -1) {
      return atualizado
    }

    cursor = fimParagrafo + 6
  }

  for (let indice = 0; indice < quantidade; indice += 1) {
    const inicioParagrafo = encontrarInicioProximoParagrafo(atualizado, cursor)

    if (inicioParagrafo === -1) {
      break
    }

    const fimParagrafo = atualizado.indexOf('</w:p>', inicioParagrafo)

    if (fimParagrafo === -1) {
      break
    }

    atualizado = substituirTrecho(atualizado, inicioParagrafo, fimParagrafo + 6, '')
    cursor = inicioParagrafo
  }

  return atualizado
}

// ─── Localização de Estruturas XML ───────────────────────────────────────────

function localizarCelulaPorParaId(xml: string, paraId: string) {
  const ancora = localizarParagrafoPorParaId(xml, paraId)

  if (!ancora) {
    return null
  }

  const inicioCelula = xml.lastIndexOf('<w:tc>', ancora.inicio)
  const fimCelula = xml.indexOf('</w:tc>', ancora.fim)

  if (inicioCelula === -1 || fimCelula === -1) {
    return null
  }

  return {
    inicio: inicioCelula,
    fim: fimCelula + 7,
    conteudo: xml.slice(inicioCelula, fimCelula + 7),
  }
}

// ─── Construção de Elementos XML ─────────────────────────────────────────────

function normalizarAberturaParagrafo(paragrafo: string) {
  const abertura = paragrafo.match(/^<w:p\b[^>]*>/)?.[0] ?? '<w:p>'
  return abertura
    .replace(/\s+w14:paraId="[^"]*"/g, '')
    .replace(/\s+w14:textId="[^"]*"/g, '')
    .replace(/\s+w:rsidRDefault="[^"]*"/g, '')
}

function ajustarPropriedadesParagrafo(
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
) {
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

function preencherTextboxPorTitulo(
  xml: string,
  tituloBusca: string,
  corpo: string,
  opcoes: {
    alinhamentoCorpo?: 'center' | 'left'
    tamanhoFonteTitulo?: string
    tamanhoFonteCorpo?: string
    recuoCorpo?: string
  } = {}
) {
  const matches = [...xml.matchAll(/<w:txbxContent>[\s\S]*?<\/w:txbxContent>/g)]
  const tituloNormalizado = normalizarTextoBusca(tituloBusca)

  for (const match of matches) {
    if (match.index === undefined) continue

    const conteudoBox = match[0]
    const textoBox = extrairTextoTextbox(conteudoBox)

    if (!normalizarTextoBusca(textoBox).includes(tituloNormalizado)) {
      continue
    }

    const paragrafos = [...conteudoBox.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)]

    if (!paragrafos.length) {
      return xml
    }

    const indiceTitulo = paragrafos.findIndex((paragrafo) =>
      normalizarTextoBusca(extrairTextoParagrafo(paragrafo[0])).includes(tituloNormalizado)
    )

    const paragrafoTituloBase = paragrafos[indiceTitulo >= 0 ? indiceTitulo : 0][0]
    const paragrafoCorpoBase =
      paragrafos[indiceTitulo + 1]?.[0] ??
      paragrafos[1]?.[0] ??
      paragrafoTituloBase

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

    const linhas = separarLinhasLogicas(corpo)

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

    return substituirTrecho(
      xml,
      match.index,
      match.index + conteudoBox.length,
      novoConteudoBox
    )
  }

  return xml
}

function preencherPrimeiroTextboxVazio(
  xml: string,
  corpo: string,
  opcoes: {
    tamanhoFonte?: string
  } = {}
) {
  const matches = [...xml.matchAll(/<w:txbxContent>[\s\S]*?<\/w:txbxContent>/g)]

  for (const match of matches) {
    if (match.index === undefined) continue

    const conteudoBox = match[0]
    const textoBox = extrairTextoTextbox(conteudoBox)

    if (textoBox) {
      continue
    }

    const paragrafos = [...conteudoBox.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)]
    const paragrafoBase = paragrafos[0]?.[0] ?? '<w:p><w:pPr></w:pPr></w:p>'

    const paragrafoCorpo = criarParagrafoComo(paragrafoBase, corpo, {
      alinhamento: 'center',
      espacoAntes: '0',
      espacoDepois: '0',
      tamanhoFonte: opcoes.tamanhoFonte ?? '18',
      negrito: true,
      cor: '000000',
      alturaLinha: '210',
      recuoEsquerda: '120',
      recuoDireita: '120',
    })

    const novoConteudoBox = `<w:txbxContent>${paragrafoCorpo}</w:txbxContent>`

    return substituirTrecho(
      xml,
      match.index,
      match.index + conteudoBox.length,
      novoConteudoBox
    )
  }

  return xml
}

function resumirItensSelecionados(itens: ItemCIFDetalhado[]) {
  if (!itens.length) return ''
  return itens.map(formatarItemCIFDiagrama).join('\n')
}

function obterCapituloCIF(codigo?: string | null) {
  const texto = normalizarTexto(codigo).toLowerCase()
  const match = texto.match(/^[bsde](\d)/)
  return match ? Number(match[1]) : null
}

function ehLimitacaoAtividade(item: ItemCIFDetalhado) {
  const capitulo = obterCapituloCIF(item.codigoCIF)

  // d1 a d6 ficam como atividade
  return capitulo !== null && capitulo >= 1 && capitulo <= 6
}

function ehRestricaoParticipacao(item: ItemCIFDetalhado) {
  const capitulo = obterCapituloCIF(item.codigoCIF)

  // d7 a d9 ficam como participação social
  return capitulo !== null && capitulo >= 7 && capitulo <= 9
}

function criarParagrafoComo(
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
) {
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
    const pBdr =
      '<w:pBdr><w:bottom w:val="single" w:sz="8" w:space="4" w:color="333333"/></w:pBdr>'

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

  if (!conteudo) {
    return `${abertura}${propriedadesParagrafo}</w:p>`
  }

  return `${abertura}${propriedadesParagrafo}<w:r>${propriedadesRun}<w:t xml:space="preserve">${escapeXml(
    conteudo
  )}</w:t></w:r></w:p>`
}

function separarBlocosTabela(texto: string) {
  const valor = normalizarTexto(texto)

  if (!valor) {
    return ['']
  }

  return valor
    .split(/\s*\|\s*|\n+/)
    .map((parte) => normalizarTexto(parte))
    .filter(Boolean)
}

function separarLinhasLogicas(texto: string) {
  return texto
    .split(/\n+/)
    .map((linha) => normalizarTexto(linha))
    .filter(Boolean)
}

function ajustarPropriedadesCelula(
  propriedadesCelula: string,
  opcoes: {
    margemHorizontal?: string
    margemVertical?: string
  } = {}
) {
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

function localizarCelulaPorTitulo(xml: string, tituloBusca: string, ocorrencia = 1) {
  const ancora = localizarParagrafoPorTexto(xml, tituloBusca, ocorrencia)

  if (!ancora) {
    return null
  }

  const trechoAnterior = xml.slice(0, ancora.inicio)
  const aberturasCelula = [...trechoAnterior.matchAll(/<w:tc(?:\s|>)[^>]*>/g)]
  const abertura = aberturasCelula[aberturasCelula.length - 1]

  if (!abertura || abertura.index === undefined) {
    return null
  }

  const inicioCelula = abertura.index
  const fimCelula = xml.indexOf('</w:tc>', ancora.fim)

  if (fimCelula === -1) {
    return null
  }

  return {
    inicio: inicioCelula,
    fim: fimCelula + 7,
    conteudo: xml.slice(inicioCelula, fimCelula + 7),
  }
}

function preencherCelulaTabelaPorTitulo(
  xml: string,
  tituloBusca: string,
  titulo: string,
  corpo: string,
  ocorrencia = 1
) {
  const celula = localizarCelulaPorTitulo(xml, tituloBusca, ocorrencia)

  if (!celula) {
    return xml
  }

  const paragrafos = [...celula.conteudo.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)]

  if (!paragrafos.length) {
    return xml
  }

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

  const blocosCorpo = separarBlocosTabela(corpo)

  const paragrafosCorpo = blocosCorpo
    .map((bloco, index) =>
      criarParagrafoComo(paragrafoCorpoBase, bloco, {
        alinhamento: 'left',
        espacoAntes: index === 0 ? '70' : '45',
        espacoDepois: '45',
        bordaInferior: false,
        tamanhoFonte: '19',
        negrito: false,
        cor: '000000',
        alturaLinha: '220',
        recuoEsquerda: '70',
        recuoDireita: '70',
      })
    )
    .join('')

  const tcPrOriginal = celula.conteudo.match(/<w:tcPr[\s\S]*?<\/w:tcPr>/)?.[0] ?? '<w:tcPr></w:tcPr>'

  const tcPrFinal = ajustarPropriedadesCelula(tcPrOriginal, {
    margemHorizontal: '120',
    margemVertical: '100',
  })

  const novaCelula = `<w:tc>${tcPrFinal}${tituloParagrafo}${paragrafosCorpo}</w:tc>`

  return substituirTrecho(xml, celula.inicio, celula.fim, novaCelula)
}
function extrairTextoTextbox(conteudoBox: string) {
  return [...conteudoBox.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)]
    .map((match) => extrairTextoParagrafo(match[0]))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function aplicarTamanhoFonte(
  propriedadesRun: string,
  tamanho = '18',
  opcoes: {
    negrito?: boolean
    cor?: string
    fonte?: string
  } = {}
) {
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

// ─── Labels de Qualificadores CIF ───────────────────────────────────────────

const QUALIFICADOR_GERAL_LABELS: Record<number, string> = {
  0: 'Nenhum problema',
  1: 'Ligeiro',
  2: 'Moderado',
  3: 'Grave',
  4: 'Completo',
  8: 'Não especificado',
  9: 'Não aplicável',
}

const QUALIFICADOR_DEFICIENCIA_LABELS: Record<number, string> = {
  0: 'NENHUMA deficiência',
  1: 'deficiência LIGEIRA',
  2: 'deficiência MODERADA',
  3: 'deficiência GRAVE',
  4: 'deficiência COMPLETA',
  8: 'não especificada',
  9: 'não aplicável',
}

const QUALIFICADOR_NATUREZA_ESTRUTURA_LABELS: Record<number, string> = {
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

const QUALIFICADOR_LOCALIZACAO_ESTRUTURA_LABELS: Record<number, string> = {
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

const QUALIFICADOR_OBSTACULO_LABELS: Record<number, string> = {
  0: 'NENHUM obstáculo',
  1: 'obstáculo LEVE',
  2: 'obstáculo MODERADO',
  3: 'obstáculo GRAVE',
  4: 'obstáculo COMPLETO',
  8: 'obstáculo não especificado',
  9: 'não aplicável',
}

const QUALIFICADOR_FACILITADOR_LABELS: Record<number, string> = {
  0: 'NENHUM facilitador',
  1: 'facilitador LEVE',
  2: 'facilitador MODERADO',
  3: 'facilitador GRAVE',
  4: 'facilitador COMPLETO',
  8: 'facilitador não especificado',
  9: 'não aplicável',
}

// ─── Lógica de Qualificadores CIF ────────────────────────────────────────────

function obterPrefixoCIF(codigo?: string | null) {
  const prefixo = normalizarTexto(codigo).toLowerCase().charAt(0)
  if (prefixo === 'b' || prefixo === 's' || prefixo === 'd' || prefixo === 'e') {
    return prefixo
  }
  return null
}

function obterNomeCampoQualificador(
  item: ItemCIFDetalhado,
  ordem: 1 | 2 | 3 | 4
) {
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

function obterNomeValorQualificador(
  item: ItemCIFDetalhado,
  ordem: 1 | 2 | 3 | 4,
  valor: number
) {
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

function formatarQualificador(item: ItemCIFDetalhado, ordem: 1 | 2 | 3 | 4, valor: number) {
  const campo = obterNomeCampoQualificador(item, ordem)
  const nomeValor = obterNomeValorQualificador(item, ordem, valor)
  return `${campo}: ${valor} - ${nomeValor}`
}

function formatarItemCIF(item: ItemCIFDetalhado) {
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
    normalizarTexto(item.descricao),
    qualificadores.length ? `(${qualificadores.join(', ')})` : '',
    normalizarTexto(item.observacao),
  ].filter(Boolean)

  return partes.join(' - ')
}

// ─── Resumo e Agregação de Itens CIF ─────────────────────────────────────────

function resumirItens(itens: ItemCIFDetalhado[], categorias: CategoriaCIF[]) {
  const filtrados = itens.filter((item) => categorias.includes(item.categoria))

  if (!filtrados.length) {
    return ''
  }

  return filtrados.map(formatarItemCIF).join(' | ')
}

function resumirTabelaClinica(rotulo: string, texto: string) {
  const valor = normalizarTexto(texto)
  return valor ? `${rotulo}: ${valor}` : ''
}

// ─── Preenchimento do Template DOCX ──────────────────────────────────────────

function preencherTemplate(xml: string, relatorio: RelatorioDetalhado) {
  const responsavel = relatorio.paciente.contatosEmergencia?.[0]
  const itens = relatorio.formularioCIF?.itens ?? []
  const resumoFuncoes = resumirItens(itens, ['ESTRUTURA', 'FUNCAO'])
  const resumoAtividades = resumirItens(itens, ['ACTIVIDADE_PARTICIPACAO'])
  const resumoAmbientais = resumirItens(itens, ['FACTOR_AMBIENTAL'])

  const condicaoSaude = primeiroTextoDisponivel(
    relatorio.formularioCIF?.condicaoSaude,
    relatorio.paciente.condicaoSaude
  )

  const diagnostico = primeiroTextoDisponivel(
    normalizarTexto(relatorio.formularioCIF?.diagnosticoFisioterapeutico),
    [
      normalizarTexto(relatorio.paciente.queixaPrincipal)
        ? `Queixa principal: ${normalizarTexto(relatorio.paciente.queixaPrincipal)}`
        : '',
      normalizarTexto(relatorio.formularioCIF?.condicaoSaudeDescricao)
        ? `Descrição da condição: ${normalizarTexto(relatorio.formularioCIF?.condicaoSaudeDescricao)}`
        : '',
      resumoFuncoes ? `Achados de estrutura/função: ${resumoFuncoes}` : '',
      resumoAtividades ? `Achados de atividade/participação: ${resumoAtividades}` : '',
    ]
      .filter(Boolean)
      .join(' | ')
  )

  const condutas = [
    normalizarTexto(relatorio.formularioCIF?.planoTerapeutico),
    normalizarTexto(relatorio.formularioCIF?.observacoes),
    relatorio.feedbacks?.length ? `Feedbacks: ${relatorio.feedbacks.join(' | ')}` : '',
  ]
    .filter(Boolean)
    .join(' | ')

  const objetivoCurtoPrazo = primeiroTextoDisponivel(
    normalizarTexto(relatorio.formularioCIF?.objetivoCurtoPrazo),
    relatorio.formularioCIF?.planoTerapeutico,
    [
      'Priorizar ganho funcional em transferências, equilíbrio e mobilidade segura.',
      normalizarTexto(relatorio.paciente.atividadeLimitacao)
        ? `Foco imediato: ${normalizarTexto(relatorio.paciente.atividadeLimitacao)}`
        : '',
    ]
      .filter(Boolean)
      .join(' ')
  )

  const objetivoLongoPrazo = primeiroTextoDisponivel(
    normalizarTexto(relatorio.formularioCIF?.objetivoLongoPrazo),
    relatorio.paciente.demandaReabilitacao,
    relatorio.formularioCIF?.planoTerapeutico
  )

  const condutasDerivadas = primeiroTextoDisponivel(
    condutas,
    [
      'Treino funcional direcionado às limitações descritas no relatório.',
      normalizarTexto(relatorio.paciente.atividadeLimitacao)
        ? `Ênfase clínica: ${normalizarTexto(relatorio.paciente.atividadeLimitacao)}`
        : '',
      normalizarTexto(relatorio.paciente.queixaPrincipal)
        ? `Monitorar queixa principal: ${normalizarTexto(relatorio.paciente.queixaPrincipal)}`
        : '',
      normalizarTexto(relatorio.paciente.observacoesIniciais)
        ? `Contexto inicial: ${normalizarTexto(relatorio.paciente.observacoesIniciais)}`
        : '',
      resumoAmbientais ? `Fator ambiental relevante: ${resumoAmbientais}` : '',
    ]
      .filter(Boolean)
      .join(' | ')
  )

  const fatoresPessoais =
    normalizarTexto(relatorio.formularioCIF?.factoresPessoais) ||
    normalizarTexto(relatorio.paciente.observacoesIniciais)

  const atividade1 = [
    normalizarTexto(relatorio.paciente.atividadeLimitacao),
    resumoAtividades ? `CIF: ${resumoAtividades}` : '',
  ]
    .filter(Boolean)
    .join(' | ')

  const atividade2 = normalizarTexto(relatorio.paciente.queixaPrincipal)

  const condicaoComplementarLinhas = [
    normalizarTexto(relatorio.paciente.queixaPrincipal)
      ? `Queixa principal: ${normalizarTexto(relatorio.paciente.queixaPrincipal)}`
      : '',
  ]

  const componentesAtividade1 = primeiroTextoDisponivel(
    resumoFuncoes,
    normalizarTexto(relatorio.paciente.condicaoSaude)
  )

  const comportamentoAtividade1 = primeiroTextoDisponivel(
    normalizarTexto(relatorio.paciente.atividadeLimitacao),
    normalizarTexto(relatorio.paciente.queixaPrincipal)
  )

  const deficienciasAtividade1 = [
    resumirTabelaClinica('Queixa', normalizarTexto(relatorio.paciente.queixaPrincipal)),
    resumirTabelaClinica('Condição', normalizarTexto(relatorio.formularioCIF?.condicaoSaudeDescricao)),
    resumirTabelaClinica('Estrutura/função', resumoFuncoes),
    resumirTabelaClinica('Atividade', resumoAtividades),
  ]
    .filter(Boolean)
    .join(' | ')

  const componentesAtividade2 = primeiroTextoDisponivel(
    resumoAtividades,
    normalizarTexto(relatorio.paciente.demandaReabilitacao)
  )

  const comportamentoAtividade2 = primeiroTextoDisponivel(
    normalizarTexto(relatorio.paciente.queixaPrincipal),
    normalizarTexto(relatorio.paciente.observacoesIniciais)
  )

  const deficienciasAtividade2 = [
    resumirTabelaClinica('Fator ambiental', resumoAmbientais),
  ]
    .filter(Boolean)
    .join(' | ')

  // ── Preenchimento ────────────────────────────────────────────────────────────

  let atualizado = xml

  // — Dados básicos do paciente
  atualizado = preencherParagrafoPorTexto(
    atualizado,
    'Nome do paciente:',
    `Nome do paciente: ${normalizarTexto(relatorio.paciente.nomeCompleto)} Prontuário nº: ${normalizarTexto(relatorio.paciente.codigo)}`
  )

  atualizado = preencherParagrafoPorTexto(
    atualizado,
    'Data da Aval.:',
    `Data da Aval.: ${formatarDataExportacao(relatorio.formularioCIF?.dataPreenchimento ?? relatorio.dataCriacao)} ` +
    `Data de Nascimento: ${formatarDataExportacao(relatorio.paciente.dataNascimento)} ` +
    `Idade Cronológica: ${calcularIdade(relatorio.paciente.dataNascimento)} ` +
    'Idade Corrigida: '
  )

  atualizado = preencherParagrafoPorTexto(
    atualizado,
    'Nome do(a) Responsável / parentesco:',
    `Nome do(a) Responsável / parentesco: ${normalizarTexto(
      responsavel ? `${responsavel.nome} / ${responsavel.parentesco}` : ''
    )}`
  )

  // — Condição de saúde
  const linhasCondicao = distribuirTexto(condicaoSaude, [75, 95, 95])
  const linhasComplementaresCondicao = [...linhasCondicao.slice(1), ...condicaoComplementarLinhas]
    .filter(Boolean)
    .slice(0, 2)

  atualizado = preencherParagrafoPorTexto(
    atualizado,
    'Condição de Saúde ou diagnóstico clínico:',
    `Condição de Saúde ou diagnóstico clínico: ${linhasCondicao[0]}`
  )
  atualizado = preencherParagrafosSeguintesPorTexto(
    atualizado,
    'Condição de Saúde ou diagnóstico clínico:',
    linhasComplementaresCondicao
  )
  atualizado = removerParagrafosSeguintesPorTexto(
    atualizado,
    'Condição de Saúde ou diagnóstico clínico:',
    Math.max(2 - linhasComplementaresCondicao.length, 0),
    1,
    linhasComplementaresCondicao.length
  )

  // — Demanda de reabilitação
  const linhasDemanda = distribuirTexto(normalizarTexto(relatorio.paciente.demandaReabilitacao), [70, 95, 95])
  atualizado = preencherParagrafoPorTexto(
    atualizado,
    'Demanda atual da FAMÍLIA/PACIENTE para a reabilitação:',
    `Demanda atual da FAMÍLIA/PACIENTE para a reabilitação: ${linhasDemanda[0]}`
  )
  atualizado = removerParagrafosSeguintesPorTexto(
    atualizado,
    'Demanda atual da FAMÍLIA/PACIENTE para a reabilitação:',
    2
  )

  // — Atividade com limitação
  const linhasAtividade = distribuirTexto(normalizarTexto(relatorio.paciente.atividadeLimitacao), [75, 95, 95])
  atualizado = preencherParagrafoPorTexto(
    atualizado,
    'Atividade que executa com limitação:',
    `Atividade que executa com limitação: ${linhasAtividade[0]}`
  )
  atualizado = removerParagrafosSeguintesPorTexto(
    atualizado,
    'Atividade que executa com limitação:',
    2
  )

  // — Atividades e análise CIF (tabelas)
  atualizado = preencherParagrafoPorTexto(atualizado, 'Atividade 1:', `Atividade 1: ${atividade1}`)
  atualizado = preencherParagrafoPorTexto(atualizado, 'Atividade 2:', `Atividade 2: ${atividade2}`)
  atualizado = preencherCelulaTabelaPorTitulo(
    atualizado,
    'Componentes neuromotores do movimento típico ausentes',
    'Componentes neuromotores do movimento típico ausentes',
    componentesAtividade1,
    1
  )
  atualizado = preencherCelulaTabelaPorTitulo(
    atualizado,
    'Comportamento motor adaptativo utilizado pelo paciente ao realizar a atividade',
    'Comportamento motor adaptativo utilizado pelo paciente ao realizar a atividade',
    comportamentoAtividade1,
    1
  )
  atualizado = preencherCelulaTabelaPorTitulo(
    atualizado,
    'Deficiências de função que impedem os componentes neuromotores e determinam o comportamento adaptativo',
    'Deficiências de função que impedem os componentes neuromotores e determinam o comportamento adaptativo',
    deficienciasAtividade1,
    1
  )
  atualizado = preencherCelulaTabelaPorTitulo(
    atualizado,
    'Componentes neuromotores do movimento típico ausentes',
    'Componentes neuromotores do movimento típico ausentes',
    componentesAtividade2,
    2
  )
  atualizado = preencherCelulaTabelaPorTitulo(
    atualizado,
    'Comportamento motor adaptativo utilizado pelo paciente ao realizar a atividade',
    'Comportamento motor adaptativo utilizado pelo paciente ao realizar a atividade',
    comportamentoAtividade2,
    2
  )
  atualizado = preencherCelulaTabelaPorTitulo(
    atualizado,
    'Deficiências de função que impedem os componentes neuromotores e determinam o comportamento adaptativo',
    'Deficiências de função que impedem os componentes neuromotores e determinam o comportamento adaptativo',
    deficienciasAtividade2,
    2
  )

  // — Diagnóstico fisioterapêutico
  const linhasDiagnostico = distribuirTexto(diagnostico, [105, 105, 105])
  atualizado = preencherParagrafosSeguintesPorTexto(
    atualizado,
    'DIAGNÓSTICO FISIOTERAPÊUTICO',
    linhasDiagnostico
  )

  // — Objetivos terapêuticos
  const linhasCurtoPrazoFinais = distribuirTexto(objetivoCurtoPrazo, [80, 105])
  atualizado = preencherParagrafoPorTexto(
    atualizado,
    'Objetivo de curto prazo:',
    `Objetivo de curto prazo: ${linhasCurtoPrazoFinais[0]}`
  )
  atualizado = preencherParagrafosSeguintesPorTexto(
    atualizado,
    'Objetivo de curto prazo:',
    linhasCurtoPrazoFinais.slice(1)
  )

  const linhasLongoPrazo = distribuirTexto(objetivoLongoPrazo, [80, 105, 105])
  atualizado = preencherParagrafoPorTexto(
    atualizado,
    'Objetivo de longo prazo:',
    `Objetivo de longo prazo: ${linhasLongoPrazo[0]}`
  )
  atualizado = preencherParagrafosSeguintesPorTexto(
    atualizado,
    'Objetivo de longo prazo:',
    linhasLongoPrazo.slice(1)
  )

  // — Condutas
  const linhasCondutas = distribuirTexto(condutasDerivadas, Array.from({ length: 14 }, () => 105))
  atualizado = preencherParagrafosSeguintesPorTexto(atualizado, 'CONDUTAS', linhasCondutas)

  // — Assinaturas
  atualizado = preencherParagrafoPorTexto(
    atualizado,
    'Nome (legível)/ nº de matrícula e assinatura do(s) aluno(s)',
    `Nome (legível)/ nº de matrícula e assinatura do(s) aluno(s): ${normalizarTexto(
      relatorio.fisioterapeuta.nomeCompleto
    )}`
  )

  atualizado = preencherParagrafoPorTexto(
    atualizado,
    'Assinatura e carimbo do professor:',
    `Assinatura e carimbo do professor: ${normalizarTexto(
      relatorio.professorResponsavel?.fisioterapeuta?.nomeCompleto
    )}`
  )

  // — Diagrama CIF (textboxes)
  const itensFuncoesEstruturas = itens.filter((item) => {
    const prefixo = obterPrefixoCIF(item.codigoCIF)
    return prefixo === 'b' || prefixo === 's'
  })

  const itensAtividade = itens.filter((item) => {
    const prefixo = obterPrefixoCIF(item.codigoCIF)
    return prefixo === 'd' && ehLimitacaoAtividade(item)
  })

  const itensParticipacao = itens.filter((item) => {
    const prefixo = obterPrefixoCIF(item.codigoCIF)
    return prefixo === 'd' && ehRestricaoParticipacao(item)
  })

  const itensAmbientais = itens.filter((item) => {
    const prefixo = obterPrefixoCIF(item.codigoCIF)
    return prefixo === 'e'
  })

  const textoFuncoesEstruturas = resumirItensSelecionados(itensFuncoesEstruturas)
  const textoLimitacoesAtividade = resumirItensSelecionados(itensAtividade)
  const textoRestricoesParticipacao = resumirItensSelecionados(itensParticipacao)
  const textoFatoresAmbientais = resumirItensSelecionados(itensAmbientais)
  const textoFatoresPessoais = normalizarTexto(fatoresPessoais)

  const textoCondicaoDiagrama = primeiroTextoDisponivel(
    condicaoSaude,
    relatorio.formularioCIF?.condicaoSaudeDescricao,
    relatorio.paciente.condicaoSaude
  )

  atualizado = preencherPrimeiroTextboxVazio(
  atualizado,
  textoCondicaoDiagrama ? `Condição de saúde: ${textoCondicaoDiagrama}` : '',
  {
    tamanhoFonte: '18',
  }
)

atualizado = preencherTextboxPorTitulo(
  atualizado,
  'Deficiências de Estrutura e Função do Corpo',
  textoFuncoesEstruturas,
  {
    alinhamentoCorpo: 'left',
    tamanhoFonteTitulo: '23',
    tamanhoFonteCorpo: '17',
    recuoCorpo: '80',
  }
)

atualizado = preencherTextboxPorTitulo(
  atualizado,
  'Limitações de Atividade',
  textoLimitacoesAtividade,
  {
    alinhamentoCorpo: 'left',
    tamanhoFonteTitulo: '23',
    tamanhoFonteCorpo: '17',
    recuoCorpo: '80',
  }
)

atualizado = preencherTextboxPorTitulo(
  atualizado,
  'Restrições de Participação Social',
  textoRestricoesParticipacao,
  {
    alinhamentoCorpo: 'left',
    tamanhoFonteTitulo: '22',
    tamanhoFonteCorpo: '16',
    recuoCorpo: '80',
  }
)

atualizado = preencherTextboxPorTitulo(
  atualizado,
  'Fatores Ambientais',
  textoFatoresAmbientais,
  {
    alinhamentoCorpo: 'left',
    tamanhoFonteTitulo: '22',
    tamanhoFonteCorpo: '16',
    recuoCorpo: '80',
  }
)

atualizado = preencherTextboxPorTitulo(
  atualizado,
  'Fatores Pessoais',
  textoFatoresPessoais,
  {
    alinhamentoCorpo: 'left',
    tamanhoFonteTitulo: '22',
    tamanhoFonteCorpo: '16',
    recuoCorpo: '80',
  }
)

  return atualizado
}

// ─── Serviços ─────────────────────────────────────────────────────────────────

async function carregarRelatorioComPermissao(id: number, usuario: TokenPayload) {
  const relatorio = await prisma.relatorio.findUnique({
    where: { id },
    include: RELATORIO_INCLUDE,
  })

  if (!relatorio) {
    throw new AppError(404, 'RELATORIO_NOT_FOUND', 'Relatório não encontrado')
  }

  if (usuario.role === 'ALUNO') {
    if (relatorio.fisioterapeutaId !== usuario.fisioterapeutaId) {
      throw new AppError(403, 'FORBIDDEN', 'Você não tem permissão para visualizar este relatório')
    }
  } else if (usuario.role === 'PROFESSOR') {
    const professor = await prisma.professor.findFirst({
      where: { fisioterapeutaId: usuario.fisioterapeutaId },
    })

    if (!professor) {
      throw new AppError(403, 'FORBIDDEN', 'Professor não encontrado')
    }

    const ehAutor = relatorio.fisioterapeutaId === usuario.fisioterapeutaId
    const ehSupervisor = relatorio.professorResponsavelId === professor.id
    const ehCoordenador = professor.coordenador === true

    if (!ehAutor && !ehSupervisor && !ehCoordenador) {
      throw new AppError(403, 'FORBIDDEN', 'Você não tem permissão para visualizar este relatório')
    }
  }

  return relatorio
}

async function gerarRelatorioDocx(id: number, usuario: TokenPayload) {
  const relatorio = await carregarRelatorioComPermissao(id, usuario)

  if (!relatorio.formularioCIF) {
    throw new AppError(400, 'RELATORIO_SEM_FORMULARIO', 'Relatório sem formulário CIF para exportação')
  }

  let templateBuffer: Buffer

  try {
    templateBuffer = await fs.readFile(TEMPLATE_PATH)
  } catch {
    throw new AppError(500, 'DOCX_TEMPLATE_NOT_FOUND', 'Modelo de relatório não encontrado no servidor')
  }

  const zip = await JSZip.loadAsync(templateBuffer)
  const documentFile = zip.file('word/document.xml')

  if (!documentFile) {
    throw new AppError(500, 'DOCX_TEMPLATE_INVALID', 'Modelo de relatório inválido')
  }

  const documentXml = await documentFile.async('string')
  const atualizado = preencherTemplate(documentXml, relatorio)

  zip.file('word/document.xml', atualizado)

  return {
    buffer: await zip.generateAsync({ type: 'nodebuffer' }),
    fileName: `relatorio-${montarCodigoRelatorio(relatorio.id, relatorio.dataCriacao)}.docx`,
  }
}

async function cadastrarRelatorio(dados: CadastroRelatorioInput, usuario: TokenPayload) {
  const paciente = await prisma.paciente.findUnique({
    where: { id: dados.pacienteId },
  })

  if (!paciente) {
    throw new AppError(404, 'PACIENTE_NOT_FOUND', 'Paciente não encontrado')
  }

  let professorResponsavelId: number | null = null
  if (usuario.role === 'PROFESSOR') {
    const professor = await prisma.professor.findFirst({
      where: { fisioterapeutaId: usuario.fisioterapeutaId },
    })
    professorResponsavelId = professor?.id ?? null
  } else if (usuario.role === 'ALUNO') {
    const aluno = await prisma.aluno.findFirst({
      where: { fisioterapeutaId: usuario.fisioterapeutaId },
      select: { professorId: true },
    })
    professorResponsavelId = aluno?.professorId ?? null
  }

  const statusInicial = usuario.role === 'ALUNO' ? 'ENVIADO' : 'APROVADO'

  const resultado = await prisma.$transaction(async (tx) => {
    const formulario = await tx.formularioCIF.create({
      data: {
        tipoCIF: dados.formularioCIF.tipoCIF,
        dataPreenchimento: parseDateBR(dados.formularioCIF.dataPreenchimento),
        ultimaAlteracao: dados.formularioCIF.ultimaAlteracao
          ? parseDateBR(dados.formularioCIF.ultimaAlteracao)
          : undefined,
        condicaoSaude: dados.formularioCIF.condicaoSaude,
        condicaoSaudeDescricao: dados.formularioCIF.condicaoSaudeDescricao,
        factoresPessoais: dados.formularioCIF.factoresPessoais,
        planoTerapeutico: dados.formularioCIF.planoTerapeutico,
        diagnosticoFisioterapeutico: dados.formularioCIF.diagnosticoFisioterapeutico,
        objetivoCurtoPrazo: dados.formularioCIF.objetivoCurtoPrazo,
        objetivoLongoPrazo: dados.formularioCIF.objetivoLongoPrazo,
        observacoes: dados.formularioCIF.observacoes,
        itens: dados.formularioCIF.itens?.length
          ? {
            createMany: {
              data: dados.formularioCIF.itens.map((item) => ({
                codigoCIF: item.codigoCIF,
                descricao: item.descricao,
                categoria: item.categoria as CategoriaCIF,
                nivel: item.nivel,
                qualificador1: item.qualificador1,
                tipoQualificador1: item.tipoQualificador1 as TipoFactorAmbiental | undefined,
                qualificador2: item.qualificador2,
                qualificador3: item.qualificador3,
                qualificador4: item.qualificador4,
                observacao: item.observacao,
              })),
            },
          }
          : undefined,
      },
      select: {
        id: true,
      },
    })

    const relatorio = await tx.relatorio.create({
      data: {
        pacienteId: dados.pacienteId,
        fisioterapeutaId: usuario.fisioterapeutaId,
        professorResponsavelId,
        status: statusInicial,
        formularioCIFId: formulario.id,
      },
      select: {
        id: true,
        status: true,
        dataCriacao: true,
        formularioCIF: {
          select: {
            id: true,
            tipoCIF: true,
            dataPreenchimento: true,
            ultimaAlteracao: true,
            condicaoSaude: true,
            condicaoSaudeDescricao: true,
            factoresPessoais: true,
            planoTerapeutico: true,
            diagnosticoFisioterapeutico: true,
            objetivoCurtoPrazo: true,
            objetivoLongoPrazo: true,
            observacoes: true,
            itens: {
              select: {
                id: true,
                codigoCIF: true,
                descricao: true,
                categoria: true,
                nivel: true,
                qualificador1: true,
                tipoQualificador1: true,
                qualificador2: true,
                qualificador3: true,
                qualificador4: true,
                observacao: true,
              },
            },
          },
        },
      },
    })

    return relatorio
  })

  return resultado
}

async function editarRelatorio(id: number, dados: EditarRelatorioInput, usuario: TokenPayload) {
  const relatorio = await prisma.relatorio.findUnique({
    where: { id },
    include: {
      fisioterapeuta: true,
      professorResponsavel: true,
      formularioCIF: {
        include: {
          itens: true,
        },
      },
    },
  })

  if (!relatorio) {
    throw new AppError(404, 'RELATORIO_NOT_FOUND', 'Relatório não encontrado')
  }

  // CASO 0: Edição completa do formulário CIF
  if (dados.formularioCIF) {
    // Verificar permissões — apenas o autor pode editar o conteúdo do relatório
    const isAutor = relatorio.fisioterapeutaId === usuario.fisioterapeutaId
    const isAprovado = relatorio.status === 'APROVADO'

    if (!isAutor || isAprovado) {
      throw new AppError(403, 'FORBIDDEN', 'Apenas o autor do relatório pode editá-lo')
    }

    // Se o relatório estava NEGADO, a edição o move para CORRIGIDO
    let novoStatus = relatorio.status
    if (relatorio.status === 'NEGADO') {
      novoStatus = 'CORRIGIDO'
    }

    // Atualizar formulário CIF e itens em uma transação
    const resultado = await prisma.$transaction(async (tx) => {
      // Deletar itens existentes
      await tx.itemCIF.deleteMany({
        where: { formularioCIFId: relatorio.formularioCIF!.id },
      })

      // Atualizar formulário CIF e criar novos itens
      await tx.formularioCIF.update({
        where: { id: relatorio.formularioCIF!.id },
        data: {
          tipoCIF: dados.formularioCIF!.tipoCIF,
          dataPreenchimento: parseDateBR(dados.formularioCIF!.dataPreenchimento),
          ultimaAlteracao: new Date(),
          condicaoSaude: dados.formularioCIF!.condicaoSaude,
          condicaoSaudeDescricao: dados.formularioCIF!.condicaoSaudeDescricao,
          factoresPessoais: dados.formularioCIF!.factoresPessoais,
          planoTerapeutico: dados.formularioCIF!.planoTerapeutico,
          diagnosticoFisioterapeutico: dados.formularioCIF!.diagnosticoFisioterapeutico,
          objetivoCurtoPrazo: dados.formularioCIF!.objetivoCurtoPrazo,
          objetivoLongoPrazo: dados.formularioCIF!.objetivoLongoPrazo,
          observacoes: dados.formularioCIF!.observacoes,
          itens: dados.formularioCIF!.itens?.length
            ? {
              createMany: {
                data: dados.formularioCIF!.itens.map((item) => ({
                  codigoCIF: item.codigoCIF,
                  descricao: item.descricao,
                  categoria: item.categoria as CategoriaCIF,
                  nivel: item.nivel,
                  qualificador1: item.qualificador1,
                  tipoQualificador1: item.tipoQualificador1 as TipoFactorAmbiental | undefined,
                  qualificador2: item.qualificador2,
                  qualificador3: item.qualificador3,
                  qualificador4: item.qualificador4,
                  observacao: item.observacao,
                })),
              },
            }
            : undefined,
        },
      })

      // Atualizar relatório com novo status e data de edição
      const relatorioAtualizado = await tx.relatorio.update({
        where: { id },
        data: {
          status: novoStatus,
          datasEdicao: {
            push: new Date(),
          },
        },
        include: {
          paciente: true,
          fisioterapeuta: true,
          professorResponsavel: {
            include: {
              fisioterapeuta: true,
            },
          },
          formularioCIF: {
            include: {
              itens: true,
            },
          },
        },
      })

      return relatorioAtualizado
    })

    return resultado
  }

  // CASO 1: Edição normal (professorResponsavelId)
  if (dados.professorResponsavelId !== undefined && !dados.status && !dados.feedback) {
    // Verificar se o usuário pode editar, só pode editar seus próprios relatórios
    if (relatorio.fisioterapeutaId !== usuario.fisioterapeutaId) {
      throw new AppError(403, 'FORBIDDEN', 'Você não tem permissão para editar este relatório')
    }

    // Não pode editar relatórios aprovados
    if (relatorio.status === 'APROVADO') {
      throw new AppError(
        400,
        'RELATORIO_JA_APROVADO',
        'Não é possível editar um relatório que já foi aprovado'
      )
    }

    // Determinar novo status baseado no status atual
    // Se estava NEGADO e aluno está corrigindo → muda para CORRIGIDO
    // Se estava ENVIADO ou CORRIGIDO → mantém o mesmo status
    let novoStatus = relatorio.status
    if (relatorio.status === 'NEGADO') {
      novoStatus = 'CORRIGIDO'
    }

    // Atualizar relatório e adicionar data de edição
    const resultado = await prisma.relatorio.update({
      where: { id },
      data: {
        professorResponsavelId: dados.professorResponsavelId,
        status: novoStatus,
        datasEdicao: {
          push: new Date(),
        },
      },
      include: {
        paciente: true,
        fisioterapeuta: true,
        professorResponsavel: true,
        formularioCIF: {
          include: {
            itens: true,
          },
        },
      },
    })

    return resultado
  }

  // CASO 2: Avaliação (status e/ou feedback)
  if (dados.status || dados.feedback) {
    // Não pode avaliar relatórios já aprovados
    if (relatorio.status === 'APROVADO') {
      throw new AppError(400, 'RELATORIO_JA_APROVADO', 'Este relatório já foi avaliado')
    }

    // Verificar se o professor tem permissão para avaliar
    const professor = await prisma.professor.findFirst({
      where: { fisioterapeutaId: usuario.fisioterapeutaId },
    })

    if (!professor) {
      throw new AppError(403, 'FORBIDDEN', 'Professor não encontrado')
    }

    // Coordenador pode avaliar qualquer relatório
    // Professor normal só pode avaliar se for responsável
    const isCoordenador = professor.coordenador === true
    const isProfessorResponsavel = relatorio.professorResponsavelId === professor.id

    if (!isCoordenador && !isProfessorResponsavel) {
      throw new AppError(403, 'FORBIDDEN', 'Você não tem permissão para avaliar este relatório')
    }

    const dataAtual = new Date()
    const updateData: Prisma.RelatorioUpdateInput = {}

    // Se enviou status, valida que seja APROVADO ou NEGADO
    if (dados.status) {
      if (dados.status !== 'APROVADO' && dados.status !== 'NEGADO') {
        throw new AppError(400, 'INVALID_STATUS', 'Status de avaliação deve ser APROVADO ou NEGADO')
      }

      // Se status for NEGADO, feedback é obrigatório
      if (dados.status === 'NEGADO' && (!dados.feedback || dados.feedback.trim().length === 0)) {
        throw new AppError(
          400,
          'FEEDBACK_OBRIGATORIO',
          'Feedback é obrigatório ao negar um relatório'
        )
      }

      updateData.status = dados.status
      updateData.dataAprovacao = dados.status === 'APROVADO' ? dataAtual : null
    }

    // Se enviou feedback, adiciona ao histórico
    if (dados.feedback) {
      updateData.feedbacks = {
        push: dados.feedback,
      }
      updateData.datasFeedback = {
        push: dataAtual,
      }
    }

    const resultado = await prisma.relatorio.update({
      where: { id },
      data: updateData,
      include: {
        paciente: true,
        fisioterapeuta: true,
        professorResponsavel: true,
        formularioCIF: {
          include: {
            itens: true,
          },
        },
      },
    })

    return resultado
  }

  // Se chegou aqui, não tem nada para atualizar
  throw new AppError(400, 'NO_DATA_TO_UPDATE', 'Nenhum dado foi fornecido para atualização')
}

async function deletarRelatorio(id: number, usuario: TokenPayload) {
  const relatorio = await prisma.relatorio.findUnique({
    where: { id },
  })

  if (!relatorio) {
    throw new AppError(404, 'RELATORIO_NOT_FOUND', 'Relatório não encontrado')
  }

  // Tanto ALUNO quanto PROFESSOR só podem deletar seus próprios relatórios
  if (relatorio.fisioterapeutaId !== usuario.fisioterapeutaId) {
    throw new AppError(403, 'FORBIDDEN', 'Você não tem permissão para deletar este relatório')
  }

  await prisma.relatorio.delete({
    where: { id },
  })
}

async function listarRelatorios(filtros: ListarRelatoriosInput, usuario: TokenPayload) {
  const {
    page,
    limit,
    codigoPaciente,
    nomePaciente,
    nomeResponsavel,
    codigoPessoaResponsavel,
    status,
    dataInicio,
    dataFim,
    ordenarPor,
    ordem,
    tipo,
    matriculaAluno,
  } = filtros

  const where: Prisma.RelatorioWhereInput = {}
  const andConditions: Prisma.RelatorioWhereInput[] = []

  if (tipo === 'authored') {
    // Apenas relatórios criados pelo usuário
    where.fisioterapeutaId = usuario.fisioterapeutaId
  } else if (tipo === 'all') {
    // PROFESSOR: relatórios que supervisiona (os de outros que ele é responsável e também os seus)
    if (usuario.role === 'PROFESSOR') {
      const professor = await prisma.professor.findFirst({
        where: { fisioterapeutaId: usuario.fisioterapeutaId },
      })
      if (professor) {
        where.professorResponsavelId = professor.id
      }
    }
  } else if (tipo === 'supervised') {
    // Apenas relatórios que o professor supervisiona (não criou)
    if (usuario.role === 'PROFESSOR') {
      const professor = await prisma.professor.findFirst({
        where: { fisioterapeutaId: usuario.fisioterapeutaId },
      })
      if (professor) {
        where.professorResponsavelId = professor.id
        where.NOT = {
          fisioterapeutaId: usuario.fisioterapeutaId,
        }
      }
    }
  } else if (tipo === 'todos') {
    if (usuario.role === 'ALUNO') {
      // Aluno só vê seus próprios relatórios
      where.fisioterapeutaId = usuario.fisioterapeutaId
    } else if (usuario.role === 'PROFESSOR') {
      if (!usuario.coordenador) {
        // Professor não-coordenador: seus próprios + relatórios dos seus alunos
        const professor = await prisma.professor.findFirst({
          where: { fisioterapeutaId: usuario.fisioterapeutaId },
          select: { id: true },
        })
        if (professor) {
          where.OR = [
            { fisioterapeutaId: usuario.fisioterapeutaId },
            { fisioterapeuta: { aluno: { professorId: professor.id } } },
          ]
        } else {
          // Sem registro de professor — vê apenas os próprios
          where.fisioterapeutaId = usuario.fisioterapeutaId
        }
      }
      // Coordenador: sem filtro → vê todos
    }
  }

  if (status) {
    andConditions.push({ status })
  }

  if (dataInicio || dataFim) {
    const dataCriacaoFilter: { gte?: Date; lte?: Date } = {}
    if (dataInicio) {
      dataCriacaoFilter.gte = new Date(dataInicio)
    }
    if (dataFim) {
      const fim = new Date(dataFim)
      fim.setHours(23, 59, 59, 999)
      dataCriacaoFilter.lte = fim
    }
    andConditions.push({ dataCriacao: dataCriacaoFilter })
  }

  const pacienteFilters: Prisma.PacienteWhereInput = {}
  if (codigoPaciente) {
    pacienteFilters.codigo = codigoPaciente
  }
  if (nomePaciente) {
    pacienteFilters.nomeCompleto = {
      contains: nomePaciente,
      mode: 'insensitive' as Prisma.QueryMode,
    }
  }
  if (Object.keys(pacienteFilters).length > 0) {
    andConditions.push({ paciente: pacienteFilters })
  }

  // Filtros de RESPONSÁVEL (fisioterapeuta autor)
  // Nota: matrícula está no modelo Aluno, não em Fisioterapeuta
  // codigoPessoa está no modelo Professor, não em Fisioterapeuta
  if (matriculaAluno) {
    andConditions.push({
      fisioterapeuta: {
        aluno: {
          matricula: matriculaAluno,
        },
      },
    })
  }

  // Nome ou código de pessoa do responsável
  if (nomeResponsavel || codigoPessoaResponsavel) {
    const responsavelConditions: Prisma.RelatorioWhereInput[] = []

    // Busca por nome no fisioterapeuta autor
    if (nomeResponsavel) {
      responsavelConditions.push({
        fisioterapeuta: {
          nomeCompleto: {
            contains: nomeResponsavel,
            mode: 'insensitive' as Prisma.QueryMode,
          },
        },
      })
    }

    // Busca por codigoPessoa no professor responsável
    if (codigoPessoaResponsavel) {
      responsavelConditions.push({
        professorResponsavel: {
          codigoPessoa: codigoPessoaResponsavel,
        },
      })
    }

    // Busca por nome no professor responsável
    if (nomeResponsavel) {
      responsavelConditions.push({
        professorResponsavel: {
          fisioterapeuta: {
            nomeCompleto: {
              contains: nomeResponsavel,
              mode: 'insensitive' as Prisma.QueryMode,
            },
          },
        },
      })
    }

    if (responsavelConditions.length > 0) {
      andConditions.push({ OR: responsavelConditions })
    }
  }

  // Combinar todas as condições
  if (andConditions.length > 0) {
    where.AND = andConditions
  }

  // Ordenação avançada
  let orderBy: Prisma.RelatorioOrderByWithRelationInput = {}

  switch (ordenarPor) {
    case 'dataCriacao':
      orderBy = { dataCriacao: ordem }
      break
    case 'dataFeedback':
      // Última data de feedback (mais recente do array)
      orderBy = { datasFeedback: ordem === 'desc' ? 'desc' : 'asc' }
      break
    case 'dataEdicao':
      // Última data de edição (mais recente do array)
      orderBy = { datasEdicao: ordem === 'desc' ? 'desc' : 'asc' }
      break
    case 'nomeAluno':
      orderBy = { fisioterapeuta: { nomeCompleto: ordem } }
      break
    case 'nomeProfessor':
      orderBy = { professorResponsavel: { fisioterapeuta: { nomeCompleto: ordem } } }
      break
    case 'nomePaciente':
      orderBy = { paciente: { nomeCompleto: ordem } }
      break
    default:
      orderBy = { dataCriacao: 'desc' }
  }

  // Paginação
  const skip = (page - 1) * limit

  // Buscar relatórios
  const [relatorios, total] = await Promise.all([
    prisma.relatorio.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        paciente: {
          select: {
            id: true,
            codigo: true,
            nomeCompleto: true,
          },
        },
        fisioterapeuta: {
          select: {
            id: true,
            nomeCompleto: true,
            role: true,
            aluno: {
              select: {
                matricula: true,
              },
            },
            professor: {
              select: {
                codigoPessoa: true,
              },
            },
          },
        },
        professorResponsavel: {
          select: {
            id: true,
            codigoPessoa: true,
            fisioterapeuta: {
              select: {
                id: true,
                nomeCompleto: true,
              },
            },
          },
        },
      },
    }),
    prisma.relatorio.count({ where }),
  ])

  return {
    data: relatorios,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

async function obterRelatorioPorId(id: number, usuario: TokenPayload) {
  return carregarRelatorioComPermissao(id, usuario)
}

export {
  cadastrarRelatorio,
  editarRelatorio,
  deletarRelatorio,
  listarRelatorios,
  obterRelatorioPorId,
  gerarRelatorioDocx,
}
