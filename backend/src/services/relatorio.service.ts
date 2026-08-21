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
import { parseDateBR, preencherTemplate } from '../utils/docx-builder.utils'

// ─── Tipos e Inclusões ────────────────────────────────────────────────────────

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
      aluno: { select: { matricula: true } },
      professor: { select: { codigoPessoa: true } },
    },
  },
  professorResponsavel: {
    select: {
      id: true,
      codigoPessoa: true,
      fisioterapeuta: { select: { id: true, nomeCompleto: true } },
    },
  },
  formularioCIF: {
    include: {
      itens: { orderBy: { id: 'asc' } },
    },
  },
} satisfies Prisma.RelatorioInclude

type RelatorioDetalhado = Prisma.RelatorioGetPayload<{
  include: typeof RELATORIO_INCLUDE
}>

const TEMPLATE_PATH = path.resolve(__dirname, '../../templates/avaliacao-funcional-pediatrica.docx')

// ─── Utilitários Internos de Negócio ──────────────────────────────────────────

function montarCodigoRelatorio(relatorioId: number, dataCriacao: Date | string): string {
  const data = dataCriacao instanceof Date ? dataCriacao : new Date(dataCriacao)
  const ano = Number.isNaN(data.getTime()) ? new Date().getFullYear() : data.getFullYear()
  return `REL-${ano}-${String(relatorioId).padStart(3, '0')}`
}

