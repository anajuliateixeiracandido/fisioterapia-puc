import { Router } from 'express'
import {
  criar,
  editar,
  deletar,
  avaliar,
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
// Query params: page (default: 1), limit (default: 10), codigoPaciente, status, dataInicio, dataFim, ordenacao, tipo, matriculaAluno
router.get('/', authorize('ALUNO', 'PROFESSOR', 'COORDENADOR'), listar)

// GET /relatorios/:id - Obter relatório por ID
router.get('/:id', authorize('ALUNO', 'PROFESSOR', 'COORDENADOR'), obterPorId)

// GET /relatorios/:id/pdf - Gerar PDF
router.get('/:id/pdf', authorize('ALUNO', 'PROFESSOR', 'COORDENADOR'), gerarPDF)

// PATCH /relatorios/avaliacao/:id - Avaliar relatório (apenas Professor e Coordenador)
router.patch('/avaliacao/:id', authorize('PROFESSOR', 'COORDENADOR'), avaliar)

// PATCH /relatorios/:id - Editar relatório
router.patch('/:id', authorize('ALUNO', 'PROFESSOR', 'COORDENADOR'), editar)

// DELETE /relatorios/:id - Deletar relatório
router.delete('/:id', authorize('ALUNO', 'PROFESSOR', 'COORDENADOR'), deletar)

export default router