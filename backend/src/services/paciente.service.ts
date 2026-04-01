import prisma from '../lib/prisma'
import { AppError } from '../errors/AppError'
import { CadastroPacienteInput } from '../validators/paciente.validator'

function parseDateBR(data: string): Date {
  const [dia, mes, ano] = data.split('/')
  return new Date(`${ano}-${mes}-${dia}`)
}

async function cadastrarPaciente(dados: CadastroPacienteInput, fisioterapeutaId: number) {
  const professor = await prisma.professor.findUnique({
    where: { fisioterapeutaId },
  })

  if (!professor) {
    throw new AppError(403, 'FORBIDDEN', 'Apenas professores podem cadastrar pacientes')
  }

  let alunoId: number | undefined = undefined

  if (dados.matriculaAluno) {
    const aluno = await prisma.aluno.findFirst({
      where: { matricula: dados.matriculaAluno },
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
      professorId: professor.id,
      ...(alunoId && {
        alunos: { connect: { id: alunoId } },
      }),
      contatosEmergencia: {
        createMany: { data: dados.contatosEmergencia },
      },
    },
    select: {
      codigo: true,
      nomeCompleto: true,
      dataNascimento: true,
      sexo: true,
      cpf: true,
      telefone: true,
      endereco: true,
      email: true,
      alergias: true,
      professor: {
        select: {
          codigoPessoa: true,
          fisioterapeuta: { select: { nomeCompleto: true } },
        },
      },
      alunos: {
        select: {
          matricula: true,
          fisioterapeuta: { select: { nomeCompleto: true } },
        },
      },
      contatosEmergencia: {
        select: { nome: true, telefone: true, parentesco: true },
      },
    },
  })
}

async function listarPacientes(usuario: any) {
  const where =
    usuario.role === 'PROFESSOR'
      ? { professor: { fisioterapeutaId: usuario.fisioterapeutaId } }
      : { alunos: { some: { fisioterapeuta: { id: usuario.fisioterapeutaId } } } }

  return prisma.paciente.findMany({
    where,
    select: {
      id: true,
      codigo: true,
      nomeCompleto: true,
      dataNascimento: true,
      sexo: true,
      cpf: true,
      telefone: true,
    },
    orderBy: { nomeCompleto: 'asc' },
  })
}

async function obterPacientePorId(id: number, usuario: any) {
  const paciente = await prisma.paciente.findUnique({
    where: { id },
    include: {
      professor: {
        select: {
          codigoPessoa: true,
          fisioterapeuta: { select: { nomeCompleto: true } },
        },
      },
      alunos: {
        select: {
          matricula: true,
          fisioterapeuta: { select: { nomeCompleto: true } },
        },
      },
      contatosEmergencia: true,
    },
  })

  if (!paciente) {
    throw new AppError(404, 'PACIENTE_NOT_FOUND', 'Paciente não encontrado')
  }

  return paciente
}

export { cadastrarPaciente, listarPacientes, obterPacientePorId }