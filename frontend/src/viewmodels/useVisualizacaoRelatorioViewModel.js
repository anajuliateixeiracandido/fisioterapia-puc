import { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

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
        const token = localStorage.getItem('accessToken')
        const response = await fetch(`${API_BASE}/relatorios/${relatorioInicial.id}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })

        if (!response.ok) {
          throw new Error('Erro ao carregar relatório')
        }

        const data = await response.json()
        setRelatorio(data.data || data)
      } catch (err) {
        console.error('Erro ao buscar relatório:', err)
        setErro(err.message)
      } finally {
        setCarregando(false)
      }
    }

    buscarRelatorio()
  }, [relatorioInicial?.id])

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
