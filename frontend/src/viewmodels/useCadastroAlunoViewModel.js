import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useModal } from '../contexts/ModalContext'

function useCadastroAlunoViewModel() {
const navigate = useNavigate()
const modal = useModal()

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
    modal.showSuccess('Aluno cadastrado com sucesso!')
    navigate('/alunos')
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

function voltar() {
  navigate('/alunos')
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
  handleSubmit,
  voltar,
}
}

export default useCadastroAlunoViewModel
