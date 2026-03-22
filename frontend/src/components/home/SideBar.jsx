
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, FileText, Users, User, ChevronRight, X } from 'lucide-react';
import Separator from '../geral/Separator';
import './SideBar.css';

const SideBar = ({ user, currentPage, onNavigate, onClose }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { icon: LayoutDashboard, text: 'Dashboard', page: 'dashboard' },
    { icon: FileText, text: 'Relatórios', page: 'relatorios' },
    { icon: Users, text: 'Pacientes', page: 'pacientes' },
    { icon: User, text: 'Perfil', page: 'perfil' },
  ];

  return (
    <div className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18" fill="white" fillOpacity="0.2"/>
              <path d="M20 12 L20 28 M12 20 L28 20" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="logo-text">
            <div className="logo-title">Fisio Pediátrica</div>
            <div className="logo-subtitle">PUC Minas</div>
          </div>
        </div>
        {isMobile && (
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        )}
      </div>

      <Separator paddingHorizontal={0} />

      {/* User Profile */}
      <div className="sidebar-profile">
        <div className="profile-avatar">
          <span className="avatar-initials">{user?.initials || 'JP'}</span>
        </div>
        <div className="profile-info">
          <div className="profile-name">{user?.nome || 'João Paulo Silva'}</div>
          <div className="profile-role">{user?.role || 'Aluno'}</div>
        </div>
      </div>

      <Separator paddingHorizontal={0} />

      {/* Menu Items */}
      <nav className="sidebar-menu">
        {menuItems.map((item, index) => {
          const IconComponent = item.icon;
          const isActive = currentPage === item.page;
          return (
            <div 
              key={index} 
              className={`menu-item ${isActive ? 'active' : ''}`}
              onClick={() => onNavigate(item.page)}
            >
              <IconComponent size={20} className="menu-icon" />
              <span className="menu-text">{item.text}</span>
              <ChevronRight size={16} className="menu-arrow" />
            </div>
          );
        })}
      </nav>

      <div className="sidebar-spacer" />

      <Separator paddingHorizontal={0} />

      {/* Version */}
      <div className="sidebar-version">Versão 1.0</div>
    </div>
  );
};

export default SideBar;