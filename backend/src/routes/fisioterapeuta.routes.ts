import { Router } from 'express'
import { cadastrar, getFisioterapeutas } from '../controllers/fisioterapeuta.controller'
import { authorize } from '../middlewares/role.middleware';
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

router.post('/', cadastrar);
router.get('/', authenticate, authorize('PROFESSOR', 'COORDENADOR', 'ALUNO'), getFisioterapeutas);
export default router
