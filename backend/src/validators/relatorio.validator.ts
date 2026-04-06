import { z } from "zod";
import { cadastroFormularioCIFSchema } from "./formulario-cif.validator";

const cadastroRelatorioSchema = z.object({
    pacienteId: z.number().int().positive({ message: 'ID do paciente deve ser um número inteiro positivo' }),
    professorResponsavelId: z.number().int().positive({ message: 'ID do professor responsável deve ser um número inteiro positivo' }).optional(),
    formularioCIF: cadastroFormularioCIFSchema,
})

const editarRelatorioSchema = z.object({
    professorResponsavelId: z.number().int().positive().optional(),
    status: z.enum(['ENVIADO', 'APROVADO', 'NEGADO', 'CORRIGIDO']).optional(),
    feedback: z.string().min(1).max(1000, 'Feedback deve ter no máximo 1000 caracteres').optional(),
    formularioCIF: cadastroFormularioCIFSchema.optional(),
}).refine(
    (data) => {
        if (data.status === 'NEGADO') {
            return data.feedback !== undefined && data.feedback.trim().length > 0;
        }
        return true;
    },
    {
        message: 'Feedback é obrigatório ao negar um relatório',
        path: ['feedback'],
    }
)

const listarRelatoriosSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    
    // Filtros de paciente
    codigoPaciente: z.string().optional(),
    nomePaciente: z.string().optional(),
    
    // Filtros de responsável (professor/fisioterapeuta autor)
    nomeResponsavel: z.string().optional(),
    matriculaAluno: z.string().optional(),
    codigoPessoaResponsavel: z.string().optional(),
    
    // Filtros gerais
    status: z.enum(['ENVIADO', 'APROVADO', 'NEGADO', 'CORRIGIDO']).optional(),
    dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional(),
    dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional(),
    
    // Ordenação avançada
    ordenarPor: z.enum([
        'dataCriacao',
        'dataFeedback',
        'dataEdicao',
        'nomeAluno',
        'nomeProfessor',
        'nomePaciente'
    ]).default('dataCriacao'),
    ordem: z.enum(['asc', 'desc']).default('desc'), // asc = mais antigo/A-Z, desc = mais recente/Z-A
    
    tipo: z.enum(['authored', 'all', 'todos', 'supervised']).default('authored'),
})

type CadastroRelatorioInput = z.infer<typeof cadastroRelatorioSchema>
type EditarRelatorioInput = z.infer<typeof editarRelatorioSchema>
type ListarRelatoriosInput = z.infer<typeof listarRelatoriosSchema>

export { 
    cadastroRelatorioSchema, 
    editarRelatorioSchema,
    listarRelatoriosSchema,
    CadastroRelatorioInput,
    EditarRelatorioInput,
    ListarRelatoriosInput,
}