import React, { useState } from 'react';
import { Menu, Bell, LogOut, ClipboardList, Clock, X, Check, Users, Pencil, Trash2 } from 'lucide-react';
import SideBar from './BarraLateral';
import Separator from '../geral/Separador';
import { ListaRelatorios } from '../relatorio/ListaRelatorios'
import { VisualizacaoRelatorio } from '../relatorio/VisualizacaoRelatorio'
import { ReportForm } from '../relatorio/FormularioRelatorio'
import { useModal } from '../../contexts/ModalContext'
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
  const [user] = useState({
    nome: 'Maria Oliveira',
    role: 'ALUNO',
    initials: 'MO',
    matricula: 'ALU2024001',
    curso: 'Fisioterapia',
    fisioterapeutaId: 2 // ID da aluna
  });

  // MOCK PROFESSOR - Prof. Dr. João Silva (COMENTADO)
  // const [user] = useState({
  //   nome: 'Prof. Dr. João Silva',
  //   role: 'PROFESSOR',
  //   initials: 'JS',
  //   codigoPessoa: 'PROF001',
  //   curso: 'Fisioterapia',
  //   fisioterapeutaId: 1 // ID do professor
  // });

  const [hasNotifications] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [relatorioSeleccionado, setRelatorioSeleccionado] = useState(null)
  const [relatorioCompleto, setRelatorioCompleto] = useState(null)
  const [carregandoRelatorio, setCarregandoRelatorio] = useState(false)

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
                setRelatorioSeleccionado(r)
                setCurrentPage('ver-relatorio')
              }}
            />
          </div>
        )}

        {/* Visualização de relatório */}
        {currentPage === 'ver-relatorio' && relatorioSeleccionado && (
          <div className="content-section">
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <button
                type="button"
                onClick={() => setCurrentPage('relatorios')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontSize: '0.9rem' }}
              >
                ← Voltar para lista de relatórios
              </button>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {/* Botão Editar - apenas se o usuário pode editar */}
                {(() => {
                  const isProfessor = user?.role === 'PROFESSOR'
                  const isAluno = user?.role === 'ALUNO'
                  const isAutor = relatorioSeleccionado.fisioterapeuta?.id === user?.fisioterapeutaId
                  const isAprovado = relatorioSeleccionado.status === 'APROVADO'
                  const podeEditar = (isProfessor || (isAluno && isAutor)) && !isAprovado
                  
                  return podeEditar && (
                    <button
                      type="button"
                      onClick={async () => {
                        // Buscar relatório completo do backend antes de editar
                        setCarregandoRelatorio(true)
                        try {
                          const token = localStorage.getItem('accessToken')
                          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/relatorios/${relatorioSeleccionado.id}`, {
                            headers: {
                              'Content-Type': 'application/json',
                              ...(token ? { Authorization: `Bearer ${token}` } : {}),
                            },
                          })

                          if (!response.ok) {
                            throw new Error('Erro ao carregar relatório')
                          }

                          const data = await response.json()
                          const relatorioCompleto = data.data || data
                          
                          setRelatorioCompleto(relatorioCompleto)
                          setCurrentPage('editar-relatorio')
                        } catch (error) {
                          console.error('Erro ao carregar relatório:', error)
                          modal.showError('Erro ao carregar relatório para edição')
                        } finally {
                          setCarregandoRelatorio(false)
                        }
                      }}
                      disabled={carregandoRelatorio}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        opacity: carregandoRelatorio ? 0.6 : 1,
                        cursor: carregandoRelatorio ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <Pencil size={16} />
                      {carregandoRelatorio ? 'Carregando...' : 'Editar'}
                    </button>
                  )
                })()}
                {/* Botão Deletar - apenas ícone */}
                {(() => {
                  const isProfessor = user?.role === 'PROFESSOR'
                  const isAluno = user?.role === 'ALUNO'
                  const isAutor = relatorioSeleccionado.fisioterapeuta?.id === user?.fisioterapeutaId
                  const isAprovado = relatorioSeleccionado.status === 'APROVADO'
                  const podeDeletar = (isProfessor || (isAluno && isAutor)) && !isAprovado
                  
                  return podeDeletar && (
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
                          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/relatorios/${relatorioSeleccionado.id}`, {
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
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0.5rem',
                        background: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                      title="Deletar relatório"
                    >
                      <Trash2 size={16} />
                    </button>
                  )
                })()}
              </div>
            </div>
            <VisualizacaoRelatorio 
              relatorio={relatorioSeleccionado} 
              user={user}
              onVisualizarPaciente={(paciente) => {
                // TODO: Implementar visualização de detalhes do paciente
                console.log('Visualizar paciente:', paciente)
                modal.showInfo(
                  `TODO: Implementar tela de detalhes do paciente\n\nPaciente: ${paciente.nomeCompleto}\nCódigo: ${paciente.codigo}`,
                  'Funcionalidade em desenvolvimento'
                )
              }}
            />
          </div>
        )}

        {/* Editar relatório */}
        {currentPage === 'editar-relatorio' && (
          <div className="content-section">
            {carregandoRelatorio ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '1rem' }}>
                <div className="loading-spinner"></div>
                <p>Carregando relatório para edição...</p>
              </div>
            ) : relatorioCompleto ? (
              <>
                <div className="page-header">
                  <button
                    type="button"
                    onClick={() => {
                      setRelatorioCompleto(null)
                      setCurrentPage('ver-relatorio')
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontSize: '0.9rem' }}
                  >
                    ← Voltar para visualização
                  </button>
                  <h1 className="page-title">Editar Relatório</h1>
                  <p className="page-subtitle">
                    REL-{new Date(relatorioCompleto.dataCriacao).getFullYear()}-{String(relatorioCompleto.id).padStart(3, '0')}
                  </p>
                </div>
                <ReportForm 
              relatorioInicial={relatorioCompleto}
              modoEdicao={true}
              onSubmitReport={async (dados) => {
                try {
                  const token = localStorage.getItem('accessToken')
                  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/relatorios/${relatorioCompleto.id}`, {
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
                      }
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
                  setRelatorioCompleto(resultado.data || resultado)
                  setCurrentPage('ver-relatorio')
                } catch (error) {
                  console.error('Erro ao editar relatório:', error)
                  modal.showError('Erro ao salvar alterações: ' + error.message)
                }
              }}
            />
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '1rem' }}>
                <p>Nenhum relatório selecionado para edição</p>
                <button
                  type="button"
                  onClick={() => setCurrentPage('relatorios')}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer'
                  }}
                >
                  Voltar para lista
                </button>
              </div>
            )}
          </div>
        )}

        {/* Placeholder — Avaliar relatório */}
        {currentPage === 'avaliar-relatorio' && relatorioSeleccionado && (
          <div className="content-section">
            <div className="page-header">
              <button
                type="button"
                onClick={() => setCurrentPage('relatorios')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontSize: '0.9rem' }}
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