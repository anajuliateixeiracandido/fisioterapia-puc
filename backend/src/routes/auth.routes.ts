import { Router } from 'express'
import {
  loginController,
  logoutController,
  forgotPasswordController,
  resetPasswordController,
  refreshTokenController,
} from '../controllers/auth.controller'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

router.post('/login', loginController)
router.post('/logout', authenticate, logoutController)
router.post('/forgot-password', forgotPasswordController)
router.post('/reset-password', resetPasswordController)
router.post('/refresh-token', refreshTokenController)

export default router
