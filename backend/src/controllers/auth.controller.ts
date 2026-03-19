import { Request, Response, NextFunction } from 'express'
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from '../validators/auth.validator'
import {
  login,
  logout,
  forgotPassword,
  resetPassword,
  refreshToken,
} from '../services/auth.service'

async function loginController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dados = loginSchema.parse(req.body)
    const resultado = await login(dados)
    res.status(200).json(resultado)
  } catch (err) {
    next(err)
  }
}

async function logoutController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await logout(req.user!.fisioterapeutaId)
    res.status(200).json({ message: 'Logout realizado com sucesso' })
  } catch (err) {
    next(err)
  }
}

async function forgotPasswordController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email } = forgotPasswordSchema.parse(req.body)
    await forgotPassword(email)
    res
      .status(200)
      .json({ message: 'Se este e-mail estiver cadastrado, você receberá as instruções em breve' })
  } catch (err) {
    next(err)
  }
}

async function resetPasswordController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token, novaSenha } = resetPasswordSchema.parse(req.body)
    await resetPassword(token, novaSenha)
    res.status(200).json({ message: 'Senha redefinida com sucesso' })
  } catch (err) {
    next(err)
  }
}

async function refreshTokenController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refreshToken: token } = refreshTokenSchema.parse(req.body)
    const resultado = await refreshToken(token)
    res.status(200).json(resultado)
  } catch (err) {
    next(err)
  }
}

export {
  loginController,
  logoutController,
  forgotPasswordController,
  resetPasswordController,
  refreshTokenController,
}
