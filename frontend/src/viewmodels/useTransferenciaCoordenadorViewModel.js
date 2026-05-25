import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useModal } from '../contexts/ModalContext'
import api from '../services/api'

function lerUsuarioLocalStorage() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}')
  } catch {
    return {}
  }
}

function formatarProfessor(professor) {
  const codigo = professor.codigoPessoa || 'Sem codigo'
  const nome = professor.fisioterapeuta?.nomeCompleto || 'Nome nao informado'
  return `${codigo} - ${nome}`
}

function useTransferenciaCoordenadorViewModel() {
  const navigate = useNavigate()
  const modal = useModal()
  const { user, atualizarUser } = useAuth()

  const usuarioLocal = lerUsuarioLocalStorage()
  const coordenadorId = user?.fisioterapeutaId ?? usuarioLocal.fisioterapeutaId

  const [professores, setProfessores] = useState([])
  const [novoCoordenadorId, setNovoCoordenadorId] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    let ativo = true

    async function carregarProfessores() {
      setCarregando(true)
      setErro(null)

      try {
        const { data } = await api.get('/professores')
        if (ativo) setProfessores(Array.isArray(data) ? data : [])
      } catch {
        if (ativo) setErro('Erro ao carregar professores.')
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    carregarProfessores()

    return () => {
      ativo = false
    }
  }, [])

  const novoCoordenador = useMemo(
    () => professores.find((professor) => String(professor.fisioterapeutaId) === novoCoordenadorId),
    [professores, novoCoordenadorId]
  )

  async function transferirCoordenador(e) {
    e.preventDefault()
    setErro(null)

    if (!coordenadorId) {
      setErro('Nao foi possivel identificar o coordenador atual.')
      return
    }

    if (!novoCoordenador) {
      setErro('Selecione o novo coordenador.')
      return
    }

    const confirmado = await modal.showConfirm(
      `Tem certeza que deseja transferir o seu cargo de coordenador para ${formatarProfessor(novoCoordenador)}?`,
      'Transferir coordenador'
    )

    if (!confirmado) return

    setEnviando(true)

    try {
      await api.patch('/coordenadores', {
        coordenadorId,
        novoCoordenadorId: novoCoordenador.fisioterapeutaId,
      })

      atualizarUser({ coordenador: false })
      modal.showSuccess('Cargo de coordenador transferido com sucesso.')
      navigate('/')
    } catch (err) {
      const code = err.response?.data?.code
      if (code === 'COORDENADOR_IGUAL') {
        setErro('Selecione um professor diferente do coordenador atual.')
      } else if (code === 'COORDENADOR_ID_INVALIDO') {
        setErro('Identificadores de coordenador invalidos.')
      } else if (code === 'COORDENADOR_ATUAL_INVALIDO') {
        setErro('O professor atual nao esta marcado como coordenador.')
      } else if (code === 'NOVO_COORDENADOR_NOT_FOUND') {
        setErro('Novo coordenador nao encontrado.')
      } else if (code === 'FORBIDDEN') {
        setErro('Apenas coordenadores podem transferir o cargo.')
      } else {
        setErro('Erro ao transferir coordenador. Tente novamente.')
      }
    } finally {
      setEnviando(false)
    }
  }

  function voltar() {
    navigate('/')
  }

  return {
    professores,
    novoCoordenador,
    novoCoordenadorId,
    setNovoCoordenadorId,
    coordenadorId,
    carregando,
    enviando,
    erro,
    formatarProfessor,
    transferirCoordenador,
    voltar,
  }
}

export default useTransferenciaCoordenadorViewModel
