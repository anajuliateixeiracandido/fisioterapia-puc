import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Users,
  User,
  ChevronRight,
  X,
  ChevronLeft,
  UserPlus,
  GraduationCap,
  ArrowRightLeft,
} from 'lucide-react'
import Separator from '../geral/Separador'
import './BarraLateral.css'

const SideBar = ({ user, currentPage, onNavigate, onClose, isCollapsed = false, onToggleCollapse }) => {
  const [isMobile, setIsMobile] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const menuItems = [
    { icon: LayoutDashboard, text: 'Dashboard', page: 'dashboard' },
    { icon: FileText, text: 'Relatórios', page: 'relatorios' },
    ...(user?.role === 'PROFESSOR'
      ? [{ icon: GraduationCap, text: 'Alunos', route: '/alunos' }]
      : []),
    ...(user?.coordenador
      ? [
          { icon: UserPlus, text: 'Professores', route: '/professores' },
          { icon: ArrowRightLeft, text: 'Transferencia Coordenador', route: '/coordenadores/transferencia' },
        ]
      : []),
    { icon: Users, text: 'Pacientes', page: 'pacientes' },
    { icon: User, text: 'Perfil', route: '/perfil' },
  ]

  function handleItemClick(item) {
    if (item.route) {
      navigate(item.route)
    } else {
      if (location.pathname === '/') {
        onNavigate(item.page)
      } else {
        navigate('/', { state: { currentPage: item.page } })
      }
    }
  }

  function isActive(item) {
    if (item.route) return location.pathname === item.route
    return location.pathname === '/' && currentPage === item.page
  }

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <img src="/logo-puc.png" alt="Logo PUC Minas" width="40" height="40" />
          </div>
          {!isCollapsed && (
            <div className="logo-text">
              <div className="logo-title">Fisio PediÃ¡trica</div>
              <div className="logo-subtitle">PUC Minas</div>
            </div>
          )}
        </div>
        {isMobile && (
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        )}
        {!isMobile && onToggleCollapse && (
          <button
            className="collapse-button"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expandir' : 'Recolher'}
          >
            <ChevronLeft size={20} className={isCollapsed ? 'rotate' : ''} />
          </button>
        )}
      </div>

      <Separator paddingHorizontal={0} />

      <div className="sidebar-profile">
        <div className="profile-avatar">
          <span className="avatar-initials">{user?.initials || '?'}</span>
        </div>
        {!isCollapsed && (
          <div className="profile-info">
            <div className="profile-name">{user?.nome || ''}</div>
            <div className="profile-role">{user?.role || ''}</div>
          </div>
        )}
      </div>

      <Separator paddingHorizontal={0} />

      <nav className="sidebar-menu">
        {menuItems.map((item, index) => {
          const IconComponent = item.icon
          const active = isActive(item)
          return (
            <div
              key={index}
              className={`menu-item ${active ? 'active' : ''}`}
              onClick={() => handleItemClick(item)}
              title={isCollapsed ? item.text : ''}
            >
              <IconComponent size={20} className="menu-icon" />
              {!isCollapsed && (
                <>
                  <span className="menu-text">{item.text}</span>
                  <ChevronRight size={16} className="menu-arrow" />
                </>
              )}
            </div>
          )
        })}
      </nav>

      <div className="sidebar-spacer" />
      <Separator paddingHorizontal={0} />
      <div className="sidebar-version">VersÃ£o 1.0</div>
    </div>
  )
}

export default SideBar
