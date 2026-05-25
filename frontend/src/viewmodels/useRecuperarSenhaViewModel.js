import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

function useRecuperarSenhaViewModel() {
const navigate = useNavigate()

const [email, setEmail] = useState('')
const [enviado, setEnviado] = useState(false)
const [carregando, setCarregando] = useState(false)
const [erro, setErro] = useState(null)

async function handleSubmit(e) {
  e.preventDefault()
  setErro(null)
  setCarregando(true)

  try {
    await api.post('/auth/forgot-password', { email })
    setEnviado(true)
  } catch (err) {
    const code = err.response?.data?.code
    if (code === 'VALIDATION_ERROR') {
      setErro(err.response.data.errors[0]?.message)
    } else {
      setErro('Erro ao processar solicitação. Tente novamente.')
    }
  } finally {
    setCarregando(false)
  }
}

function voltarParaLogin() {
  navigate('/login')
}

return {
  email,
  setEmail,
  enviado,
  carregando,
  erro,
  handleSubmit,
  voltarParaLogin,
}
}

export default useRecuperarSenhaViewModel