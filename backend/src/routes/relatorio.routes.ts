import { Router } from 'express'
import {
  criar,
  editar,
  deletar,
  listar,
  obterPorId,
  gerarPDF,
} from '../controllers/relatorio.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { authorize } from '../middlewares/role.middleware'

const router = Router()

// Todas as rotas exigem autenticação
router.use(authenticate)

// POST /relatorios - Criar relatório (Aluno ou Professor)
router.post('/', authorize('ALUNO', 'PROFESSOR'), criar)

// GET /relatorios - Listar relatórios com filtros e paginação
router.get('/', authorize('ALUNO', 'PROFESSOR'), listar)

// GET /relatorios/:id - Obter relatório por ID
router.get('/:id', authorize('ALUNO', 'PROFESSOR'), obterPorId)

// GET /relatorios/:id/pdf - Gerar PDF
router.get('/:id/pdf', authorize('ALUNO', 'PROFESSOR'), gerarPDF)

// PATCH /relatorios/:id - Editar relatório
router.patch('/:id', authorize('ALUNO', 'PROFESSOR'), editar)

// DELETE /relatorios/:id - Deletar relatório
router.delete('/:id', authorize('ALUNO', 'PROFESSOR'), deletar)

export default router
