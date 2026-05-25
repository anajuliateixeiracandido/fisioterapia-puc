import { Router } from 'express'
import { cadastrar } from '../controllers/fisioterapeuta.controller'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

router.post('/', authenticate, cadastrar)

export default router
