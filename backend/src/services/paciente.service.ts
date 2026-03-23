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
      where: {
        fisioterapeuta: {
          matricula: dados.matriculaAluno,
          ativo: true,
        },
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
      professorId: professor.id,
      ...(alunoId && {
        alunos: {
          connect: { id: alunoId },
        },
      }),
      contatosEmergencia: {
        createMany: {
          data: dados.contatosEmergencia,
        },
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
          fisioterapeuta: {
            select: {
              nomeCompleto: true,
              codigoPessoa: true,
            },
          },
        },
      },
      alunos: {
        select: {
          fisioterapeuta: {
            select: {
              nomeCompleto: true,
              matricula: true,
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
    },
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

async function listarPacientes() {
  return prisma.paciente.findMany({
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
          fisioterapeuta: {
            select: {
              nomeCompleto: true,
              codigoPessoa: true,
            },
          },
        },
      },
      alunos: {
        select: {
          fisioterapeuta: {
            select: {
              nomeCompleto: true,
              matricula: true,
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
    },
  })
}

async function listarPacientesFisioterapeuta(fisioterapeutaId: number, role: any) {
  const where =
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

  return prisma.paciente.findMany({
    where,
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
          fisioterapeuta: {
            select: {
              nomeCompleto: true,
              codigoPessoa: true,
            },
          },
        },
      },
      alunos: {
        select: {
          fisioterapeuta: {
            select: {
              nomeCompleto: true,
              matricula: true,
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
    },
  })
}

async function buscarPacientePorId(pacienteId: number, fisioterapeutaId: number, role: any) {
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
      : role === 'PROFESSOR'
        ? {
            id: pacienteId,
            professor: {
              fisioterapeutaId,
            },
          }
        : {
            id: pacienteId,
          }

  const paciente = await prisma.paciente.findFirst({
    where,
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
          fisioterapeuta: {
            select: {
              nomeCompleto: true,
              codigoPessoa: true,
            },
          },
        },
      },
      alunos: {
        select: {
          fisioterapeuta: {
            select: {
              nomeCompleto: true,
              matricula: true,
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
    },
  })

  if (!paciente) {
    throw new AppError(404, 'PACIENTE_NOT_FOUND', 'Paciente nao encontrado')
  }

  return paciente
}

export {
  cadastrarPaciente,
  buscarPacientePorId,
  listarPacientes,
  listarPacientesFisioterapeuta,
  associarPacienteAluno,
  associarPacienteProfessor,
}
