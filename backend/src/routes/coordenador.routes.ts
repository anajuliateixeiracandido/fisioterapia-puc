import { Router } from 'express'
import { associarCoordenador } from '../controllers/coordenador.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { authorize } from '../middlewares/role.middleware'

const router = Router()

router.patch('/', authenticate, authorize('PROFESSOR'), associarCoordenador)

export default router
