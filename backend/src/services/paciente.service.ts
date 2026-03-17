import prisma from '../lib/prisma'
import { AppError } from '../errors/AppError'
import { CadastroPacienteInput } from '../validators/paciente.validator'

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
    dataNascimento: new Date(dados.dataNascimento),
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
    createdAt: true,
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

export { cadastrarPaciente }