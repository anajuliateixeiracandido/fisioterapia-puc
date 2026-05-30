import { Router } from 'express'
import {
  associarCoordenador,
  listarProfessoresTransferencia,
} from '../controllers/coordenador.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { authorize } from '../middlewares/role.middleware'

const router = Router()

router.get(
  '/transferencia/professores',
  authenticate,
  authorize('PROFESSOR'),
  listarProfessoresTransferencia
)
router.patch('/', authenticate, authorize('PROFESSOR'), associarCoordenador)

export default router
