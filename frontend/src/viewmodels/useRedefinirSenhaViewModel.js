import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'

function useRedefinirSenhaViewModel() {
const navigate = useNavigate()
const [searchParams] = useSearchParams()
const token = searchParams.get('token')

const [novaSenha, setNovaSenha] = useState('')
const [confirmarSenha, setConfirmarSenha] = useState('')
const [mostrarSenha, setMostrarSenha] = useState(false)
const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false)
const [carregando, setCarregando] = useState(false)
const [erro, setErro] = useState(null)
const [sucesso, setSucesso] = useState(false)

async function handleSubmit(e) {
  e.preventDefault()
  setErro(null)

  if (!token) {
    setErro('Token inválido. Solicite um novo link de redefinição.')
    return
  }

  if (novaSenha !== confirmarSenha) {
    setErro('As senhas não coincidem.')
    return
  }

  setCarregando(true)

  try {
    await api.post('/auth/reset-password', { token, novaSenha })
    setSucesso(true)
    setTimeout(() => navigate('/login'), 3000)
  } catch (err) {
    const code = err.response?.data?.code
    if (code === 'TOKEN_INVALIDO') {
      setErro('Link inválido ou expirado. Solicite um novo link.')
    } else if (code === 'VALIDATION_ERROR') {
      setErro(err.response.data.errors[0]?.message)
    } else {
      setErro('Erro ao redefinir senha. Tente novamente.')
    }
  } finally {
    setCarregando(false)
  }
}

function voltarParaLogin() {
  navigate('/login')
}

return {
  novaSenha,
  setNovaSenha,
  confirmarSenha,
  setConfirmarSenha,
  mostrarSenha,
  setMostrarSenha,
  mostrarConfirmarSenha,
  setMostrarConfirmarSenha,
  carregando,
  erro,
  sucesso,
  token,
  handleSubmit,
  voltarParaLogin,
}
}

export default useRedefinirSenhaViewModel