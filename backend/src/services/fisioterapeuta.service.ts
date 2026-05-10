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
        role: 'PROFESSOR',
        professor: {
          create: {
            codigoPessoa: dados.codigoPessoa,
          },
        },
      },
      select: {
        uid: true,
        nomeCompleto: true,
        email: true,
        role: true,
        professor: {
          select: {
            codigoPessoa: true,
          },
        },
        createdAt: true,
      },
    })
  }

  return prisma.fisioterapeuta.create({
    data: {
      nomeCompleto: dados.nomeCompleto,
      email: dados.email,
      senha: senhaHash,
      role: 'ALUNO',
      aluno: {
        create: {
          matricula: dados.matricula,
          professorId: null,
        },
      },
    },
    select: {
      uid: true,
      nomeCompleto: true,
      email: true,
      role: true,
      aluno: {
        select: {
          matricula: true,
        },
      },
      createdAt: true,
    },
  })
}
async function exibirTodosFisioterapeutas() {
  try {
    const fisioterapeutas = await prisma.fisioterapeuta.findMany({
    select: {
      uid: true,
      nomeCompleto: true,
      role: true,
    },
  })

  if (fisioterapeutas.length === 0) {
    
    throw new AppError(404, 'FISIOTERAPEUTAS_NOT_FOUND', 'Nenhum fisioterapeuta encontrado')
  }

  return fisioterapeutas;
  } catch (err) {
    throw new AppError(500, 'INTERNAL_SERVER_ERROR', 'Erro interno do servidor')
  }
}

async associarPacienteFisioterapeuta(idFisioterapeuta: string, idPaciente: number) {
  return prisma.fisioterapeuta.update({
    where: { uid: idFisioterapeuta },
    data: { pacienteId: idPaciente },
  })
}

export { 
  cadastrarFisioterapeuta, 
  exibirTodosFisioterapeutas,
  associarPacienteFisioterapeuta
}
