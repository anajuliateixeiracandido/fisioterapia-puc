import React, { useState } from 'react';
import { Menu, Bell, LogOut, ClipboardList, Clock, X, Check, Users } from 'lucide-react';
import SideBar from './BarraLateral';
import Separator from '../geral/Separador';
import { ListaRelatorios } from '../relatorio/ListaRelatorios'
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
  const [user] = useState({
    nome: 'João Paulo Silva',
    role: 'Aluno',
    initials: 'JP',
    matricula: '642110',
    curso: 'Fisioterapia'
  });

  const [hasNotifications] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [relatorioSeleccionado, setRelatorioSeleccionado] = useState(null)

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
              <h1 className="greeting-title">Olá, {user.nome.split(' ')[0]} 👋</h1>
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
              user={user}
              onVerRelatorio={(r) => {
                setRelatorioSeleccionado(r)
                setCurrentPage('ver-relatorio')
              }}
              onEditarRelatorio={(r) => {
                setRelatorioSeleccionado(r)
                setCurrentPage('editar-relatorio')
              }}
              onAvaliarRelatorio={(r) => {
                setRelatorioSeleccionado(r)
                setCurrentPage('avaliar-relatorio')
              }}
            />
          </div>
        )}

        {/* Placeholder — Ver relatório */}
        {currentPage === 'ver-relatorio' && relatorioSeleccionado && (
          <div className="content-section">
            <div className="page-header">
              <button
                type="button"
                onClick={() => setCurrentPage('relatorios')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontSize: '0.9rem' }}
              >
                ← Voltar
              </button>
              <h1 className="page-title">
                REL-{new Date(relatorioSeleccionado.dataCriacao).getFullYear()}-{String(relatorioSeleccionado.id).padStart(3, '0')}
              </h1>
              <p className="page-subtitle">
                Paciente: {relatorioSeleccionado.paciente?.nomeCompleto}
              </p>
            </div>
            <div className="placeholder-message">
              <p>Página de visualização do relatório em desenvolvimento</p>
            </div>
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