// Funções utilitárias para formatação de dados
export function formatarCodigo(id, dataCriacao) {
  const ano = dataCriacao ? new Date(dataCriacao).getFullYear() : new Date().getFullYear()
  return `REL-${ano}-${String(id).padStart(3, '0')}`
}

export function formatarData(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleDateString('pt-BR')
}

export function formatarDataHora(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function calcularIdade(dataNascimento) {
  if (!dataNascimento) return '—'
  const hoje = new Date()
  const nascimento = new Date(dataNascimento)
  let idade = hoje.getFullYear() - nascimento.getFullYear()
  const mes = hoje.getMonth() - nascimento.getMonth()
  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--
  }
  return `${idade} anos`
}
