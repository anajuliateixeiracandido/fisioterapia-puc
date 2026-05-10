import { Router } from 'express'
import { associarPaciente } from '../controllers/aluno.controller'
import { authorize } from '../middlewares/role.middleware';
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

router.patch('/associar-paciente', authenticate, authorize('ALUNO'), associarPaciente);
export default router
