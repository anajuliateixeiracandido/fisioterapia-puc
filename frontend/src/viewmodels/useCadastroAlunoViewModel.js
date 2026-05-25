import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

function useCadastroAlunoViewModel() {
const navigate = useNavigate()

const [nomeCompleto, setNomeCompleto] = useState('')
const [email, setEmail] = useState('')
const [senha, setSenha] = useState('')
const [confirmarSenha, setConfirmarSenha] = useState('')
const [matricula, setMatricula] = useState('')
const [professorSelecionado, setProfessorSelecionado] = useState('')
const [professores, setProfessores] = useState([])
const [carregandoProfessores, setCarregandoProfessores] = useState(true)
const [mostrarSenha, setMostrarSenha] = useState(false)
const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false)
const [carregando, setCarregando] = useState(false)
const [erro, setErro] = useState(null)
const [sucesso, setSucesso] = useState(false)

useEffect(() => {
  api
    .get('/professores')
    .then(({ data }) => setProfessores(data))
    .catch(() => setProfessores([]))
    .finally(() => setCarregandoProfessores(false))
}, [])

async function handleSubmit(e) {
  e.preventDefault()
  setErro(null)

  if (senha !== confirmarSenha) {
    setErro('As senhas não coincidem.')
    return
  }

  if (matricula.length < 5) {
    setErro('Matrícula deve ter entre 5 e 10 dígitos.')
    return
  }

  if (!professorSelecionado) {
    setErro('Selecione um professor responsável.')
    return
  }

  setCarregando(true)

  try {
    await api.post('/fisioterapeuta', {
      role: 'ALUNO',
      nomeCompleto,
      email,
      senha,
      matricula,
      codigoPessoaProfessor: professorSelecionado,
    })
    setSucesso(true)
  } catch (err) {
    const code = err.response?.data?.code
    if (code === 'ALREADY_EXISTS') {
      setErro('Já existe um cadastro com este e-mail.')
    } else if (code === 'VALIDATION_ERROR') {
      setErro(err.response.data.errors[0]?.message)
    } else if (code === 'PROFESSOR_NOT_FOUND') {
      setErro('Professor não encontrado.')
    } else {
      setErro('Erro ao cadastrar aluno. Tente novamente.')
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
  setMatricula('')
  setProfessorSelecionado('')
  setSucesso(false)
  setErro(null)
}

function voltar() {
  navigate('/')
}

return {
  nomeCompleto, setNomeCompleto,
  email, setEmail,
  senha, setSenha,
  confirmarSenha, setConfirmarSenha,
  matricula, setMatricula,
  professorSelecionado, setProfessorSelecionado,
  professores,
  carregandoProfessores,
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

export default useCadastroAlunoViewModel