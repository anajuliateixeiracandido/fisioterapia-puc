import { Router } from 'express'
import { listarReferencias, obterPorCodigo, carregarItensCIFController } from '../controllers/cif-referencia.controller'

const router = Router()

// GET /cif-referencias - Listar referências CIF com filtros opcionais
// Query params:
//   - categoria (ESTRUTURA|FUNCAO|ACTIVIDADE_PARTICIPACAO|FACTOR_AMBIENTAL)
//   - busca (busca por código ou descrição)
//   - limit (default: 50)
//   - offset (default: 0)
router.get('/', listarReferencias)

// POST /cif-referencias/carregar - Carregar itens CIF a partir do JSON
router.post('/carregar', carregarItensCIFController)

// GET /cif-referencias/:codigo - Obter referência por código
router.get('/:codigo', obterPorCodigo)

export default router
