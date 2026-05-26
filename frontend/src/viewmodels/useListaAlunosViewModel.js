import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const LIMITE_PADRAO = 10

function useListaAlunosViewModel() {
const { user } = useAuth()
const isCoordenador = Boolean(user?.coordenador)

const [alunos, setAlunos] = useState([])
const [professores, setProfessores] = useState([])
const [professorSelecionado, setProfessorSelecionado] = useState('')
const [modo, setModo] = useState(isCoordenador ? 'todos' : 'professor')
const [busca, setBusca] = useState('')
const [buscaAplicada, setBuscaAplicada] = useState('')
const [pagination, setPagination] = useState({ page: 1, limit: LIMITE_PADRAO, total: 0, totalPages: 0 })
const [carregando, setCarregando] = useState(false)
const [carregandoProfessores, setCarregandoProfessores] = useState(false)
const [erro, setErro] = useState(null)

const professorFisioterapeutaId = useMemo(() => {
  if (!isCoordenador) return user?.fisioterapeutaId
  if (modo !== 'professor') return null
  return professorSelecionado ? Number(professorSelecionado) : null
}, [isCoordenador, modo, professorSelecionado, user?.fisioterapeutaId])

useEffect(() => {
  const timer = setTimeout(() => {
    setBuscaAplicada(busca.trim())
    setPagination((atual) => ({ ...atual, page: 1 }))
  }, 350)

  return () => clearTimeout(timer)
}, [busca])

useEffect(() => {
  if (!isCoordenador) return

  let ativo = true
  setCarregandoProfessores(true)

  api.get('/professores')
    .then(({ data }) => {
      if (ativo) setProfessores(Array.isArray(data) ? data : [])
    })
    .catch(() => {
      if (ativo) setProfessores([])
    })
    .finally(() => {
      if (ativo) setCarregandoProfessores(false)
    })

  return () => {
    ativo = false
  }
}, [isCoordenador])

useEffect(() => {
  let ativo = true

  async function carregarAlunos() {
    if (modo === 'professor' && !professorFisioterapeutaId) {
      setAlunos([])
      setPagination({ page: 1, limit: LIMITE_PADRAO, total: 0, totalPages: 0 })
      return
    }

    setCarregando(true)
    setErro(null)

    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      }

      if (buscaAplicada) params.busca = buscaAplicada

      const endpoint = modo === 'professor'
        ? `/alunos/professor/${professorFisioterapeutaId}`
        : '/alunos'

      const { data } = await api.get(endpoint, { params })

      if (!ativo) return

      setAlunos(Array.isArray(data.data) ? data.data : [])
      setPagination(data.pagination ?? { page: 1, limit: LIMITE_PADRAO, total: 0, totalPages: 0 })
    } catch {
      if (ativo) setErro('Erro ao carregar alunos.')
    } finally {
      if (ativo) setCarregando(false)
    }
  }

  carregarAlunos()

  return () => {
    ativo = false
  }
}, [modo, professorFisioterapeutaId, buscaAplicada, pagination.page, pagination.limit])

function alterarModo(novoModo) {
  setModo(novoModo)
  setPagination((atual) => ({ ...atual, page: 1 }))
}

function alterarProfessor(fisioterapeutaId) {
  setProfessorSelecionado(fisioterapeutaId)
  setPagination((atual) => ({ ...atual, page: 1 }))
}

function mudarPagina(page) {
  if (page < 1 || page > pagination.totalPages) return
  setPagination((atual) => ({ ...atual, page }))
}

return {
  alunos,
  professores,
  professorSelecionado,
  setProfessorSelecionado: alterarProfessor,
  modo,
  setModo: alterarModo,
  busca,
  setBusca,
  pagination,
  carregando,
  carregandoProfessores,
  erro,
  isCoordenador,
  mudarPagina,
}
}

export default useListaAlunosViewModel
