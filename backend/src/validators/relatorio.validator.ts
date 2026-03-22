import { z } from "zod";
import { cadastroFormularioCIFSchema } from "./formulario-cif.validator";

const cadastroRelatorioSchema = z.object({
    pacienteId: z.number().int().positive({ message: 'ID do paciente deve ser um número inteiro positivo' }),
    professorResponsavelId: z.number().int().positive({ message: 'ID do professor responsável deve ser um número inteiro positivo' }),
    formularioCIF: cadastroFormularioCIFSchema,
})

type CadastroRelatorioInput = z.infer<typeof cadastroRelatorioSchema>

export { cadastroRelatorioSchema, CadastroRelatorioInput }