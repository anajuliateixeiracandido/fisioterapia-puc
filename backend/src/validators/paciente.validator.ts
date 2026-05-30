import { z } from 'zod'

const contatoEmergenciaSchema = z.object({
  nome: z.string().min(3, 'Nome do contato deve ter pelo menos 3 caracteres'),
  telefone: z.string().min(8, 'Telefone invalido'),
  parentesco: z.string().min(2, 'Parentesco invalido'),
})

function dataNascimentoValida(data: string) {
  const [dia, mes, ano] = data.split('/').map(Number)
  const nascimento = new Date(ano, mes - 1, dia)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  return (
    ano >= 1900 &&
    nascimento.getFullYear() === ano &&
    nascimento.getMonth() === mes - 1 &&
    nascimento.getDate() === dia &&
    nascimento <= hoje
  )
}

const cadastroPacienteSchema = z.object({
  nomeCompleto: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(200),
  dataNascimento: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Data de nascimento invalida. Use o formato DD/MM/AAAA')
    .refine(dataNascimentoValida, 'Data de nascimento invalida'),
  sexo: z.enum(['M', 'F']).optional().default('M'),
  cpf: z.string().min(11, 'CPF invalido').max(14, 'CPF invalido').optional(),
  telefone: z.string().min(8, 'Telefone invalido').optional(),
  endereco: z.string().min(5, 'Endereco invalido').optional(),
  email: z.string().email('E-mail invalido').optional(),
  alergias: z.string().min(1, 'Alergias obrigatorias').optional(),
  condicaoSaude: z.string().trim().optional(),
  contatosEmergencia: z.array(contatoEmergenciaSchema).optional().default([]),
  matriculaAluno: z
    .string()
    .regex(/^\d{5,10}$/, 'Matricula deve ter entre 5 e 10 digitos numericos')
    .optional(),
})

const listarPacientesSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  pagina: z.coerce.number().int().min(1).optional(),
  limite: z.coerce.number().int().min(1).max(100).optional(),
  busca: z.string().trim().optional(),
  status: z.string().trim().optional(),
})

type CadastroPacienteInput = z.infer<typeof cadastroPacienteSchema>
type ListarPacientesInput = z.infer<typeof listarPacientesSchema>

export { cadastroPacienteSchema, listarPacientesSchema, CadastroPacienteInput, ListarPacientesInput }
