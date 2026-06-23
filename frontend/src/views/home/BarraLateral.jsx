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
      {/* resto do componente igual */}
    </div>
  )
}

export default SideBar