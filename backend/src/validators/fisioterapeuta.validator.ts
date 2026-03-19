import { z } from 'zod'
import { senhaForteSchema } from './auth.validator'

const emailSchema = z
  .string()
  .email('E-mail inválido')
  .endsWith('@sga.pucminas.br', 'Apenas e-mails @sga.pucminas.br são permitidos')

const nomeSchema = z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(200)

const professorCadastroSchema = z.object({
  role: z.literal('PROFESSOR'),
  nomeCompleto: nomeSchema,
  email: emailSchema,
  senha: senhaForteSchema,
  codigoPessoa: z
    .string()
    .regex(/^\d{5,10}$/, 'Código pessoa deve ter entre 5 e 10 dígitos numéricos'),
})

const alunoCadastroSchema = z.object({
  role: z.literal('ALUNO'),
  nomeCompleto: nomeSchema,
  email: emailSchema,
  senha: senhaForteSchema,
  matricula: z.string().regex(/^\d{5,10}$/, 'Matrícula deve ter entre 5 e 10 dígitos numéricos'),
  codigoPessoaProfessor: z
    .string()
    .regex(/^\d{5,10}$/, 'Código pessoa do professor deve ter entre 5 e 10 dígitos numéricos')
    .optional(),
})

type ProfessorCadastroInput = z.infer<typeof professorCadastroSchema>
type AlunoCadastroInput = z.infer<typeof alunoCadastroSchema>
type CadastroInput = ProfessorCadastroInput | AlunoCadastroInput

export {
  professorCadastroSchema,
  alunoCadastroSchema,
  ProfessorCadastroInput,
  AlunoCadastroInput,
  CadastroInput,
}
