import { Router } from 'express'
import {
  cadastrar,
  getPacientesFisioterapeuta,
  getPacientesID,
  getTodosPacientes,
} from '../controllers/paciente.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { authorize } from '../middlewares/role.middleware'

const router = Router()

router.post('/', authenticate, authorize('PROFESSOR', 'ALUNO'), cadastrar)
router.get('/', authenticate, authorize('PROFESSOR', 'ALUNO'), getPacientesFisioterapeuta)
router.get('/todos', authenticate, authorize('PROFESSOR'), getTodosPacientes)
router.get('/:id', authenticate, authorize('PROFESSOR', 'ALUNO'), getPacientesID)

export default router
