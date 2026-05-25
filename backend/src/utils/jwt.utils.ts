import jwt from 'jsonwebtoken'
import env from '../config/env'
import { Role } from '@prisma/client'

interface TokenPayload {
sub: string
fisioterapeutaId: number
role: Role
coordenador: boolean
iat?: number
exp?: number
}

function signAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
return jwt.sign(payload, env.jwt.secret, {
  expiresIn: env.jwt.expiresIn,
})
}

function verifyAccessToken(token: string): TokenPayload {
return jwt.verify(token, env.jwt.secret) as TokenPayload
}

export { signAccessToken, verifyAccessToken, TokenPayload }