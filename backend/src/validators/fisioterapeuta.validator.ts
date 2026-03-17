import { z } from 'zod'

const emailSchema = z
  .string()
  .email('E-mail inválido')
  .endsWith('@sga.pucminas.br', 'Apenas e-mails @sga.pucminas.br são permitidos')

const senhaSchema = z.string().min(8, 'Senha deve ter pelo menos 8 caracteres')

const nomeSchema = z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(200)

const professorCadastroSchema = z.object({
  role: z.literal('PROFESSOR'),
  nomeCompleto: nomeSchema,
  email: emailSchema,
  senha: senhaSchema,
  codigoPessoa: z.string().regex(/^\d{7}$/, 'Código pessoa deve ter 7 dígitos numéricos'),
})

const alunoCadastroSchema = z.object({
  role: z.literal('ALUNO'),
  nomeCompleto: nomeSchema,
  email: emailSchema,
  senha: senhaSchema,
  matricula: z.string().regex(/^\d{6}$/, 'Matrícula deve ter 6 dígitos numéricos'),
  professorUid: z.string().uuid('Professor inválido').optional(),
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
