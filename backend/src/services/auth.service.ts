import prisma from '../lib/prisma'
import { AppError } from '../errors/AppError'
import {
  comparePassword,
  generateRefreshToken,
  hashRefreshToken,
  hashPassword,
} from '../utils/hash.utils'
import { signAccessToken } from '../utils/jwt.utils'
import { LoginInput } from '../validators/auth.validator'
import { enviarEmailResetSenha } from './email.service'
import env from '../config/env'
import crypto from 'crypto'

async function login(dados: LoginInput) {
  const fisioterapeuta = await prisma.fisioterapeuta.findUnique({
    where: { email: dados.email },
  })

  if (!fisioterapeuta || !fisioterapeuta.ativo) {
    throw new AppError(401, 'CREDENCIAIS_INVALIDAS', 'Credenciais inválidas')
  }

  const senhaCorreta = await comparePassword(dados.senha, fisioterapeuta.senha)

  if (!senhaCorreta) {
    throw new AppError(401, 'CREDENCIAIS_INVALIDAS', 'Credenciais inválidas')
  }

  const accessToken = signAccessToken({
    sub: fisioterapeuta.uid,
    fisioterapeutaId: fisioterapeuta.id,
    role: fisioterapeuta.role,
  })

  const refreshToken = generateRefreshToken()
  const refreshTokenHash = hashRefreshToken(refreshToken)

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + env.refreshToken.expiresInDays)

  await prisma.fisioterapeuta.update({
    where: { id: fisioterapeuta.id },
    data: {
      refreshTokenHash,
      refreshTokenExpiresAt: expiresAt,
    },
  })

  return {
    accessToken,
    refreshToken,
    user: {
      uid: fisioterapeuta.uid,
      nomeCompleto: fisioterapeuta.nomeCompleto,
      email: fisioterapeuta.email,
      role: fisioterapeuta.role,
    },
  }
}

async function logout(fisioterapeutaId: number) {
  await prisma.fisioterapeuta.update({
    where: { id: fisioterapeutaId },
    data: {
      refreshTokenHash: null,
      refreshTokenExpiresAt: null,
    },
  })
}

async function forgotPassword(email: string) {
  const fisioterapeuta = await prisma.fisioterapeuta.findUnique({
    where: { email },
  })

  if (!fisioterapeuta || !fisioterapeuta.ativo) {
    return
  }

  const token = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + env.passwordReset.expiresInMinutes)

  await prisma.fisioterapeuta.update({
    where: { id: fisioterapeuta.id },
    data: {
      passwordResetToken: tokenHash,
      passwordResetTokenExpiresAt: expiresAt,
    },
  })

  await enviarEmailResetSenha(fisioterapeuta.email, token)
}

async function resetPassword(token: string, novaSenha: string) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

  const fisioterapeuta = await prisma.fisioterapeuta.findFirst({
    where: {
      passwordResetToken: tokenHash,
      passwordResetTokenExpiresAt: { gt: new Date() },
    },
  })

  if (!fisioterapeuta) {
    throw new AppError(400, 'TOKEN_INVALIDO', 'Token inválido ou expirado')
  }

  const senhaHash = await hashPassword(novaSenha)

  await prisma.fisioterapeuta.update({
    where: { id: fisioterapeuta.id },
    data: {
      senha: senhaHash,
      passwordResetToken: null,
      passwordResetTokenExpiresAt: null,
    },
  })
}

async function refreshToken(token: string) {
  const tokenHash = hashRefreshToken(token)

  const fisioterapeuta = await prisma.fisioterapeuta.findFirst({
    where: {
      refreshTokenHash: tokenHash,
    },
  })

  if (!fisioterapeuta || !fisioterapeuta.ativo) {
    throw new AppError(401, 'REFRESH_TOKEN_INVALIDO', 'Refresh token inválido ou expirado')
  }

  const accessToken = signAccessToken({
    sub: fisioterapeuta.uid,
    fisioterapeutaId: fisioterapeuta.id,
    role: fisioterapeuta.role,
  })

  const novoRefreshToken = generateRefreshToken()
  const novoRefreshTokenHash = hashRefreshToken(novoRefreshToken)

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + env.refreshToken.expiresInDays)

  await prisma.fisioterapeuta.update({
    where: { id: fisioterapeuta.id },
    data: {
      refreshTokenHash: novoRefreshTokenHash,
      refreshTokenExpiresAt: expiresAt,
    },
  })

  return {
    accessToken,
    refreshToken: novoRefreshToken,
  }
}

export { login, logout, forgotPassword, resetPassword, refreshToken }
