import jwt from 'jsonwebtoken'
import env from '../config/env'

interface TokenPayload {
sub: string
fisioterapeutaId: number
role: string
}

function signAccessToken(payload: TokenPayload): string {
return jwt.sign(payload, env.jwt.secret, {
  expiresIn: env.jwt.expiresIn,
})
}

function verifyAccessToken(token: string): TokenPayload {
return jwt.verify(token, env.jwt.secret) as TokenPayload
}

export { signAccessToken, verifyAccessToken, TokenPayload }