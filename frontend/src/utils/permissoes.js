// Funções de verificação de permissões para relatórios
export function podeEditarRelatorio(relatorio, user) {
  const isProfessor = user?.role === 'PROFESSOR'
  const isAluno = user?.role === 'ALUNO'
  const isAutor = relatorio?.fisioterapeuta?.id === user?.fisioterapeutaId
  const isAprovado = relatorio?.status === 'APROVADO'

  return (isProfessor || (isAluno && isAutor)) && !isAprovado
}

export function podeDeletarRelatorio(relatorio, user) {
  const isProfessor = user?.role === 'PROFESSOR'
  const isAluno = user?.role === 'ALUNO'
  const isAutor = relatorio?.fisioterapeuta?.id === user?.fisioterapeutaId
  const isAprovado = relatorio?.status === 'APROVADO'

  return (isProfessor || (isAluno && isAutor)) && !isAprovado
}

export function podeAvaliarRelatorio(relatorio, user) {
  const isProfessor = user?.role === 'PROFESSOR'
  const isProfessorResponsavel = relatorio?.professorResponsavel?.fisioterapeuta?.id === user?.fisioterapeutaId
  const isCoordenador = user?.coordenador === true
  const statusPermitido = ['ENVIADO', 'CORRIGIDO'].includes(relatorio?.status)

  return isProfessor && (isProfessorResponsavel || isCoordenador) && statusPermitido
}
