import { z } from 'zod'

const loginSchema = z.object({
  email: z
    .string()
    .email('E-mail inválido')
    .endsWith('@sga.pucminas.br', 'Apenas e-mails @sga.pucminas.br são permitidos'),
  senha: z.string().min(1, 'Senha obrigatória'),
})

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email('E-mail inválido')
    .endsWith('@sga.pucminas.br', 'Apenas e-mails @sga.pucminas.br são permitidos'),
})

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token obrigatório'),
  novaSenha: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
})

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token obrigatório'),
})

type LoginInput = z.infer<typeof loginSchema>
type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
type RefreshTokenInput = z.infer<typeof refreshTokenSchema>

export {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  RefreshTokenInput,
}
