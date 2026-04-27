// Constantes centralizadas do sistema
export const STATUS_RELATORIO = {
  ENVIADO: { label: 'Enviado', cor: 'blue', icon: 'Clock' },
  APROVADO: { label: 'Aprovado', cor: 'green', icon: 'CheckCircle' },
  NEGADO: { label: 'Negado', cor: 'red', icon: 'XCircle' },
  CORRIGIDO: { label: 'Corrigido', cor: 'orange', icon: 'AlertCircle' },
}

export const CIF_TYPES = {
  b: { key: 'b', label: 'Funções do Corpo', description: 'Funções fisiológicas dos sistemas do corpo' },
  s: { key: 's', label: 'Estruturas do Corpo', description: 'Partes anatômicas do corpo' },
  d: { key: 'd', label: 'Atividades e Participação', description: 'Execução de tarefas e envolvimento em situações da vida' },
  e: { key: 'e', label: 'Fatores Ambientais', description: 'Ambiente físico, social e de atitudes' },
}

export const CIF_TIPOS_ARRAY = [
  { key: 'b', label: 'Funções do Corpo', description: 'Funções fisiológicas dos sistemas do corpo' },
  { key: 's', label: 'Estruturas do Corpo', description: 'Partes anatômicas do corpo' },
  { key: 'd', label: 'Atividades e Participação', description: 'Execução de tarefas e envolvimento em situações da vida' },
  { key: 'e', label: 'Fatores Ambientais', description: 'Ambiente físico, social e de atitudes' },
]

export const CIF_CATEGORIA_MAP = {
  b: 'FUNCAO',
  s: 'ESTRUTURA',
  d: 'ACTIVIDADE_PARTICIPACAO',
  e: 'FACTOR_AMBIENTAL',
}

export const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'ENVIADO', label: 'Enviado' },
  { value: 'APROVADO', label: 'Aprovado' },
  { value: 'NEGADO', label: 'Negado' },
  { value: 'CORRIGIDO', label: 'Corrigido' },
]
