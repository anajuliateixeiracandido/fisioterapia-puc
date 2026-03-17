import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { AppError } from '../errors/AppError'

function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  console.error(err)

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ code: err.code })
    return
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      errors: err.issues.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    })
    return
  }

  if (typeof err === 'object' && err !== null && 'code' in err) {
    const prismaErr = err as { code: string }

    if (prismaErr.code === 'P2002') {
      res.status(409).json({ code: 'ALREADY_EXISTS' })
      return
    }

    if (prismaErr.code === 'P2025') {
      res.status(404).json({ code: 'NOT_FOUND' })
      return
    }
  }

  res.status(500).json({ code: 'INTERNAL_ERROR' })
}

export { errorHandler }
