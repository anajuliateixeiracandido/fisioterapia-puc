import { describe, it, expect } from 'vitest'
import {
  hashPassword,
  comparePassword,
  generateRefreshToken,
  hashRefreshToken,
} from '../../utils/hash.utils'

describe('hashPassword', () => {
  it('deve retornar um hash diferente da senha original', async () => {
    const senha = 'Senha@123'
    const hash = await hashPassword(senha)
    expect(hash).not.toBe(senha)
  })

  it('deve gerar hashes diferentes para a mesma senha', async () => {
    const senha = 'Senha@123'
    const hash1 = await hashPassword(senha)
    const hash2 = await hashPassword(senha)
    expect(hash1).not.toBe(hash2)
  })
})

describe('comparePassword', () => {
  it('deve retornar true para senha correta', async () => {
    const senha = 'Senha@123'
    const hash = await hashPassword(senha)
    const resultado = await comparePassword(senha, hash)
    expect(resultado).toBe(true)
  })

  it('deve retornar false para senha incorreta', async () => {
    const senha = 'Senha@123'
    const hash = await hashPassword(senha)
    const resultado = await comparePassword('SenhaErrada@123', hash)
    expect(resultado).toBe(false)
  })
})

describe('generateRefreshToken', () => {
  it('deve gerar um token de 128 caracteres hexadecimais', () => {
    const token = generateRefreshToken()
    expect(token).toHaveLength(128)
    expect(token).toMatch(/^[a-f0-9]+$/)
  })

  it('deve gerar tokens únicos a cada chamada', () => {
    const token1 = generateRefreshToken()
    const token2 = generateRefreshToken()
    expect(token1).not.toBe(token2)
  })
})

describe('hashRefreshToken', () => {
  it('deve gerar o mesmo hash para o mesmo token', () => {
    const token = generateRefreshToken()
    const hash1 = hashRefreshToken(token)
    const hash2 = hashRefreshToken(token)
    expect(hash1).toBe(hash2)
  })

  it('deve gerar hashes diferentes para tokens diferentes', () => {
    const hash1 = hashRefreshToken(generateRefreshToken())
    const hash2 = hashRefreshToken(generateRefreshToken())
    expect(hash1).not.toBe(hash2)
  })
})
