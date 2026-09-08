// Serviço centralizado para operações com relatórios
import api from './api'

function extrairNomeArquivo(contentDisposition, fallback) {
  const match = contentDisposition?.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i)
  const raw = match?.[1] || match?.[2]

  if (!raw) return fallback

  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
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

  const { data } = await api.patch(`/relatorios/${relatorioId}`, payload)
  return data
}

export async function obterRelatorio(relatorioId) {
  const { data } = await api.get(`/relatorios/${relatorioId}`)
  return data
}

export async function exportarRelatorioDocx(relatorioId) {
  const response = await api.get(`/relatorios/${relatorioId}/docx`, {
    responseType: 'blob',
    headers: {
      'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  })

  return {
    blob: response.data,
    fileName: extrairNomeArquivo(
      response.headers['content-disposition'],
      `relatorio-${relatorioId}.docx`
    ),
  }
}
