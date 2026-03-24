import { describe, it, expect, vi, beforeEach } from 'vitest'

const { prismaMock } = vi.hoisted(() => {
  const prismaMock = {
    fisioterapeuta: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  }
  return { prismaMock }
})

vi.mock('../../lib/prisma', () => ({ default: prismaMock }))
vi.mock('../../services/email.service', () => ({
  enviarEmailResetSenha: vi.fn(),
}))

import {
  login,
  logout,
  forgotPassword,
  resetPassword,
  refreshToken,
} from '../../services/auth.service'
import { hashPassword, generateRefreshToken } from '../../utils/hash.utils'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('login', () => {
  it('deve retornar tokens e dados do usuário para credenciais válidas', async () => {
    const senhaHash = await hashPassword('Senha@123')

    prismaMock.fisioterapeuta.findUnique.mockResolvedValue({
      id: 1,
      uid: 'uuid-teste',
      email: 'user@sga.pucminas.br',
      senha: senhaHash,
      nomeCompleto: 'Usuário Teste',
      role: 'PROFESSOR',
    })

    prismaMock.fisioterapeuta.update.mockResolvedValue({})

    const resultado = await login({ email: 'user@sga.pucminas.br', senha: 'Senha@123' })

    expect(resultado).toHaveProperty('accessToken')
    expect(resultado).toHaveProperty('refreshToken')
    expect(resultado.user.email).toBe('user@sga.pucminas.br')
    expect(resultado.user.role).toBe('PROFESSOR')
  })

  it('deve lançar CREDENCIAIS_INVALIDAS para usuário não encontrado', async () => {
    prismaMock.fisioterapeuta.findUnique.mockResolvedValue(null)

    await expect(
      login({ email: 'naoexiste@sga.pucminas.br', senha: 'Senha@123' })
    ).rejects.toMatchObject({ code: 'CREDENCIAIS_INVALIDAS' })
  })

  it('deve lançar CREDENCIAIS_INVALIDAS para senha incorreta', async () => {
    const senhaHash = await hashPassword('Senha@123')

    prismaMock.fisioterapeuta.findUnique.mockResolvedValue({
      id: 1,
      uid: 'uuid-teste',
      email: 'user@sga.pucminas.br',
      senha: senhaHash,
      nomeCompleto: 'Usuário Teste',
      role: 'PROFESSOR',
    })

    await expect(
      login({ email: 'user@sga.pucminas.br', senha: 'SenhaErrada@123' })
    ).rejects.toMatchObject({ code: 'CREDENCIAIS_INVALIDAS' })
  })
})

describe('logout', () => {
  it('deve limpar o refresh token do usuário', async () => {
    prismaMock.fisioterapeuta.update.mockResolvedValue({})

    await logout(1)

    expect(prismaMock.fisioterapeuta.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { refreshTokenHash: null, refreshTokenExpiresAt: null },
    })
  })
})

describe('forgotPassword', () => {
  it('deve retornar silenciosamente para email inexistente', async () => {
    prismaMock.fisioterapeuta.findUnique.mockResolvedValue(null)
    await expect(forgotPassword('naoexiste@sga.pucminas.br')).resolves.toBeUndefined()
  })

  it('deve salvar token e enviar email para usuário válido', async () => {
    prismaMock.fisioterapeuta.findUnique.mockResolvedValue({
      id: 1,
      email: 'user@sga.pucminas.br',
    })
    prismaMock.fisioterapeuta.update.mockResolvedValue({})

    await forgotPassword('user@sga.pucminas.br')

    expect(prismaMock.fisioterapeuta.update).toHaveBeenCalled()
  })
})

describe('resetPassword', () => {
  it('deve lançar TOKEN_INVALIDO para token inexistente', async () => {
    prismaMock.fisioterapeuta.findFirst.mockResolvedValue(null)

    await expect(resetPassword('token-invalido', 'Senha@123')).rejects.toMatchObject({
      code: 'TOKEN_INVALIDO',
    })
  })

  it('deve atualizar senha e limpar token para token válido', async () => {
    prismaMock.fisioterapeuta.findFirst.mockResolvedValue({ id: 1 })
    prismaMock.fisioterapeuta.update.mockResolvedValue({})

    await resetPassword('token-valido', 'NovaSenha@123')

    expect(prismaMock.fisioterapeuta.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: expect.objectContaining({
          passwordResetToken: null,
          passwordResetTokenExpiresAt: null,
        }),
      })
    )
  })
})

describe('refreshToken', () => {
  it('deve lançar REFRESH_TOKEN_INVALIDO para token inexistente', async () => {
    prismaMock.fisioterapeuta.findFirst.mockResolvedValue(null)

    await expect(refreshToken('token-invalido')).rejects.toMatchObject({
      code: 'REFRESH_TOKEN_INVALIDO',
    })
  })

  it('deve retornar novos tokens para refresh token válido', async () => {
    prismaMock.fisioterapeuta.findFirst.mockResolvedValue({
      id: 1,
      uid: 'uuid-teste',
      role: 'PROFESSOR',
    })
    prismaMock.fisioterapeuta.update.mockResolvedValue({})

    const resultado = await refreshToken(generateRefreshToken())

    expect(resultado).toHaveProperty('accessToken')
    expect(resultado).toHaveProperty('refreshToken')
  })
})
