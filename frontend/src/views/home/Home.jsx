import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { ClipboardList, Clock, Check, Users, Pencil, Trash2, ArrowLeft } from 'lucide-react'
import Layout from '../../components/Layout'
import { ListaRelatorios } from '../relatorio/ListaRelatorios'
import { VisualizacaoRelatorio } from '../relatorio/VisualizacaoRelatorio'
import { ReportForm } from '../relatorio/FormularioRelatorio'
import { ModalAvaliacaoRelatorio } from '../relatorio/ModalAvaliacaoRelatorio'
import { DetalhesPaciente, ListaPacientes } from '../paciente/Pacientes'
import { useModal } from '../../contexts/ModalContext'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import { podeEditarRelatorio, podeDeletarRelatorio, podeAvaliarRelatorio } from '../../utils/permissoes'
import { obterRelatorio } from '../../services/relatorioService'
import { calcularIniciais } from '../../utils/formatadores'
import './Home.css'

const StatCard = ({ icon, label, value, colorClass }) => {
const Icon = icon
return (
  <div className="stat-card">
    <div className={`stat-icon ${colorClass}`}>
      <Icon size={24} />
    </div>
    <div className="stat-content">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  </div>
)
}

const Home = () => {
const modal = useModal()
const location = useLocation()
const { user: dadosAuth } = useAuth()
const nomeUsuario = (dadosAuth?.nomeCompleto || dadosAuth?.nome || dadosAuth?.email || 'Usuário').trim() || 'Usuário'

const user = dadosAuth
  ? {
      nome: nomeUsuario,
      role: dadosAuth.role,
      initials: calcularIniciais(nomeUsuario),
      coordenador: dadosAuth.coordenador,
      codigoPessoa: dadosAuth.codigoPessoa,
      matricula: dadosAuth.matricula,
      fisioterapeutaId: dadosAuth.fisioterapeutaId,
      curso: null,
    }
  : null

const paginaInicial = ['dashboard', 'relatorios', 'pacientes'].includes(location.state?.currentPage)
  ? location.state.currentPage
  : 'dashboard'
const [currentPage, setCurrentPage] = useState(paginaInicial)
const [relatorioSelecionado, setRelatorioSelecionado] = useState(null)
const [pacienteSelecionadoId, setPacienteSelecionadoId] = useState(null)
const [escopoPacientes, setEscopoPacientes] = useState('meus')
const [carregandoRelatorio, setCarregandoRelatorio] = useState(false)
const [modalAvaliacaoAberto, setModalAvaliacaoAberto] = useState(false)
const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false)

const [stats, setStats] = useState([
  { icon: ClipboardList, label: 'Total de relatórios', value: '—', colorClass: 'stat-blue' },
  { icon: Clock, label: 'Aguardando aprovação', value: '—', colorClass: 'stat-yellow' },
  { icon: Check, label: 'Aprovados', value: '—', colorClass: 'stat-green' },
])
const [totalPacientes, setTotalPacientes] = useState('—')

useEffect(() => {
  if (['dashboard', 'relatorios', 'pacientes'].includes(location.state?.currentPage)) {
    setCurrentPage(location.state.currentPage)
  }
}, [location.state])

useEffect(() => {
  Promise.all([
    api.get('/relatorios', { params: { page: 1, limit: 1, tipo: 'todos' } }),
    api.get('/relatorios', { params: { page: 1, limit: 1, tipo: 'todos', status: 'ENVIADO' } }),
    api.get('/relatorios', { params: { page: 1, limit: 1, tipo: 'todos', status: 'CORRIGIDO' } }),
    api.get('/relatorios', { params: { page: 1, limit: 1, tipo: 'todos', status: 'APROVADO' } }),
    api.get('/pacientes', { params: { page: 1, limit: 1 } }),
  ])
    .then(([todos, enviados, corrigidos, aprovados, pacientesData]) => {
      setStats([
        { icon: ClipboardList, label: 'Total de relatórios', value: todos.data?.pagination?.total ?? 0, colorClass: 'stat-blue' },
        { icon: Clock, label: 'Aguardando aprovação', value: (enviados.data?.pagination?.total ?? 0) + (corrigidos.data?.pagination?.total ?? 0), colorClass: 'stat-yellow' },
        { icon: Check, label: 'Aprovados', value: aprovados.data?.pagination?.total ?? 0, colorClass: 'stat-green' },
      ])
      setTotalPacientes(
        pacientesData.data?.pagination?.total ??
        pacientesData.data?.total ??
        (Array.isArray(pacientesData.data) ? pacientesData.data.length : 0)
      )
    })
    .catch(() => {})
}, [])

