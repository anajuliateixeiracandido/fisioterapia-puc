import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/jwt.utils'

function authenticate(req: Request, res: Response, next: NextFunction): void {
const authHeader = req.headers.authorization

if (!authHeader || !authHeader.startsWith('Bearer ')) {
  res.status(401).json({ code: 'TOKEN_MISSING' })
  return
}

const token = authHeader.split(' ')[1]

try {
  const payload = verifyAccessToken(token)
  req.user = payload
  next()
} catch (err) {
  if (err instanceof Error && err.name === 'TokenExpiredError') {
    res.status(401).json({ code: 'TOKEN_EXPIRED' })
    return
  }
  res.status(401).json({ code: 'TOKEN_INVALID' })
}
}

export { authenticate }