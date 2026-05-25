import { Router, Request, Response } from 'express'
import authRoutes from './auth.routes'
import cifReferenciaRoutes from './cif-referencia.routes'
import coordenadorRoutes from './coordenador.routes'
import fisioterapeutaRoutes from './fisioterapeuta.routes'
import pacienteRoutes from './paciente.routes'
import perfilRoutes from './perfil.routes'
import professorRoutes from './professor.routes'
import relatorioRoutes from './relatorio.routes'

const router = Router()

router.get('/health', (_req: Request, res: Response) => res.json({ ok: true }))

router.use('/auth', authRoutes)
router.use('/cif-referencias', cifReferenciaRoutes)
router.use('/coordenadores', coordenadorRoutes)
router.use('/fisioterapeuta', fisioterapeutaRoutes)
router.use('/me', perfilRoutes)
router.use('/pacientes', pacienteRoutes)
router.use('/professores', professorRoutes)
router.use('/relatorios', relatorioRoutes)

export default router
