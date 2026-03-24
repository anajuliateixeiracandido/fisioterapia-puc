import { Router } from 'express'
import { listarReferencias, obterPorCodigo } from '../controllers/cif-referencia.controller'

const router = Router()

// GET /cif-referencias - Listar referências CIF com filtros opcionais
// Query params:
//   - categoria (ESTRUTURA|FUNCAO|ACTIVIDADE_PARTICIPACAO|FACTOR_AMBIENTAL)
//   - busca (busca por código ou descrição)
//   - limit (default: 50)
//   - offset (default: 0)
router.get('/', listarReferencias)

// GET /cif-referencias/:codigo - Obter referência por código
router.get('/:codigo', obterPorCodigo)

export default router
