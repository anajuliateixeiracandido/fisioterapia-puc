import { Router } from 'express'
import { listar, listarPorProfessor } from '../controllers/aluno.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { authorize } from '../middlewares/role.middleware'

const router = Router()

router.get('/', authenticate, authorize('PROFESSOR'), listar)
router.get('/professor/:professorFisioterapeutaId', authenticate, authorize('PROFESSOR'), listarPorProfessor)

export default router
