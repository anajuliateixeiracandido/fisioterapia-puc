import { Router } from 'express'
import { obter, atualizar } from '../controllers/fisioterapeuta.controller'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

router.get('/', authenticate, obter)
router.patch('/', authenticate, atualizar)

export default router