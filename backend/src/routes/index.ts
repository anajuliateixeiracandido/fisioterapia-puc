import { Router, Request, Response } from 'express'
import fisioterapeutaRoutes from './fisioterapeuta.routes'
import pacienteRoutes from './paciente.routes'
import authRoutes from './auth.routes'
import relatorioRoutes from './relatorio.routes'

const router = Router()

router.get('/health', (_req: Request, res: Response) => res.json({ ok: true }))

router.use('/auth', authRoutes)
router.use('/fisioterapeuta', fisioterapeutaRoutes)
router.use('/pacientes', pacienteRoutes)
router.use('/relatorios', relatorioRoutes)

export default router
