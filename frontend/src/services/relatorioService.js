// Serviço centralizado para operações com relatórios
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

function getHeaders() {
  const token = localStorage.getItem('accessToken')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function avaliarRelatorio(relatorioId, avaliacao) {
  const payload = {
    status: avaliacao.status,
    feedback: avaliacao.feedback,
  }

  if (avaliacao.status === 'APROVADO') {
    payload.dataAprovacao = new Date().toISOString()
  }

  const response = await fetch(`${API_BASE}/relatorios/${relatorioId}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erro ao salvar avaliação')
  }

  return response.json()
}

export async function obterRelatorio(relatorioId) {
  const response = await fetch(`${API_BASE}/relatorios/${relatorioId}`, {
    headers: getHeaders(),
  })

  if (!response.ok) {
    throw new Error('Erro ao carregar relatório')
  }

  return response.json()
}
