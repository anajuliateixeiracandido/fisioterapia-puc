import { z } from 'zod'
import { senhaForteSchema } from './auth.validator'

const emailSchema = z
  .string()
  .email('E-mail invalido')
  .endsWith('@sga.pucminas.br', 'Apenas e-mails @sga.pucminas.br sao permitidos')

const nomeSchema = z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(200)

const professorCadastroSchema = z
  .object({
    role: z.literal('PROFESSOR'),
    nomeCompleto: nomeSchema,
    email: emailSchema,
    senha: senhaForteSchema,
    codigoPessoa: z
      .string()
      .regex(/^\d{5,10}$/, 'Codigo pessoa deve ter entre 5 e 10 digitos numericos'),
  })
  .strict()

const alunoCadastroSchema = z.object({
  role: z.literal('ALUNO'),
  nomeCompleto: nomeSchema,
  email: emailSchema,
  senha: senhaForteSchema,
  matricula: z.string().regex(/^\d{5,10}$/, 'Matricula deve ter entre 5 e 10 digitos numericos'),
  codigoPessoaProfessor: z
    .string()
    .regex(/^\d{5,10}$/, 'Codigo pessoa do professor deve ter entre 5 e 10 digitos numericos'),
})

const atualizarPerfilSchema = z.object({
  nomeCompleto: nomeSchema,
})

type ProfessorCadastroInput = z.infer<typeof professorCadastroSchema>
type AlunoCadastroInput = z.infer<typeof alunoCadastroSchema>
type CadastroInput = ProfessorCadastroInput | AlunoCadastroInput
type AtualizarPerfilInput = z.infer<typeof atualizarPerfilSchema>

export {
  professorCadastroSchema,
  alunoCadastroSchema,
  atualizarPerfilSchema,
  ProfessorCadastroInput,
  AlunoCadastroInput,
  CadastroInput,
  AtualizarPerfilInput,
}