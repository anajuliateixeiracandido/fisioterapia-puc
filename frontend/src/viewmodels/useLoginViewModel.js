import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function useLoginViewModel() {
const { login } = useAuth()
const navigate = useNavigate()

const [email, setEmail] = useState('')
const [senha, setSenha] = useState('')
const [mostrarSenha, setMostrarSenha] = useState(false)
const [erro, setErro] = useState(null)
const [carregando, setCarregando] = useState(false)

async function handleSubmit(e) {
  e.preventDefault()
  setErro(null)
  setCarregando(true)

  try {
    await login(email, senha)
    navigate('/')
  } catch (err) {
    const code = err.response?.data?.code

    if (code === 'CREDENCIAIS_INVALIDAS') {
      setErro('E-mail ou senha incorretos')
    } else if (code === 'VALIDATION_ERROR') {
      setErro(err.response.data.errors[0]?.message)
    } else {
      setErro('Erro ao fazer login. Tente novamente.')
    }
  } finally {
    setCarregando(false)
  }
}

function navegarParaRecuperarSenha() {
  navigate('/recuperar-senha')
}

return {
  email,
  setEmail,
  senha,
  setSenha,
  mostrarSenha,
  setMostrarSenha,
  erro,
  carregando,
  handleSubmit,
  navegarParaRecuperarSenha,
}
}

export default useLoginViewModel