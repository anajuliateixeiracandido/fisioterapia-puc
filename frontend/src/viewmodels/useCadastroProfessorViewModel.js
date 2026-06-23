import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

function useCadastroProfessorViewModel() {
const navigate = useNavigate()

const [nomeCompleto, setNomeCompleto] = useState('')
const [email, setEmail] = useState('')
const [senha, setSenha] = useState('')
const [confirmarSenha, setConfirmarSenha] = useState('')
const [codigoPessoa, setCodigoPessoa] = useState('')
const [mostrarSenha, setMostrarSenha] = useState(false)
const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false)
const [carregando, setCarregando] = useState(false)
const [erro, setErro] = useState(null)
const [sucesso, setSucesso] = useState(false)

async function handleSubmit(e) {
  e.preventDefault()
  setErro(null)

  if (senha !== confirmarSenha) {
    setErro('As senhas não coincidem.')
    return
  }

  setCarregando(true)

  try {
    await api.post('/fisioterapeuta', {
      role: 'PROFESSOR',
      nomeCompleto,
      email,
      senha,
      codigoPessoa,
    })
    setSucesso(true)
  } catch (err) {
    const code = err.response?.data?.code
    if (code === 'ALREADY_EXISTS') {
      setErro('Já existe um cadastro com este e-mail.')
    } else if (code === 'VALIDATION_ERROR') {
      setErro(err.response.data.errors[0]?.message)
    } else {
      setErro('Erro ao cadastrar professor. Tente novamente.')
    }
  } finally {
    setCarregando(false)
  }
}

function cadastrarNovo() {
  setNomeCompleto('')
  setEmail('')
  setSenha('')
  setConfirmarSenha('')
  setCodigoPessoa('')
  setSucesso(false)
  setErro(null)
}

function voltar() {
  navigate('/professores')
}

return {
  nomeCompleto, setNomeCompleto,
  email, setEmail,
  senha, setSenha,
  confirmarSenha, setConfirmarSenha,
  codigoPessoa, setCodigoPessoa,
  mostrarSenha, setMostrarSenha,
  mostrarConfirmarSenha, setMostrarConfirmarSenha,
  carregando,
  erro,
  sucesso,
  handleSubmit,
  cadastrarNovo,
  voltar,
}
}

export default useCadastroProfessorViewModel
