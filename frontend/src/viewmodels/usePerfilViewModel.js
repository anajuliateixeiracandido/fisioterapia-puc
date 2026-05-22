import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

function usePerfilViewModel() {
const navigate = useNavigate()
const { atualizarUser } = useAuth()

const [nomeCompleto, setNomeCompleto] = useState('')
const [perfil, setPerfil] = useState(null)
const [carregandoPerfil, setCarregandoPerfil] = useState(true)
const [carregando, setCarregando] = useState(false)
const [erro, setErro] = useState(null)
const [sucesso, setSucesso] = useState(false)

useEffect(() => {
  api
    .get('/me')
    .then(({ data }) => {
      setPerfil(data)
      setNomeCompleto(data.nomeCompleto)
    })
    .catch(() => {})
    .finally(() => setCarregandoPerfil(false))
}, [])

async function handleSubmit(e) {
  e.preventDefault()
  setErro(null)
  setSucesso(false)
  setCarregando(true)

  try {
    const { data } = await api.patch('/me', { nomeCompleto })
    setPerfil(data)
    atualizarUser({ nomeCompleto: data.nomeCompleto })
    setSucesso(true)
  } catch (err) {
    const code = err.response?.data?.code
    if (code === 'VALIDATION_ERROR') {
      setErro(err.response.data.errors[0]?.message)
    } else {
      setErro('Erro ao atualizar perfil. Tente novamente.')
    }
  } finally {
    setCarregando(false)
  }
}

function voltar() {
  navigate('/')
}

return {
  perfil,
  nomeCompleto,
  setNomeCompleto,
  carregandoPerfil,
  carregando,
  erro,
  sucesso,
  handleSubmit,
  voltar,
}
}

export default usePerfilViewModel