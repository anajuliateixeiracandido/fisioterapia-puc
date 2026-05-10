import { Router } from 'express'
import { getAllProfessores } from '../controllers/professor.controller'
import { authorize } from '../middlewares/role.middleware';
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

router.get('/', authenticate, authorize('PROFESSOR'), getAllProfessores);
export default router
