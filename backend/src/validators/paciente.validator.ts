import { z } from 'zod'
import { dataNascimentoValida } from '../utils/date.utils'

const contatoEmergenciaSchema = z.object({
  nome: z.string().min(3, 'Nome do contato deve ter pelo menos 3 caracteres'),
  telefone: z.string().min(8, 'Telefone inválido'),
  parentesco: z.string().min(2, 'Parentesco inválido'),
})

const cadastroPacienteSchema = z.object({
  // ─── Dados pessoais ────────────────────────────────────────────────────────
  nomeCompleto: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(200),
  dataNascimento: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Data de nascimento inválida. Use o formato DD/MM/AAAA')
    .refine(dataNascimentoValida, 'Data de nascimento inválida'),
  sexo: z.enum(['M', 'F']).optional().default('M'),
  cpf: z.string().min(11, 'CPF inválido').max(14, 'CPF inválido').optional(),
  telefone: z.string().min(8, 'Telefone inválido').optional(),
  endereco: z.string().min(5, 'Endereço inválido').optional(),
  email: z.string().email('E-mail inválido').optional(),
  alergias: z.string().optional(),

  // ─── Dado clínico fixo (único que fica no cadastro do paciente) ────────────
  condicaoSaude: z.string().trim().max(400).optional().nullable(),

  // ─── Outros ────────────────────────────────────────────────────────────────
  contatosEmergencia: z.array(contatoEmergenciaSchema).optional().default([]),
  matriculaAluno: z
    .string()
    .regex(/^\d{5,10}$/, 'Matrícula deve ter entre 5 e 10 dígitos numéricos')
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