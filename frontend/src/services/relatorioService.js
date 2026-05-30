// Serviço centralizado para operações com relatórios
import api from './api'

export async function avaliarRelatorio(relatorioId, avaliacao) {
  const payload = {
    status: avaliacao.status,
    feedback: avaliacao.feedback,
  }

  if (avaliacao.status === 'APROVADO') {
    payload.dataAprovacao = new Date().toISOString()
  }

  const { data } = await api.patch(`/relatorios/${relatorioId}`, payload)
  return data
}

export async function obterRelatorio(relatorioId) {
  const { data } = await api.get(`/relatorios/${relatorioId}`)
  return data
}
