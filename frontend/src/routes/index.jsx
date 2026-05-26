import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Home from '../views/home/Home'
import Login from '../views/auth/login'
import RecuperarSenha from '../views/auth/RecuperarSenha'
import RedefinirSenha from '../views/auth/RedefinirSenha'
import CadastroProfessor from '../views/professor/CadastroProfessor'
import ListaProfessores from '../views/professor/ListaProfessores'
import CadastroAluno from '../views/aluno/CadastroAluno'
import Perfil from '../views/perfil/Perfil'

function RotaProtegida({ children, apenasCoordenador, apenasRole }) {
const { user, carregando } = useAuth()

if (carregando) return null
if (!user) return <Navigate to="/login" replace />
if (apenasCoordenador && !user.coordenador) return <Navigate to="/" replace />
if (apenasRole && user.role !== apenasRole) return <Navigate to="/" replace />

return children
}

function RotaPublica({ children }) {
const { user, carregando } = useAuth()

if (carregando) return null
if (user) return <Navigate to="/" replace />

return children
}

function Rotas() {
return (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<RotaPublica><Login /></RotaPublica>} />
      <Route path="/recuperar-senha" element={<RotaPublica><RecuperarSenha /></RotaPublica>} />
      <Route path="/reset-password" element={<RotaPublica><RedefinirSenha /></RotaPublica>} />

      <Route path="/" element={<RotaProtegida><Home /></RotaProtegida>} />

      <Route
        path="/professores"
        element={<RotaProtegida apenasCoordenador><ListaProfessores /></RotaProtegida>}
      />

      <Route
        path="/professores/cadastro"
        element={<RotaProtegida apenasCoordenador><CadastroProfessor /></RotaProtegida>}
      />

      <Route
        path="/alunos/cadastro"
        element={<RotaProtegida apenasRole="PROFESSOR"><CadastroAluno /></RotaProtegida>}
      />

      <Route
        path="/perfil"
        element={<RotaProtegida><Perfil /></RotaProtegida>}
      />
    </Routes>
  </BrowserRouter>
)
}

export default Rotas
