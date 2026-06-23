import { useEffect, useState } from 'react'
import api from '../services/api'

const LIMITE_PADRAO = 10

function useListaProfessoresViewModel() {
const [professores, setProfessores] = useState([])
const [pagination, setPagination] = useState({ page: 1, limit: LIMITE_PADRAO, total: 0, totalPages: 0 })
const [carregando, setCarregando] = useState(false)
const [erro, setErro] = useState(null)

useEffect(() => {
  let ativo = true

  async function carregarProfessores() {
    setCarregando(true)
    setErro(null)

    try {
      const { data } = await api.get('/professores', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
        },
      })

      if (!ativo) return

      setProfessores(Array.isArray(data.data) ? data.data : [])
      setPagination(data.pagination ?? { page: 1, limit: LIMITE_PADRAO, total: 0, totalPages: 0 })
    } catch {
      if (ativo) setErro('Erro ao carregar professores.')
    } finally {
      if (ativo) setCarregando(false)
    }
  }

  carregarProfessores()

  return () => {
    ativo = false
  }
}, [pagination.page, pagination.limit])

function mudarPagina(page) {
  if (page < 1 || page > pagination.totalPages) return
  setPagination((atual) => ({ ...atual, page }))
}

return {
  professores,
  pagination,
  carregando,
  erro,
  mudarPagina,
}
}

export default useListaProfessoresViewModel
