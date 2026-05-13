import { useState, useEffect, useCallback } from 'react'
import { useModal } from '../contexts/ModalContext'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

export function useListaRelatoriosViewModel() {
  const modal = useModal()
  const [view, setView] = useState('lista')
  const [relatorios, setRelatorios] = useState([])
  const [pagination, setPagination] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState(null)
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [pagina, setPagina] = useState(1)

  const fetchRelatorios = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const params = new URLSearchParams()
      params.append('page', String(pagina))
      params.append('limit', '15')
      params.append('tipo', 'todos')

      if (busca.trim()) {
        params.append('nomePaciente', busca.trim())
      }
      if (status) params.append('status', status)
      if (dataInicio) params.append('dataInicio', dataInicio)
      if (dataFim) params.append('dataFim', dataFim)

      const token = localStorage.getItem('accessToken')

      const res = await fetch(`${API_BASE}/relatorios?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`)

      const json = await res.json()
      setRelatorios(json.data ?? [])
      setPagination(json.pagination ?? null)
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [busca, status, dataInicio, dataFim, pagina])

  useEffect(() => {
    if (view === 'lista') fetchRelatorios()
  }, [fetchRelatorios, view])

  useEffect(() => {
    setPagina(1)
  }, [busca, status, dataInicio, dataFim])

  const handleSalvarRelatorio = async (dadosFormulario) => {
    try {
      const token = localStorage.getItem('accessToken')
      
      const itens = Array.isArray(dadosFormulario.itens) ? dadosFormulario.itens : []
      
      const payload = {
        pacienteId: dadosFormulario.pacienteId,
        formularioCIF: {
          tipoCIF: dadosFormulario.tipoCIF || 'CIF',
          dataPreenchimento: dadosFormulario.dataPreenchimento,
          condicaoSaude: dadosFormulario.condicaoSaude || '',
          condicaoSaudeDescricao: dadosFormulario.condicaoSaudeDescricao,
          factoresPessoais: dadosFormulario.factoresPessoais || '',
          planoTerapeutico: dadosFormulario.planoTerapeutico || '',
          observacoes: '',
          itens: itens.map(item => {
            const itemData = {
              codigoCIF: item.codigoCIF || '',
              descricao: item.descricao || item.nome || '',
              categoria: item.categoria || 'FUNCAO',
            }
            if (item.nivel !== undefined && item.nivel !== null) itemData.nivel = item.nivel
            if (item.qualificador1 !== undefined && item.qualificador1 !== null) itemData.qualificador1 = item.qualificador1
            if (item.tipoQualificador1) itemData.tipoQualificador1 = item.tipoQualificador1
            if (item.qualificador2 !== undefined && item.qualificador2 !== null) itemData.qualificador2 = item.qualificador2
            if (item.qualificador3 !== undefined && item.qualificador3 !== null) itemData.qualificador3 = item.qualificador3
            if (item.qualificador4 !== undefined && item.qualificador4 !== null) itemData.qualificador4 = item.qualificador4
            if (item.observacao) itemData.observacao = item.observacao
            return itemData
          }),
        },
      }
      
      const response = await fetch(`${API_BASE}/relatorios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || JSON.stringify(errorData.errors || errorData))
      }

      modal.showSuccess('Relatório criado com sucesso!')
      setView('lista')
      fetchRelatorios()
    } catch (error) {
      modal.showError('Erro ao criar relatório: ' + error.message)
    }
  }

  const handleMudarPagina = (novaPagina) => {
    setPagina(novaPagina)
  }

  return {
    // Estado
    view,
    relatorios,
    pagination,
    carregando,
    erro,
    busca,
    status,
    dataInicio,
    dataFim,
    pagina,

    // Setters
    setView,
    setBusca,
    setStatus,
    setDataInicio,
    setDataFim,

    // Handlers
    handleSalvarRelatorio,
    handleMudarPagina,
    fetchRelatorios,
  }
}
