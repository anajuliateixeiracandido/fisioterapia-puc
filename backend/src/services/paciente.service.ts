import prisma from '../lib/prisma'
import { Prisma, Role } from '@prisma/client'
import { AppError } from '../errors/AppError'
import { CadastroPacienteInput, ListarPacientesInput } from '../validators/paciente.validator'
import { TokenPayload } from '../utils/jwt.utils'

function parseDateBR(data: string): Date {
  const [dia, mes, ano] = data.split('/')
  return new Date(`${ano}-${mes}-${dia}`)
}

function buildDataNascimentoWhere(busca: string): Prisma.PacienteWhereInput | null {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(busca)) {
    return null
  }

  const data = parseDateBR(busca)
  const dataFim = new Date(data)
  dataFim.setDate(dataFim.getDate() + 1)

  return {
    dataNascimento: {
      gte: data,
      lt: dataFim,
    },
  }
}

function buildBuscaWhere(busca?: string): Prisma.PacienteWhereInput {
  const termoBusca = busca?.trim()

  if (!termoBusca) {
    return {}
  }

  const filtros: Prisma.PacienteWhereInput[] = [
    { codigo: { contains: termoBusca, mode: 'insensitive' } },
    { nomeCompleto: { contains: termoBusca, mode: 'insensitive' } },
    { cpf: { contains: termoBusca, mode: 'insensitive' } },
    { email: { contains: termoBusca, mode: 'insensitive' } },
    {
      professor: {
        fisioterapeuta: {
          nomeCompleto: { contains: termoBusca, mode: 'insensitive' },
        },
      },
    },
  ]

  const filtroDataNascimento = buildDataNascimentoWhere(termoBusca)

  if (filtroDataNascimento) {
    filtros.push(filtroDataNascimento)
  }

  return {
    OR: filtros,
  }
}

function buildPaginacao(filtros: ListarPacientesInput) {
  const pagina = filtros.pagina ?? filtros.page ?? 1
  const limite = filtros.limite ?? filtros.limit ?? 10

  return {
    pagina,
    limite,
    skip: (pagina - 1) * limite,
    take: limite,
  }
}

const pacienteSelect = {
  id: true,
  codigo: true,
  nomeCompleto: true,
  dataNascimento: true,
  sexo: true,
  cpf: true,
  telefone: true,
  endereco: true,
  email: true,
  alergias: true,
  condicaoSaude: true,
  professor: {
    select: {
      codigoPessoa: true,
      fisioterapeuta: {
        select: {
          nomeCompleto: true,
        },
      },
    },
  },
  alunos: {
    select: {
      matricula: true,
      fisioterapeuta: {
        select: {
          nomeCompleto: true,
        },
      },
    },
  },
  contatosEmergencia: {
    select: {
      nome: true,
      telefone: true,
      parentesco: true,
    },
  },
} satisfies Prisma.PacienteSelect

async function cadastrarPaciente(dados: CadastroPacienteInput, usuario: TokenPayload) {
  let professorId: number
  let alunoId: number | undefined = undefined

  if (usuario.role === 'ALUNO') {
    const aluno = await prisma.aluno.findFirst({
      where: { fisioterapeutaId: usuario.fisioterapeutaId },
      select: {
        id: true,
        professorId: true,
      },
    })

    if (!aluno?.professorId) {
      throw new AppError(403, 'ALUNO_SEM_PROFESSOR', 'Aluno nao possui professor responsavel')
    }

    alunoId = aluno.id
    professorId = aluno.professorId
  } else {
    const professor = await prisma.professor.findUnique({
      where: { fisioterapeutaId: usuario.fisioterapeutaId },
    })

    if (!professor) {
      throw new AppError(403, 'FORBIDDEN', 'Apenas professores e alunos podem cadastrar pacientes')
    }

    professorId = professor.id
  }

  if (usuario.role === 'PROFESSOR' && dados.matriculaAluno) {
    const aluno = await prisma.aluno.findFirst({
      where: {
        matricula: dados.matriculaAluno,
      },
    })

    if (!aluno) {
      throw new AppError(404, 'ALUNO_NOT_FOUND', 'Aluno não encontrado')
    }

    alunoId = aluno.id
  }

  return prisma.paciente.create({
    data: {
      nomeCompleto: dados.nomeCompleto,
      dataNascimento: parseDateBR(dados.dataNascimento),
      sexo: dados.sexo,
      cpf: dados.cpf,
      telefone: dados.telefone,
      endereco: dados.endereco,
      email: dados.email,
      alergias: dados.alergias,
      condicaoSaude: dados.condicaoSaude,
      professorId,
      ...(alunoId && {
        alunos: {
          connect: { id: alunoId },
        },
      }),
      ...(dados.contatosEmergencia.length > 0 && {
        contatosEmergencia: {
          createMany: {
            data: dados.contatosEmergencia,
          },
        },
      }),
    },
    select: pacienteSelect,
  })
}

