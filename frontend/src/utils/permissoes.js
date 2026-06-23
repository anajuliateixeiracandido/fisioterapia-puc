// Funções de verificação de permissões para relatórios
export function podeEditarRelatorio(relatorio, user) {
  const isAutor = relatorio?.fisioterapeuta?.id === user?.fisioterapeutaId
  const isAprovado = relatorio?.status === 'APROVADO'

  // Apenas o autor do relatório pode editá-lo, e somente se não estiver aprovado
  return isAutor && !isAprovado
}

export function podeDeletarRelatorio(relatorio, user) {
  const isAutor = relatorio?.fisioterapeuta?.id === user?.fisioterapeutaId

  // Apenas o autor pode deletar o seu próprio relatório
  return isAutor
}

export function podeAvaliarRelatorio(relatorio, user) {
  const isProfessor = user?.role === 'PROFESSOR'
  const isProfessorResponsavel = relatorio?.professorResponsavel?.fisioterapeuta?.id === user?.fisioterapeutaId
  const isCoordenador = user?.coordenador === true
  const statusPermitido = ['ENVIADO', 'CORRIGIDO'].includes(relatorio?.status)

  return isProfessor && (isProfessorResponsavel || isCoordenador) && statusPermitido
}
