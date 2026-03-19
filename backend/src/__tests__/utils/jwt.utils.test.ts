import { describe, it, expect } from 'vitest'
import { signAccessToken, verifyAccessToken } from '../../utils/jwt.utils'

const payloadValido = {
  sub: 'uuid-teste',
  fisioterapeutaId: 1,
  role: 'PROFESSOR',
}

describe('signAccessToken', () => {
  it('deve gerar um token JWT válido', () => {
    const token = signAccessToken(payloadValido)
    expect(token).toBeDefined()
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)
  })
})

describe('verifyAccessToken', () => {
  it('deve retornar o payload correto para um token válido', () => {
    const token = signAccessToken(payloadValido)
    const payload = verifyAccessToken(token)
    expect(payload.sub).toBe(payloadValido.sub)
    expect(payload.fisioterapeutaId).toBe(payloadValido.fisioterapeutaId)
    expect(payload.role).toBe(payloadValido.role)
  })

  it('deve lançar erro para token inválido', () => {
    expect(() => verifyAccessToken('token.invalido.aqui')).toThrow()
  })

  it('deve lançar TokenExpiredError para token expirado', async () => {
    await import('../../utils/jwt.utils')
    const jwt = await import('jsonwebtoken')
    const env = (await import('../../config/env')).default

    const tokenExpirado = jwt.default.sign(payloadValido, env.jwt.secret, { expiresIn: '0s' })

    await new Promise((resolve) => setTimeout(resolve, 1000))

    expect(() => verifyAccessToken(tokenExpirado)).toThrowError(
      expect.objectContaining({ name: 'TokenExpiredError' })
    )
  })
})
