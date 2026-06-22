import { z } from 'zod'

const transferenciaCoordenadorSchema = z.object({
  novoCoordenadorId: z.number().int().positive(),
})

type TransferenciaCoordenadorInput = z.infer<typeof transferenciaCoordenadorSchema>

export { transferenciaCoordenadorSchema, TransferenciaCoordenadorInput }
