import { Router } from 'express'
import { cadastrar, listar } from '../controllers/paciente.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { authorize } from '../middlewares/role.middleware'

const router = Router()

router.post('/', authenticate, authorize('PROFESSOR'), cadastrar)
router.get('/', authenticate, authorize('PROFESSOR', 'ALUNO'), listar)

export default router
