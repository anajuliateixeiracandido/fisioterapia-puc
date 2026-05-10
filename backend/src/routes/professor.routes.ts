import { Router } from 'express'
import { associarAluno, associarPaciente, getAllProfessores } from '../controllers/professor.controller'
import { authorize } from '../middlewares/role.middleware';
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

router.get('/', authenticate, authorize('PROFESSOR'), getAllProfessores);
router.patch('/associar-aluno', authenticate, authorize('PROFESSOR'), associarAluno);
router.patch('/associar-paciente', authenticate, authorize('PROFESSOR'), associarPaciente);

export default router