if (!user) return null

return (
  <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
    {currentPage === 'dashboard' && (
      <div className="content-section">
        <div className="greeting-section">
          <h1 className="greeting-title">Olá, {user.nome.trim().split(' ')[0]}</h1>
          <p className="greeting-subtitle">
            {user.role === 'PROFESSOR'
              ? `Código: ${user.codigoPessoa ?? '—'}`
              : `Matrícula: ${user.matricula ?? '—'}`}
            {user.curso ? ` · ${user.curso}` : ''}
          </p>
        </div>

        <div className="stats-grid">
          <StatCard
            icon={Users}
            label="Meus pacientes"
            value={totalPacientes}
            colorClass="stat-purple"
          />
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              colorClass={stat.colorClass}
            />
          ))}
        </div>
      </div>
    )}

    {currentPage === 'relatorios' && (
      <div className="content-section">
        <ListaRelatorios
          onVerRelatorio={(r) => {
            setRelatorioSelecionado(r)
            setCurrentPage('ver-relatorio')
          }}
        />
      </div>
    )}

    {currentPage === 'ver-relatorio' && relatorioSelecionado && (
      <div className="content-section">
        <VisualizacaoRelatorio
          relatorio={relatorioSelecionado}
          user={user}
          onVoltar={() => setCurrentPage('relatorios')}
          onVisualizarPaciente={(paciente) => {
            if (!paciente?.id) return
            setPacienteSelecionadoId(paciente.id)
            setCurrentPage('detalhes-paciente')
          }}
          acoes={
            <div className="button-group">
              {podeEditarRelatorio(relatorioSelecionado, user) && (
                <button
                  type="button"
                  onClick={async () => {
                    setCarregandoRelatorio(true)
                    try {
                      const dados = await obterRelatorio(relatorioSelecionado.id)
                      setRelatorioSelecionado(dados)
                      setCurrentPage('editar-relatorio')
                    } catch {
                      modal.showError('Erro ao carregar relatório para edição')
                    } finally {
                      setCarregandoRelatorio(false)
                    }
                  }}
                  disabled={carregandoRelatorio}
                  className="btn-header-action"
                  title="Editar relatório"
                >
                  <Pencil size={20} />
                </button>
              )}

              {podeDeletarRelatorio(relatorioSelecionado, user) && (
                <button
                  type="button"
                  onClick={async () => {
                    const confirmed = await modal.showConfirm(
                      'Tem certeza que deseja deletar este relatório? Esta ação não pode ser desfeita.',
                      'Confirmar exclusão'
                    )
                    if (!confirmed) return

                    try {
                      await api.delete(`/relatorios/${relatorioSelecionado.id}`)
                      modal.showSuccess('Relatório deletado com sucesso!')
                      setRelatorioSelecionado(null)
                      setCurrentPage('relatorios')
                    } catch (error) {
                      modal.showError('Erro ao deletar relatório: ' + (error.response?.data?.message || error.message))
                    }
                  }}
                  className="btn-header-action btn-header-action--danger"
                  title="Deletar relatório"
                >
                  <Trash2 size={20} />
                </button>
              )}

              {podeAvaliarRelatorio(relatorioSelecionado, user) && (
                <button
                  type="button"
                  onClick={() => setModalAvaliacaoAberto(true)}
                  disabled={enviandoAvaliacao}
                  className="btn-header-action btn-header-action--success"
                  title="Avaliar relatório"
                >
                  <ClipboardList size={20} />
                </button>
              )}
            </div>
          }
        />

        <ModalAvaliacaoRelatorio
          isOpen={modalAvaliacaoAberto}
          relatorio={relatorioSelecionado}
          isLoading={enviandoAvaliacao}
          onClose={() => setModalAvaliacaoAberto(false)}
          onSubmit={async (avaliacao) => {
            setEnviandoAvaliacao(true)
            try {
              const payload = {
                status: avaliacao.status,
                feedback: avaliacao.feedback,
              }

              if (avaliacao.status === 'APROVADO') {
                payload.dataAprovacao = new Date().toISOString()
              }

              const { data: resultado } = await api.patch(
                `/relatorios/${relatorioSelecionado.id}`,
                payload
              )

              setRelatorioSelecionado(resultado.data || resultado)
              setModalAvaliacaoAberto(false)
              modal.showSuccess(`Relatório ${avaliacao.status.toLowerCase()} com sucesso!`)
            } catch (error) {
              modal.showError('Erro ao salvar avaliação: ' + (error.response?.data?.message || error.message))
            } finally {
              setEnviandoAvaliacao(false)
            }
          }}
        />
      </div>
    )}

    {currentPage === 'editar-relatorio' && (
      <div className="content-section">
        {carregandoRelatorio ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Carregando relatório para edição...</p>
          </div>
        ) : relatorioSelecionado ? (
          <>
            <div className="page-header">
              <button
                type="button"
                onClick={() => setCurrentPage('ver-relatorio')}
                className="back-link"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 className="page-title">Editar Relatório</h1>
                <p className="page-subtitle">
                  REL-{new Date(relatorioSelecionado.dataCriacao).getFullYear()}-
                  {String(relatorioSelecionado.id).padStart(3, '0')}
                </p>
              </div>
            </div>
            <ReportForm
              relatorioInicial={relatorioSelecionado}
              modoEdicao={true}
              onSubmitReport={async (dados) => {
                try {
                  const payload = {
                    formularioCIF: {
                      tipoCIF: dados.tipoCIF || 'CIF',
                      dataPreenchimento: dados.dataPreenchimento,
                      ultimaAlteracao: new Date().toISOString(),
                      condicaoSaude: dados.condicaoSaude || '',
                      condicaoSaudeDescricao: dados.condicaoSaudeDescricao,
                      factoresPessoais: dados.factoresPessoais || '',
                      planoTerapeutico: dados.planoTerapeutico || '',
                      observacoes: dados.observacoes || '',
                      itens: (Array.isArray(dados.itens) ? dados.itens : []).map((item) => {
                        const itemData = {
                          codigoCIF: item.codigoCIF || '',
                          descricao: item.descricao || item.nome || '',
                          categoria: item.categoria || 'FUNCAO',
                        }
                        if (item.nivel != null) itemData.nivel = item.nivel
                        if (item.qualificador1 != null) itemData.qualificador1 = item.qualificador1
                        if (item.tipoQualificador1) itemData.tipoQualificador1 = item.tipoQualificador1
                        if (item.qualificador2 != null) itemData.qualificador2 = item.qualificador2
                        if (item.qualificador3 != null) itemData.qualificador3 = item.qualificador3
                        if (item.qualificador4 != null) itemData.qualificador4 = item.qualificador4
                        if (item.observacao) itemData.observacao = item.observacao
                        return itemData
                      }),
                    },
                  }

                  const { data: resultado } = await api.patch(
                    `/relatorios/${relatorioSelecionado.id}`,
                    payload
                  )

                  modal.showSuccess('Relatório atualizado com sucesso!')
                  setRelatorioSelecionado(resultado.data || resultado)
                  setCurrentPage('ver-relatorio')
                } catch (error) {
                  modal.showError('Erro ao salvar alterações: ' + (error.response?.data?.message || error.message))
                }
              }}
            />
          </>
        ) : (
          <div className="empty-state">
            <p>Nenhum relatório selecionado para edição</p>
            <button
              type="button"
              onClick={() => setCurrentPage('relatorios')}
              className="btn btn-primary"
            >
              Voltar para lista
            </button>
          </div>
        )}
      </div>
    )}

    {currentPage === 'pacientes' && (
      <div className="content-section">
        <ListaPacientes
          escopo={escopoPacientes}
          onEscopoChange={setEscopoPacientes}
          onVerDetalhes={(pacienteId) => {
            setPacienteSelecionadoId(pacienteId)
            setCurrentPage('detalhes-paciente')
          }}
        />
      </div>
    )}

    {currentPage === 'detalhes-paciente' && pacienteSelecionadoId && (
      <div className="content-section">
        <DetalhesPaciente
          pacienteId={pacienteSelecionadoId}
          onVoltar={() => setCurrentPage('pacientes')}
        />
      </div>
    )}

    {currentPage === 'perfil' && (
      <div className="content-section">
        <div className="page-header">
          <h1 className="page-title">Perfil</h1>
          <p className="page-subtitle">Suas informações pessoais</p>
        </div>
        <div className="placeholder-message">
          <p>Página de perfil em desenvolvimento</p>
        </div>
      </div>
    )}
  </Layout>
)
}

export default Home
