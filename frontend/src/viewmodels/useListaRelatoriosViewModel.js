import { useState, useEffect, useCallback } from 'react'
import { useModal } from '../contexts/ModalContext'
import api from '../services/api'

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
      const params = {
        page: pagina,
        limit: 15,
        tipo: 'todos',
        ...(busca.trim() ? { nomePaciente: busca.trim() } : {}),
        ...(status ? { status } : {}),
        ...(dataInicio ? { dataInicio } : {}),
        ...(dataFim ? { dataFim } : {}),
      }

      const { data: json } = await api.get('/relatorios', { params })
      setRelatorios(json.data ?? [])
      setPagination(json.pagination ?? null)
    } catch (e) {
      setErro(e.response?.data?.message || e.message)
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
      
      await api.post('/relatorios', payload)

      modal.showSuccess('Relatório criado com sucesso!')
      setView('lista')
      fetchRelatorios()
    } catch (error) {
      modal.showError('Erro ao criar relatório: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleMudarPagina = (novaPagina) => {
    setPagina(novaPagina)
  }

  const limparFiltros = () => {
    setBusca('')
    setStatus('')
    setDataInicio('')
    setDataFim('')
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
    limparFiltros,
    handleSalvarRelatorio,
    handleMudarPagina,
    fetchRelatorios,
  }
}