async function carregarRelatorioComPermissao(id: number, usuario: TokenPayload): Promise<RelatorioDetalhado> {
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

// ─── Serviços Orquestradores ──────────────────────────────────────────────────

export async function gerarRelatorioDocx(id: number, usuario: TokenPayload) {
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

export async function cadastrarRelatorio(dados: CadastroRelatorioInput, usuario: TokenPayload) {
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

  return prisma.$transaction(async (tx) => {
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
      select: { id: true },
    })

    return tx.relatorio.create({
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
  })
}

export async function editarRelatorio(id: number, dados: EditarRelatorioInput, usuario: TokenPayload) {
  const relatorio = await prisma.relatorio.findUnique({
    where: { id },
    include: {
      fisioterapeuta: true,
      professorResponsavel: true,
      formularioCIF: { include: { itens: true } },
    },
  })

  if (!relatorio) {
    throw new AppError(404, 'RELATORIO_NOT_FOUND', 'Relatório não encontrado')
  }

  // CASO 0: Edição completa do formulário CIF (Alunos editando)
  if (dados.formularioCIF) {
    const isAutor = relatorio.fisioterapeutaId === usuario.fisioterapeutaId
    const isAprovado = relatorio.status === 'APROVADO'

    if (!isAutor || isAprovado) {
      throw new AppError(403, 'FORBIDDEN', 'Apenas o autor do relatório pode editá-lo')
    }

    let novoStatus = relatorio.status
    if (relatorio.status === 'NEGADO') {
      novoStatus = 'CORRIGIDO'
    }

    return prisma.$transaction(async (tx) => {
      await tx.itemCIF.deleteMany({
        where: { formularioCIFId: relatorio.formularioCIF!.id },
      })

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

      return tx.relatorio.update({
        where: { id },
        data: {
          status: novoStatus,
          datasEdicao: { push: new Date() },
        },
        include: {
          paciente: true,
          fisioterapeuta: true,
          professorResponsavel: { include: { fisioterapeuta: true } },
          formularioCIF: { include: { itens: true } },
        },
      })
    })
  }

  // CASO 1: Alteração do Professor Supervisor
  if (dados.professorResponsavelId !== undefined && !dados.status && !dados.feedback) {
    if (relatorio.fisioterapeutaId !== usuario.fisioterapeutaId) {
      throw new AppError(403, 'FORBIDDEN', 'Você não tem permissão para editar este relatório')
    }

    if (relatorio.status === 'APROVADO') {
      throw new AppError(400, 'RELATORIO_JA_APROVADO', 'Não é possível editar um relatório que já foi aprovado')
    }

    let novoStatus = relatorio.status
    if (relatorio.status === 'NEGADO') {
      novoStatus = 'CORRIGIDO'
    }

    return prisma.relatorio.update({
      where: { id },
      data: {
        professorResponsavelId: dados.professorResponsavelId,
        status: novoStatus,
        datasEdicao: { push: new Date() },
      },
      include: {
        paciente: true,
        fisioterapeuta: true,
        professorResponsavel: true,
        formularioCIF: { include: { itens: true } },
      },
    })
  }

  // CASO 2: Avaliação e Aprovação/Reprovação pelo Professor
  if (dados.status || dados.feedback) {
    if (relatorio.status === 'APROVADO') {
      throw new AppError(400, 'RELATORIO_JA_APROVADO', 'Este relatório já foi avaliado')
    }

    const professor = await prisma.professor.findFirst({
      where: { fisioterapeutaId: usuario.fisioterapeutaId },
    })

    if (!professor) {
      throw new AppError(403, 'FORBIDDEN', 'Professor não encontrado')
    }

    const isCoordenador = professor.coordenador === true
    const isProfessorResponsavel = relatorio.professorResponsavelId === professor.id

    if (!isCoordenador && !isProfessorResponsavel) {
      throw new AppError(403, 'FORBIDDEN', 'Você não tem permissão para avaliar este relatório')
    }

    const dataAtual = new Date()
    const updateData: Prisma.RelatorioUpdateInput = {}

    if (dados.status) {
      if (dados.status !== 'APROVADO' && dados.status !== 'NEGADO') {
        throw new AppError(400, 'INVALID_STATUS', 'Status de avaliação deve ser APROVADO ou NEGADO')
      }

      if (dados.status === 'NEGADO' && (!dados.feedback || dados.feedback.trim().length === 0)) {
        throw new AppError(400, 'FEEDBACK_OBRIGATORIO', 'Feedback é obrigatório ao negar um relatório')
      }

      updateData.status = dados.status
      updateData.dataAprovacao = dados.status === 'APROVADO' ? dataAtual : null
    }

    if (dados.feedback) {
      updateData.feedbacks = { push: dados.feedback }
      updateData.datasFeedback = { push: dataAtual }
    }

    return prisma.relatorio.update({
      where: { id },
      data: updateData,
      include: {
        paciente: true,
        fisioterapeuta: true,
        professorResponsavel: true,
        formularioCIF: { include: { itens: true } },
      },
    })
  }

  throw new AppError(400, 'NO_DATA_TO_UPDATE', 'Nenhum dado foi fornecido para atualização')
}

export async function deletarRelatorio(id: number, usuario: TokenPayload) {
  const relatorio = await prisma.relatorio.findUnique({ where: { id } })
  if (!relatorio) throw new AppError(404, 'RELATORIO_NOT_FOUND', 'Relatório não encontrado')

  if (relatorio.fisioterapeutaId !== usuario.fisioterapeutaId) {
    throw new AppError(403, 'FORBIDDEN', 'Você não tem permissão para deletar este relatório')
  }

  await prisma.relatorio.delete({ where: { id } })
}

export async function listarRelatorios(filtros: ListarRelatoriosInput, usuario: TokenPayload) {
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
    where.fisioterapeutaId = usuario.fisioterapeutaId
  } else if (tipo === 'all') {
    if (usuario.role === 'PROFESSOR') {
      const professor = await prisma.professor.findFirst({ where: { fisioterapeutaId: usuario.fisioterapeutaId } })
      if (professor) where.professorResponsavelId = professor.id
    }
  } else if (tipo === 'supervised') {
    if (usuario.role === 'PROFESSOR') {
      const professor = await prisma.professor.findFirst({ where: { fisioterapeutaId: usuario.fisioterapeutaId } })
      if (professor) {
        where.professorResponsavelId = professor.id
        where.NOT = { fisioterapeutaId: usuario.fisioterapeutaId }
      }
    }
  } else if (tipo === 'todos') {
    if (usuario.role === 'ALUNO') {
      where.fisioterapeutaId = usuario.fisioterapeutaId
    } else if (usuario.role === 'PROFESSOR') {
      if (!usuario.coordenador) {
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
          where.fisioterapeutaId = usuario.fisioterapeutaId
        }
      }
    }
  }

  if (status) andConditions.push({ status })

  if (dataInicio || dataFim) {
    const dataCriacaoFilter: { gte?: Date; lte?: Date } = {}
    if (dataInicio) dataCriacaoFilter.gte = new Date(dataInicio)
    if (dataFim) {
      const fim = new Date(dataFim)
      fim.setHours(23, 59, 59, 999)
      dataCriacaoFilter.lte = fim
    }
    andConditions.push({ dataCriacao: dataCriacaoFilter })
  }

  const pacienteFilters: Prisma.PacienteWhereInput = {}
  if (codigoPaciente) pacienteFilters.codigo = codigoPaciente
  if (nomePaciente) {
    pacienteFilters.nomeCompleto = { contains: nomePaciente, mode: 'insensitive' as Prisma.QueryMode }
  }
  if (Object.keys(pacienteFilters).length > 0) {
    andConditions.push({ paciente: pacienteFilters })
  }

  if (matriculaAluno) {
    andConditions.push({ fisioterapeuta: { aluno: { matricula: matriculaAluno } } })
  }

  if (nomeResponsavel || codigoPessoaResponsavel) {
    const responsavelConditions: Prisma.RelatorioWhereInput[] = []

    if (nomeResponsavel) {
      responsavelConditions.push({
        fisioterapeuta: { nomeCompleto: { contains: nomeResponsavel, mode: 'insensitive' as Prisma.QueryMode } },
      })
    }

    if (codigoPessoaResponsavel) {
      responsavelConditions.push({ professorResponsavel: { codigoPessoa: codigoPessoaResponsavel } })
    }

    if (nomeResponsavel) {
      responsavelConditions.push({
        professorResponsavel: { fisioterapeuta: { nomeCompleto: { contains: nomeResponsavel, mode: 'insensitive' as Prisma.QueryMode } } },
      })
    }

    if (responsavelConditions.length > 0) andConditions.push({ OR: responsavelConditions })
  }

  if (andConditions.length > 0) where.AND = andConditions

  let orderBy: Prisma.RelatorioOrderByWithRelationInput = {}

  switch (ordenarPor) {
    case 'dataCriacao': orderBy = { dataCriacao: ordem }; break
    case 'dataFeedback': orderBy = { datasFeedback: ordem === 'desc' ? 'desc' : 'asc' }; break
    case 'dataEdicao': orderBy = { datasEdicao: ordem === 'desc' ? 'desc' : 'asc' }; break
    case 'nomeAluno': orderBy = { fisioterapeuta: { nomeCompleto: ordem } }; break
    case 'nomeProfessor': orderBy = { professorResponsavel: { fisioterapeuta: { nomeCompleto: ordem } } }; break
    case 'nomePaciente': orderBy = { paciente: { nomeCompleto: ordem } }; break
    default: orderBy = { dataCriacao: 'desc' }
  }

  const skip = (page - 1) * limit

  const [relatorios, total] = await Promise.all([
    prisma.relatorio.findMany({
      where, orderBy, skip, take: limit,
      include: {
        paciente: { select: { id: true, codigo: true, nomeCompleto: true } },
        fisioterapeuta: {
          select: {
            id: true, nomeCompleto: true, role: true,
            aluno: { select: { matricula: true } },
            professor: { select: { codigoPessoa: true } },
          },
        },
        professorResponsavel: {
          select: {
            id: true, codigoPessoa: true,
            fisioterapeuta: { select: { id: true, nomeCompleto: true } },
          },
        },
      },
    }),
    prisma.relatorio.count({ where }),
  ])

  return {
    data: relatorios,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

export async function obterRelatorioPorId(id: number, usuario: TokenPayload) {
  return carregarRelatorioComPermissao(id, usuario)
}