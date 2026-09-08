import { useState, useEffect } from 'react'
import { useModal } from '../contexts/ModalContext'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { calcularIniciais } from '../utils/formatadores'

export function useHomeViewModel() {
  const modal = useModal()
  const { user: dadosAuth } = useAuth()

  const user = dadosAuth
    ? {
        nome: dadosAuth.nomeCompleto,
        role: dadosAuth.role,
        initials: calcularIniciais(dadosAuth.nomeCompleto),
        coordenador: dadosAuth.coordenador,
        codigoPessoa: dadosAuth.codigoPessoa,
        matricula: dadosAuth.matricula,
        fisioterapeutaId: dadosAuth.fisioterapeutaId,
        curso: null,
      }
    : null

  const [hasNotifications] = useState(true)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [relatorioSeleccionado, setRelatorioSeleccionado] = useState(null)
  const [stats, setStats] = useState([
    { label: 'Total de relatórios', value: '—' },
    { label: 'Aguardando aprovação', value: '—' },
    { label: 'Aprovados', value: '—' },
  ])

  useEffect(() => {
    Promise.all([
      api.get('/relatorios', { params: { page: 1, limit: 1, tipo: 'todos' } }),
      api.get('/relatorios', { params: { page: 1, limit: 1, tipo: 'todos', status: 'ENVIADO' } }),
      api.get('/relatorios', { params: { page: 1, limit: 1, tipo: 'todos', status: 'APROVADO' } }),
    ])
      .then(([todos, enviados, aprovados]) => {
        setStats([
          { label: 'Total de relatórios', value: todos.data?.pagination?.total ?? 0 },
          { label: 'Aguardando aprovação', value: enviados.data?.pagination?.total ?? 0 },
          { label: 'Aprovados', value: aprovados.data?.pagination?.total ?? 0 },
        ])
      })
      .catch(() => {})
  }, [])

  const navigateTo = (page) => setCurrentPage(page)
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
  const closeSidebar = () => setIsSidebarOpen(false)

  const handleEditarRelatorio = async (relatorioId, dados) => {
    try {
      const { data: resultado } = await api.patch(`/relatorios/${relatorioId}`, {
        formularioCIF: {
          tipoCIF: dados.tipoCIF,
          dataPreenchimento: dados.dataPreenchimento,
          condicaoSaude: dados.condicaoSaude,
          condicaoSaudeDescricao: dados.condicaoSaudeDescricao,
          factoresPessoais: dados.factoresPessoais,
          planoTerapeutico: dados.planoTerapeutico,
          diagnosticoFisioterapeutico: dados.diagnosticoFisioterapeutico,
          objetivoCurtoPrazo: dados.objetivoCurtoPrazo,
          objetivoLongoPrazo: dados.objetivoLongoPrazo,
          observacoes: dados.observacoes,
          itens: dados.itens,
        },
      })
      modal.showSuccess('Relatório atualizado com sucesso!')
      setRelatorioSeleccionado(resultado.data || resultado)
      setCurrentPage('ver-relatorio')
    } catch (error) {
      modal.showError('Erro ao salvar alterações: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleDeletarRelatorio = async (relatorio) => {
    try {
      await api.delete(`/relatorios/${relatorio.id}`)
      modal.showSuccess('Relatório deletado com sucesso!')
      setRelatorioSeleccionado(null)
      setCurrentPage('relatorios')
    } catch (error) {
      modal.showError('Erro ao deletar relatório: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleVisualizarPaciente = (paciente) => {
    // TODO: Implementar visualização de detalhes do paciente
    modal.showInfo(
      `TODO: Implementar tela de detalhes do paciente\n\nPaciente: ${paciente.nomeCompleto}\nCódigo: ${paciente.codigo}`,
      'Funcionalidade em desenvolvimento'
    )
  }

  return {
    // Estado
    user,
    hasNotifications,
    currentPage,
    isSidebarOpen,
    relatorioSeleccionado,
    stats,

    // Setters
    setCurrentPage,
    setRelatorioSeleccionado,

    // Actions
    navigateTo,
    toggleSidebar,
    closeSidebar,
    handleEditarRelatorio,
    handleDeletarRelatorio,
    handleVisualizarPaciente,
  }
}
