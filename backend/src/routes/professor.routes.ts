import { Router } from 'express'
import { listar } from '../controllers/fisioterapeuta.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { authorize } from '../middlewares/role.middleware'

const router = Router()

router.get('/', authenticate, authorize('PROFESSOR'), listar)

export default router