import React, { useState } from 'react';
import { Menu, Bell, LogOut, ClipboardList, Clock, X, Check, Users, Pencil, Trash2, CheckCircle } from 'lucide-react';
import SideBar from './BarraLateral';
import Separator from '../geral/Separador';
import { ListaRelatorios } from '../relatorio/ListaRelatorios'
import { VisualizacaoRelatorio } from '../relatorio/VisualizacaoRelatorio'
import { ReportForm } from '../relatorio/FormularioRelatorio'
import { ModalAvaliacaoRelatorio } from '../relatorio/ModalAvaliacaoRelatorio'
import { useModal } from '../../contexts/ModalContext'
import { podeEditarRelatorio, podeDeletarRelatorio, podeAvaliarRelatorio } from '../../utils/permissoes'
import { avaliarRelatorio, obterRelatorio } from '../../services/relatorioService'
import './Home.css';

const StatCard = ({ icon: Icon, label, value, colorClass }) => (
  <div className="stat-card">
    <div className={`stat-icon ${colorClass}`}>
      <Icon size={24} />
    </div>
    <div className="stat-content">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  </div>
);

const Home = () => {
  const modal = useModal()
  
  // MOCK ALUNA - Maria Oliveira (ATIVO)
  // const [user] = useState({
  //   nome: 'Maria Oliveira',
  //   role: 'ALUNO',
  //   initials: 'MO',
  //   matricula: 'ALU2024001',
  //   curso: 'Fisioterapia',
  //   fisioterapeutaId: 2 // ID da aluna
  // });

  // MOCK PROFESSOR - Profa. Maria Santos (ATIVO)
  const [user] = useState({
    nome: 'Profa. Maria Santos',
    role: 'PROFESSOR',
    initials: 'MS',
    codigoPessoa: 'PROF001',
    curso: 'Fisioterapia',
    fisioterapeutaId: 1, // ID do professor
    coordenador: false, // Mudar para true para testar coordenador
  });

  const [hasNotifications] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [relatorioSelecionado, setRelatorioSelecionado] = useState(null)
  const [carregandoRelatorio, setCarregandoRelatorio] = useState(false)
  const [modalAvaliacaoAberto, setModalAvaliacaoAberto] = useState(false)
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false)

  const navigateTo = (page) => setCurrentPage(page);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const stats = [
    { icon: ClipboardList, label: 'Total de relatórios', value: 3, colorClass: 'stat-blue' },
    { icon: Clock, label: 'Aguardando aprovação', value: 1, colorClass: 'stat-yellow' },
    { icon: X, label: 'Negados', value: 0, colorClass: 'stat-red' },
    { icon: Check, label: 'Aprovados', value: 1, colorClass: 'stat-green' },
  ];

  return (
    <div className="home-container">
      <div className={`sidebar-wrapper ${isSidebarOpen ? 'open' : ''}`}>
        <SideBar
          user={user}
          currentPage={currentPage}
          onNavigate={navigateTo}
          onClose={closeSidebar}
        />
      </div>

      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}

      <div className="main-content">
        <div className="header">
          <button className="menu-toggle" onClick={toggleSidebar}>
            <Menu size={24} />
          </button>
          <div className="header-spacer" />

          <button className="icon-button notification-button">
            <Bell size={20} />
            {hasNotifications && <span className="notification-badge"></span>}
          </button>

          <div className="header-profile">
            <div className="profile-name-wrapper">
              <div className="profile-name-small">{user.nome}</div>
              <div className="profile-role-badge">{user.role}</div>
            </div>
            <div className="profile-avatar-small">
              <span className="avatar-initials-small">{user.initials}</span>
            </div>
          </div>

          <button className="icon-button logout-button">
            <LogOut size={20} />
          </button>
        </div>

        <Separator />

        {currentPage === 'dashboard' && (
          <div className="content-section">
            <div className="greeting-section">
              <h1 className="greeting-title">Olá, {user.nome.split(' ')[0]}</h1>
              <p className="greeting-subtitle">Matrícula: {user.matricula} · {user.curso}</p>
            </div>

            <div className="stats-grid">
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

            <div className="patients-card">
              <div className="stat-icon stat-purple">
                <Users size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-label">Meus pacientes</div>
                <div className="stat-value">3</div>
              </div>
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
            <div className="page-header">
              <div>
                <button
                  type="button"
                  onClick={() => setCurrentPage('relatorios')}
                  className="back-link"
                >
                  ← Voltar para lista de relatórios
                </button>
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
                      } catch (error) {
                        modal.showError('Erro ao carregar relatório para edição')
                      } finally {
                        setCarregandoRelatorio(false)
                      }
                    }}
                    disabled={carregandoRelatorio}
                    className="btn btn-primary"
                  >
                    <Pencil size={16} />
                    {carregandoRelatorio ? 'Carregando...' : 'Editar'}
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
                        const token = localStorage.getItem('accessToken')
                        const response = await fetch(
                          `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/relatorios/${relatorioSelecionado.id}`,
                          {
                            method: 'DELETE',
                            headers: {
                              'Content-Type': 'application/json',
                              ...(token ? { Authorization: `Bearer ${token}` } : {}),
                            },
                          }
                        )

                        if (!response.ok) {
                          const error = await response.json()
                          throw new Error(error.message || 'Erro ao deletar relatório')
                        }

                        modal.showSuccess('Relatório deletado com sucesso!')
                        setRelatorioSelecionado(null)
                        setCurrentPage('relatorios')
                      } catch (error) {
                        modal.showError('Erro ao deletar relatório: ' + error.message)
                      }
                    }}
                    className="btn btn-danger"
                    title="Deletar relatório"
                  >
                    <Trash2 size={16} />
                  </button>
                )}

                {podeAvaliarRelatorio(relatorioSelecionado, user) && (
                  <button
                    type="button"
                    onClick={() => setModalAvaliacaoAberto(true)}
                    disabled={enviandoAvaliacao}
                    className="btn btn-success"
                  >
                    <CheckCircle size={16} />
                    {enviandoAvaliacao ? 'Enviando...' : 'Avaliar'}
                  </button>
                )}
              </div>
              </div>
            </div>

            <VisualizacaoRelatorio 
              relatorio={relatorioSelecionado} 
              user={user}
              onVisualizarPaciente={(paciente) => {
                // TODO: Redirecionar para página de detalhes do paciente
              }}
            />

            <ModalAvaliacaoRelatorio
              isOpen={modalAvaliacaoAberto}
              relatorio={relatorioSelecionado}
              isLoading={enviandoAvaliacao}
              onClose={() => setModalAvaliacaoAberto(false)}
              onSubmit={async (avaliacao) => {
                setEnviandoAvaliacao(true)
                try {
                  const token = localStorage.getItem('accessToken')
                  const payload = {
                    status: avaliacao.status,
                    feedback: avaliacao.feedback,
                  }
                  
                  if (avaliacao.status === 'APROVADO') {
                    payload.dataAprovacao = new Date().toISOString()
                  }
                  
                  const response = await fetch(
                    `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/relatorios/${relatorioSelecionado.id}`,
                    {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                      },
                      body: JSON.stringify(payload),
                    }
                  )
                  
                  if (!response.ok) {
                    const error = await response.json()
                    throw new Error(error.message || JSON.stringify(error.errors || error))
                  }
                  
                  const resultado = await response.json()
                  const relatorioAtualizado = resultado.data || resultado
                  
                  setRelatorioSelecionado(relatorioAtualizado)
                  setModalAvaliacaoAberto(false)
                  
                  modal.showSuccess(`Relatório ${avaliacao.status.toLowerCase()} com sucesso!`)
                  
                  setTimeout(() => {
                    window.location.reload()
                  }, 1500)
                  
                } catch (error) {
                  modal.showError('Erro ao salvar avaliação: ' + error.message)
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
                    onClick={() => {
                      setCurrentPage('ver-relatorio')
                    }}
                    className="back-link"
                  >
                    ← Voltar para visualização
                  </button>
                  <div>
                    <h1 className="page-title">Editar Relatório</h1>
                    <p className="page-subtitle">
                      REL-{new Date(relatorioSelecionado.dataCriacao).getFullYear()}-{String(relatorioSelecionado.id).padStart(3, '0')}
                    </p>
                  </div>
                </div>
                <ReportForm 
                  relatorioInicial={relatorioSelecionado}
                  modoEdicao={true}
                  onSubmitReport={async (dados) => {
                    try {
                      const token = localStorage.getItem('accessToken')
                      
                      const payload = {
                        formularioCIF: {
                          tipoCIF: dados.tipoCIF || 'CIF',
                          dataPreenchimento: dados.dataPreenchimento,
                          ultimaAlteracao: new Date().toISOString(),
                          condicaoSaude: dados.condicaoSaude || '',
                          condicaoSaudeDescricao: dados.condicaoSaudeDescricao,
                          factoresPessoais: dados.factoresPessoais || '',
                          planoTerapeutico: dados.planoTerapeutico || '',
                          observacoes: '',
                          itens: (Array.isArray(dados.itens) ? dados.itens : []).map(item => {
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
                        }
                      }
                      
                      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/relatorios/${relatorioSelecionado.id}`, {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                          ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                        body: JSON.stringify(payload),
                      })

                      if (!response.ok) {
                        const error = await response.json()
                        throw new Error(error.message || JSON.stringify(error.errors || error))
                      }

                      const resultado = await response.json()
                      modal.showSuccess('Relatório atualizado com sucesso!')
                      
                      setRelatorioSelecionado(resultado.data || resultado)
                      setCurrentPage('ver-relatorio')
                    } catch (error) {
                      modal.showError('Erro ao salvar alterações: ' + error.message)
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

        {currentPage === 'avaliar-relatorio' && relatorioSelecionado && (
          <div className="content-section">
            <div className="page-header">
              <button
                type="button"
                onClick={() => setCurrentPage('relatorios')}
                className="back-link"
              >
                ← Voltar
              </button>
              <h1 className="page-title">Avaliar Relatório</h1>
            </div>
            <div className="placeholder-message">
              <p>Página de avaliação em desenvolvimento</p>
            </div>
          </div>
        )}

        {currentPage === 'pacientes' && (
          <div className="content-section">
            <div className="page-header">
              <h1 className="page-title">Pacientes</h1>
              <p className="page-subtitle">Gerenciar pacientes</p>
            </div>
            <div className="placeholder-message">
              <p>Página de pacientes em desenvolvimento</p>
            </div>
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
      </div>
    </div>
  );
};

export default Home;