async function associarPacienteAluno(pacienteId: number, alunoId: number) {
  return prisma.paciente.update({
    where: { id: pacienteId },
    data: { alunos: { connect: { id: alunoId } } },
    select: {
      codigo: true,
    },
  })
}

async function associarPacienteProfessor(pacienteId: number, professorId: number) {
  return prisma.paciente.update({
    where: { id: pacienteId },
    data: { professorId },
    select: {
      codigo: true,
    },
  })
}

async function listarPacientes(filtros: ListarPacientesInput = {}) {
  const where = buildBuscaWhere(filtros.busca)
  const paginacao = buildPaginacao(filtros)

  const [pacientes, total] = await Promise.all([
    prisma.paciente.findMany({
      where,
      skip: paginacao.skip,
      take: paginacao.take,
      select: pacienteSelect,
      orderBy: {
        nomeCompleto: 'asc',
      },
    }),
    prisma.paciente.count({ where }),
  ])

  return {
    data: pacientes,
    pagination: {
      page: paginacao.pagina,
      limit: paginacao.limite,
      total,
      totalPages: Math.max(Math.ceil(total / paginacao.limite), 1),
    },
  }
}

async function listarPacientesFisioterapeuta(
  fisioterapeutaId: number,
  role: Role,
  filtros: ListarPacientesInput = {}
) {
  const whereBase: Prisma.PacienteWhereInput =
    role === 'ALUNO'
      ? {
          alunos: {
            some: {
              fisioterapeutaId,
            },
          },
        }
      : {
          professor: {
            fisioterapeutaId,
          },
        }

  const where = {
    AND: [whereBase, buildBuscaWhere(filtros.busca)],
  }

  const paginacao = buildPaginacao(filtros)

  const [pacientes, total] = await Promise.all([
    prisma.paciente.findMany({
      where,
      skip: paginacao.skip,
      take: paginacao.take,
      select: pacienteSelect,
      orderBy: {
        nomeCompleto: 'asc',
      },
    }),
    prisma.paciente.count({ where }),
  ])

  return {
    data: pacientes,
    pagination: {
      page: paginacao.pagina,
      limit: paginacao.limite,
      total,
      totalPages: Math.max(Math.ceil(total / paginacao.limite), 1),
    },
  }
}

async function buscarPacientePorId(
  pacienteId: number,
  fisioterapeutaId: number,
  role: Role,
  _coordenador = false
) {
  const where =
    role === 'ALUNO'
      ? {
          id: pacienteId,
          alunos: {
            some: {
              fisioterapeutaId,
            },
          },
        }
      : {
          id: pacienteId,
        }

  const paciente = await prisma.paciente.findFirst({
    where,
    select: pacienteSelect,
  })

  if (!paciente) {
    throw new AppError(404, 'PACIENTE_NOT_FOUND', 'Paciente nao encontrado')
  }

  return {
    ...paciente,
    relatorios: [],
  }
}

export {
  cadastrarPaciente,
  buscarPacientePorId,
  listarPacientes,
  listarPacientesFisioterapeuta,
  associarPacienteAluno,
  associarPacienteProfessor,
}
