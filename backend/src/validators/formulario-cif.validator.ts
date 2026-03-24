import { z } from 'zod'

const categoriaCIFSchema = z.enum(
    ["ESTRUTURA", "FUNCAO", "ACTIVIDADE_PARTICIPACAO", "FACTOR_AMBIENTAL"],
    {
        error: 'Categoria deve ser uma das seguintes: ESTRUTURA, FUNCAO, ATIVIDADE_PARTICIPACAO, FACTOR_AMBIENTAL'
    }
)

const tipoCIFSchema = z.enum(["CIF", "CIF_CJ"], {
    error: 'Tipo CIF deve ser "CIF" ou "CIF_CJ"'
})

const tipoFactorAmbientalSchema = z.enum(["FACILITADOR", "BARREIRA"], {
    error: 'Tipo de factor ambiental deve ser "FACILITADOR" ou "BARREIRA"'
})

const itemCIFSchema = z.object({
    codigoCIF: z.string().min(1, 'Código do item CIF é obrigatório'),
    descricao: z.string().min(1, "Descriçao invalida").optional(),
    categoria: categoriaCIFSchema,
    nivel: z.number({ error: 'Nível do item CIF deve ser um número' }).int().min(0, 'Nível do item CIF deve ser um número inteiro não negativo').optional(),
    qualificador1: z.number({ error: 'Qualificador 1 do item CIF deve ser um número' }).int().min(0, 'Qualificador 1 do item CIF deve ser um número inteiro não negativo').optional(),
    tipoQualificador1: tipoFactorAmbientalSchema.optional(),
    qualificador2: z.number({ error: 'Qualificador 2 do item CIF deve ser um número' }).int().min(0, 'Qualificador 2 do item CIF deve ser um número inteiro não negativo').optional(),
    qualificador3: z.number({ error: 'Qualificador 3 do item CIF deve ser um número' }).int().min(0, 'Qualificador 3 do item CIF deve ser um número inteiro não negativo').optional(),
    qualificador4: z.number({ error: 'Qualificador 4 do item CIF deve ser um número' }).int().min(0, 'Qualificador 4 do item CIF deve ser um número inteiro não negativo').optional(),
    observacao: z.string().optional(),
})

const formularioCIFBaseSchema = z.object({
    dataPreenchimento: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: 'Data de preenchimento deve ser uma data válida',
    }),
    ultimaAlteracao: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: 'Data de última alteração deve ser uma data válida',
    }).optional(),
    condicaoSaude: z.string().optional(),
    condicaoSaudeDescricao: z.string(),
    factoresPessoais: z.string().optional(),
    planoTerapeutico: z.string().optional(),
    observacoes: z.string().optional(),
    itens: z.array(itemCIFSchema).default([]),
})

const formularioCIFCJSchema = formularioCIFBaseSchema.extend({
    tipoCIF: z.literal("CIF_CJ"),
})

const formularioCIFSchema = formularioCIFBaseSchema.extend({
    tipoCIF: z.literal('CIF'),
})

const cadastroFormularioCIFSchema = z.discriminatedUnion("tipoCIF", [
    formularioCIFSchema,
    formularioCIFCJSchema,
])

type ItemCIFInput = z.infer<typeof itemCIFSchema>
type FormularioCIFInput = z.infer<typeof formularioCIFSchema>
type FormularioCIFCJInput = z.infer<typeof formularioCIFCJSchema>
type CadastroFormularioCIFInput = z.infer<typeof cadastroFormularioCIFSchema>

export {
    categoriaCIFSchema,
    tipoCIFSchema,
    tipoFactorAmbientalSchema,
    itemCIFSchema,
    formularioCIFSchema,
    formularioCIFCJSchema,
    cadastroFormularioCIFSchema,
    ItemCIFInput,
    FormularioCIFInput,
    FormularioCIFCJInput,
    CadastroFormularioCIFInput,
}