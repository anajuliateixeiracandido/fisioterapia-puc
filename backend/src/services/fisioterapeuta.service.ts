import prisma from '../lib/prisma'
import { hashPassword } from '../utils/hash.utils'
import { AppError } from '../errors/AppError'
import { CadastroInput } from '../validators/fisioterapeuta.validator'

async function cadastrarFisioterapeuta(dados: CadastroInput) {
const senhaHash = await hashPassword(dados.senha)

if (dados.role === 'PROFESSOR') {
  return prisma.fisioterapeuta.create({
    data: {
      nomeCompleto: dados.nomeCompleto,
      email: dados.email,
      senha: senhaHash,
      codigoPessoa: dados.codigoPessoa,
      role: 'PROFESSOR',
      professor: {
        create: {},
      },
    },
    select: {
      uid: true,
      nomeCompleto: true,
      email: true,
      role: true,
      codigoPessoa: true,
      createdAt: true,
    },
  })
}

let professorId: number | undefined = undefined

if (dados.professorUid) {
  const professor = await prisma.professor.findFirst({
    where: {
      fisioterapeuta: {
        uid: dados.professorUid,
        ativo: true,
      },
    },
  })

  if (!professor) {
    throw new AppError(404, 'PROFESSOR_NOT_FOUND', 'Professor não encontrado')
  }

  professorId = professor.id
}

return prisma.fisioterapeuta.create({
  data: {
    nomeCompleto: dados.nomeCompleto,
    email: dados.email,
    senha: senhaHash,
    matricula: dados.matricula,
    role: 'ALUNO',
    aluno: {
      create: {
        professorId: professorId ?? null,
      },
    },
  },
  select: {
    uid: true,
    nomeCompleto: true,
    email: true,
    role: true,
    matricula: true,
    createdAt: true,
  },
})
}

export { cadastrarFisioterapeuta }