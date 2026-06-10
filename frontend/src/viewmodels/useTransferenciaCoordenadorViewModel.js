import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useModal } from '../contexts/ModalContext'
import api from '../services/api'

const LIMITE_PROFESSORES_TRANSFERENCIA = 10

function formatarProfessor(professor) {
  const codigo = professor.codigoPessoa || 'Sem codigo'
  const nome = professor.fisioterapeuta?.nomeCompleto || 'Nome nao informado'
  return `${codigo} - ${nome}`
}

function useTransferenciaCoordenadorViewModel() {
  const navigate = useNavigate()
  const modal = useModal()
  const { atualizarUser } = useAuth()

  const [professores, setProfessores] = useState([])
  const [novoCoordenadorId, setNovoCoordenadorId] = useState('')
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [totalProfessores, setTotalProfessores] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [carregandoMais, setCarregandoMais] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    let ativo = true

    async function carregarProfessores() {
      if (pagina === 1) {
        setCarregando(true)
      } else {
        setCarregandoMais(true)
      }
      setErro(null)

      try {
        const { data } = await api.get('/coordenadores/transferencia/professores', {
          params: {
            page: pagina,
            limit: LIMITE_PROFESSORES_TRANSFERENCIA,
          },
        })

        if (ativo) {
          const novosProfessores = Array.isArray(data.items) ? data.items : []
          setProfessores((professoresAtuais) => {
            if (pagina === 1) return novosProfessores

            const idsAtuais = new Set(
              professoresAtuais.map((professor) => professor.fisioterapeutaId)
            )
            const professoresSemDuplicidade = novosProfessores.filter(
              (professor) => !idsAtuais.has(professor.fisioterapeutaId)
            )

            return [...professoresAtuais, ...professoresSemDuplicidade]
          })
          setTotalPaginas(data.pagination?.totalPages || 1)
          setTotalProfessores(data.pagination?.total || 0)
        }
      } catch {
        if (ativo) setErro('Erro ao carregar professores.')
      } finally {
        if (ativo) {
          setCarregando(false)
          setCarregandoMais(false)
        }
      }
    }

    carregarProfessores()

    return () => {
      ativo = false
    }
  }, [pagina])

  const novoCoordenador = useMemo(
    () => professores.find((professor) => String(professor.fisioterapeutaId) === novoCoordenadorId),
    [professores, novoCoordenadorId]
  )

  async function transferirCoordenador(e) {
    e.preventDefault()
    setErro(null)

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

  function carregarMaisProfessores() {
    if (carregando || carregandoMais || pagina >= totalPaginas) return
    setPagina((paginaAtual) => paginaAtual + 1)
  }

  const temMaisProfessores = pagina < totalPaginas

  return {
    professores,
    novoCoordenador,
    novoCoordenadorId,
    setNovoCoordenadorId,
    pagina,
    totalPaginas,
    totalProfessores,
    temMaisProfessores,
    carregarMaisProfessores,
    carregando,
    carregandoMais,
    enviando,
    erro,
    formatarProfessor,
    transferirCoordenador,
    voltar,
  }
}

export default useTransferenciaCoordenadorViewModel
