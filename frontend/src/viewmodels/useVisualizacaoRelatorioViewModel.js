import { useState, useEffect } from 'react'
import api from '../services/api'

export function useVisualizacaoRelatorioViewModel(relatorioInicial, user) {
  const [relatorio, setRelatorio] = useState(relatorioInicial)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    if (!relatorioInicial?.id) return

    const buscarRelatorio = async () => {
      setCarregando(true)
      setErro(null)
      try {
        const { data } = await api.get(`/relatorios/${relatorioInicial.id}`)
        setRelatorio(data.data || data)
      } catch (err) {
        console.error('Erro ao buscar relatório:', err)
        setErro(err.response?.data?.message || err.message)
      } finally {
        setCarregando(false)
      }
    }

    buscarRelatorio()
  }, [relatorioInicial?.id, relatorioInicial?.status])

  // Verificar permissões
  const calcularPermissoes = () => {
    if (!relatorio || !user) return { podeEditar: false, podeDeletar: false }

    const { fisioterapeuta } = relatorio
    const isAprovado = relatorio.status === 'APROVADO'
    const isProfessor = user?.role === 'PROFESSOR' || user?.role === 'Professor'
    const isAluno = user?.role === 'ALUNO' || user?.role === 'Aluno'
    const isAutor = fisioterapeuta?.id === user?.fisioterapeutaId

    // Professor pode editar sempre, Aluno só se for autor e não estiver aprovado
    const podeEditar = (isProfessor) || (isAluno && isAutor && !isAprovado)

    // Tanto professor quanto aluno podem deletar apenas seus próprios relatórios
    const podeDeletar = isAutor

    return { podeEditar, podeDeletar }
  }

  const permissoes = calcularPermissoes()

  return {
    relatorio,
    carregando,
    erro,
    podeEditar: permissoes.podeEditar,
    podeDeletar: permissoes.podeDeletar,
  }
}
