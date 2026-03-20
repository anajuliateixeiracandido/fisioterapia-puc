import { describe, it, expect } from 'vitest'
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  senhaForteSchema,
} from '../../validators/auth.validator'

describe('senhaForteSchema', () => {
  it('deve aceitar senha forte válida', () => {
    expect(() => senhaForteSchema.parse('Senha@123')).not.toThrow()
  })

  it('deve rejeitar senha sem maiúscula', () => {
    expect(() => senhaForteSchema.parse('senha@123')).toThrow()
  })

  it('deve rejeitar senha sem número', () => {
    expect(() => senhaForteSchema.parse('Senha@abc')).toThrow()
  })

  it('deve rejeitar senha sem caractere especial', () => {
    expect(() => senhaForteSchema.parse('Senha1234')).toThrow()
  })

  it('deve rejeitar senha com menos de 8 caracteres', () => {
    expect(() => senhaForteSchema.parse('S@1abc')).toThrow()
  })
})

describe('loginSchema', () => {
  it('deve aceitar dados válidos', () => {
    expect(() =>
      loginSchema.parse({ email: 'user@sga.pucminas.br', senha: 'qualquercoisa' })
    ).not.toThrow()
  })

  it('deve rejeitar email fora do domínio', () => {
    expect(() => loginSchema.parse({ email: 'user@gmail.com', senha: 'qualquercoisa' })).toThrow()
  })

  it('deve rejeitar email inválido', () => {
    expect(() => loginSchema.parse({ email: 'nao-é-email', senha: 'qualquercoisa' })).toThrow()
  })

  it('deve rejeitar senha vazia', () => {
    expect(() => loginSchema.parse({ email: 'user@sga.pucminas.br', senha: '' })).toThrow()
  })
})

describe('forgotPasswordSchema', () => {
  it('deve aceitar email institucional válido', () => {
    expect(() => forgotPasswordSchema.parse({ email: 'user@sga.pucminas.br' })).not.toThrow()
  })

  it('deve rejeitar email fora do domínio', () => {
    expect(() => forgotPasswordSchema.parse({ email: 'user@gmail.com' })).toThrow()
  })
})

describe('resetPasswordSchema', () => {
  it('deve aceitar token e senha forte válidos', () => {
    expect(() =>
      resetPasswordSchema.parse({ token: 'tokenvalido', novaSenha: 'Senha@123' })
    ).not.toThrow()
  })

  it('deve rejeitar senha fraca', () => {
    expect(() => resetPasswordSchema.parse({ token: 'tokenvalido', novaSenha: 'fraca' })).toThrow()
  })

  it('deve rejeitar token vazio', () => {
    expect(() => resetPasswordSchema.parse({ token: '', novaSenha: 'Senha@123' })).toThrow()
  })
})

describe('refreshTokenSchema', () => {
  it('deve aceitar refresh token válido', () => {
    expect(() => refreshTokenSchema.parse({ refreshToken: 'tokenvalido' })).not.toThrow()
  })

  it('deve rejeitar refresh token vazio', () => {
    expect(() => refreshTokenSchema.parse({ refreshToken: '' })).toThrow()
  })
})
