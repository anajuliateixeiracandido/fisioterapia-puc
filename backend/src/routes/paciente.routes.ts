import { Router } from 'express'
import { cadastrar } from '../controllers/paciente.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { authorize } from '../middlewares/role.middleware'

const router = Router()

router.post('/', authenticate, authorize('PROFESSOR'), cadastrar)

export default router
