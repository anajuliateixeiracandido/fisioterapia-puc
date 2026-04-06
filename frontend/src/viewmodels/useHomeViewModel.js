import { useState } from 'react'
import { useModal } from '../contexts/ModalContext'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

export function useHomeViewModel() {
  const modal = useModal()
  
  // MOCK ALUNA - Maria Oliveira (ATIVO)
  const [user] = useState({
    nome: 'Maria Oliveira',
    role: 'ALUNO',
    initials: 'MO',
    matricula: 'ALU2024001',
    curso: 'Fisioterapia',
    fisioterapeutaId: 2 // ID da aluna
  })

  // MOCK PROFESSOR - Prof. Dr. João Silva (COMENTADO)
  // const [user] = useState({
  //   nome: 'Prof. Dr. João Silva',
  //   role: 'PROFESSOR',
  //   initials: 'JS',
  //   codigoPessoa: 'PROF001',
  //   curso: 'Fisioterapia',
  //   fisioterapeutaId: 1 // ID do professor
  // })

  const [hasNotifications] = useState(true)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [relatorioSeleccionado, setRelatorioSeleccionado] = useState(null)

  const navigateTo = (page) => setCurrentPage(page)
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
  const closeSidebar = () => setIsSidebarOpen(false)

  const stats = [
    { label: 'Total de relatórios', value: 3 },
    { label: 'Aguardando aprovação', value: 1 },
    { label: 'Aprovados', value: 2 },
  ]

  const handleEditarRelatorio = async (relatorioId, dados) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`${API_BASE}/relatorios/${relatorioId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          formularioCIF: {
            tipoCIF: dados.tipoCIF,
            dataPreenchimento: dados.dataPreenchimento,
            condicaoSaude: dados.condicaoSaude,
            condicaoSaudeDescricao: dados.condicaoSaudeDescricao,
            factoresPessoais: dados.factoresPessoais,
            planoTerapeutico: dados.planoTerapeutico,
            itens: dados.itens,
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao salvar alterações')
      }

      const resultado = await response.json()
      modal.showSuccess('Relatório atualizado com sucesso!')

      // Atualizar o relatório selecionado com os novos dados
      setRelatorioSeleccionado(resultado.data || resultado)
      setCurrentPage('ver-relatorio')
    } catch (error) {
      console.error('Erro ao editar relatório:', error)
      modal.showError('Erro ao salvar alterações: ' + error.message)
    }
  }

  const handleDeletarRelatorio = async (relatorio) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`${API_BASE}/relatorios/${relatorio.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao deletar relatório')
      }

      modal.showSuccess('Relatório deletado com sucesso!')
      setRelatorioSeleccionado(null)
      setCurrentPage('relatorios')
    } catch (error) {
      console.error('Erro ao deletar relatório:', error)
      modal.showError('Erro ao deletar relatório: ' + error.message)
    }
  }

  const handleVisualizarPaciente = (paciente) => {
    // TODO: Implementar visualização de detalhes do paciente
    console.log('Visualizar paciente:', paciente)
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
