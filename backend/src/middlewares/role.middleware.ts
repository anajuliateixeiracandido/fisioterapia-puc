import { Request, Response, NextFunction } from 'express'

function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ code: 'TOKEN_MISSING' })
      return
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ code: 'FORBIDDEN' })
      return
    }

    next()
  }
}

export { authorize }
