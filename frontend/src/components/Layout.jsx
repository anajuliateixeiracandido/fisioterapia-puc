import { useState } from 'react'
import { Menu, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useModal } from '../contexts/ModalContext'
import { calcularIniciais } from '../utils/formatadores'
import SideBar from '../views/home/BarraLateral'
import Separator from '../views/geral/Separador'
import '../views/home/Home.css'

function Layout({ children, currentPage = '', onNavigate = () => {} }) {
const { user: dadosAuth, logout } = useAuth()
const modal = useModal()
const navigate = useNavigate()
const [isSidebarOpen, setIsSidebarOpen] = useState(false)
const nomeUsuario = (dadosAuth?.nomeCompleto || dadosAuth?.nome || dadosAuth?.email || 'Usuário').trim() || 'Usuário'

const user = dadosAuth
  ? {
      nome: nomeUsuario,
      role: dadosAuth.role,
      initials: calcularIniciais(nomeUsuario),
      coordenador: dadosAuth.coordenador,
    }
  : null

async function handleLogout() {
  const confirmado = await modal.showConfirm(
    'Tem certeza que deseja sair do sistema?',
    'Confirmar saída'
  )
  if (!confirmado) return
  await logout()
}

if (!user) return null

return (
  <div className="home-container">
    <div className={`sidebar-wrapper ${isSidebarOpen ? 'open' : ''}`}>
      <SideBar
        user={user}
        currentPage={currentPage}
        onNavigate={onNavigate}
        onClose={() => setIsSidebarOpen(false)}
      />
    </div>

    {isSidebarOpen && (
      <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
    )}

    <div className="main-content">
      <div className="header">
        <button className="menu-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <Menu size={24} />
        </button>
        <div className="header-spacer" />
        <div
          className="header-profile"
          onClick={() => navigate('/perfil')}
          style={{ cursor: 'pointer' }}
        >
          <div className="profile-name-wrapper">
            <div className="profile-name-small">{user.nome}</div>
            <div className="profile-role-badge">{user.role}</div>
          </div>
          <div className="profile-avatar-small">
            <span className="avatar-initials-small">{user.initials}</span>
          </div>
        </div>

        <button className="icon-button logout-button" onClick={handleLogout}>
          <LogOut size={20} />
        </button>
      </div>

      <Separator />

      {children}
    </div>
  </div>
)
}

export default Layout
