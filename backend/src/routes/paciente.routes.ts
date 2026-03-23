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

router.post('/', authenticate, authorize('PROFESSOR', 'COORDENADOR'), cadastrar);
router.get('/', authenticate, authorize('PROFESSOR', 'COORDENADOR'), getTodosPacientes);
router.get('/fisioterapeuta', authenticate, authorize('PROFESSOR', 'COORDENADOR', 'ALUNO'), getPacientesFisioterapeuta);
router.get('/:id', authenticate, authorize('PROFESSOR', 'COORDENADOR', 'ALUNO'), getPacientesID);

export default router
