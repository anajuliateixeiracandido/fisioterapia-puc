import { z } from 'zod'

const contatoEmergenciaSchema = z.object({
  nome: z.string().min(3, 'Nome do contato deve ter pelo menos 3 caracteres'),
  telefone: z.string().min(8, 'Telefone inválido'),
  parentesco: z.string().min(2, 'Parentesco inválido'),
})

const cadastroPacienteSchema = z.object({
  nomeCompleto: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(200),
  dataNascimento: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Data de nascimento invalida. Use o formato DD/MM/AAAA'),
  sexo: z.enum(['M', 'F']),
  cpf: z.string().min(11, 'CPF inválido').max(14, 'CPF inválido'),
  telefone: z.string().min(8, 'Telefone inválido').optional(),
  endereco: z.string().min(5, 'Endereço inválido').optional(),
  email: z.string().email('E-mail inválido').optional(),
  alergias: z.string().min(1, 'Alergias obrigatórias').optional(),
  contatosEmergencia: z
    .array(contatoEmergenciaSchema)
    .min(1, 'Pelo menos um contato de emergência é obrigatório'),
  matriculaAluno: z
    .string()
    .regex(/^\d{5,10}$/, 'Matrícula deve ter entre 5 e 10 dígitos numéricos')
    .optional(),
})

type CadastroPacienteInput = z.infer<typeof cadastroPacienteSchema>

export { cadastroPacienteSchema, CadastroPacienteInput }
