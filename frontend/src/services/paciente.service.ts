import { getToken } from '../utils/utilities'
import { buildApiUrl } from '../config/api'

export interface Paciente {
  id?: number | string
  pacienteId?: number | string
  codigo?: string
  nomeCompleto?: string
  nome?: string
  name?: string
  dataNascimento?: string
  sexo?: string
  cpf?: string
  email?: string
  idade?: number
  telefone?: string
  endereco?: string
  alergias?: string
  diagnostico?: string
  condicao?: string
  status?: string
  situacao?: string
  contatosEmergencia?: ContatoEmergencia[]
  professor?: ProfessorPaciente | string
  alunos?: unknown[]
  ultimaConsulta?: string
  ultima_consulta?: string
  updatedAt?: string
  [key: string]: unknown
}

export interface ContatoEmergencia {
  nome?: string
  telefone?: string
  parentesco?: string
}

export interface FisioterapeutaResumo {
  nomeCompleto?: string
}

export interface ProfessorPaciente {
  codigoPessoa?: string
  fisioterapeuta?: FisioterapeutaResumo
}

export interface FetchPacientesResponse {
  data: Paciente[]
  total: number
  limit: number
  offset: number
}

/**
 * Busca pacientes do backend
 * @param busca - Buscar por nome, CPF ou telefone (opcional)
 * @param status - Filtrar por status (opcional)
 * @param limit - Limite de resultados (default: 50)
 * @param offset - Offset para paginacao (default: 0)
 * @returns Lista de pacientes
 */
export async function fetchPacientes(
  busca?: string,
  status?: string,
  limit = 50,
  offset = 0,
): Promise<Paciente[]> {
  try {
    const token = getToken()
    const params = new URLSearchParams()

    if (busca) params.append('busca', busca)
    if (status) params.append('status', status)
    params.append('limit', String(limit))
    params.append('offset', String(offset))

    const url = `${buildApiUrl('/pacientes')}?${params.toString()}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    if (!response.ok) return []

    const result = await response.json()

    if (Array.isArray(result)) return result
    if (Array.isArray(result?.data)) return result.data
    if (Array.isArray(result?.content)) return result.content

    return []
  } catch (error) {
    console.error('Erro ao conectar ao servidor de pacientes:', error)
    return []
  }
}

/**
 * Busca paciente especifico pelo ID
 * @param id - ID do paciente
 * @returns Paciente ou null
 */
export async function fetchPacientePorId(id: string | number): Promise<Paciente | null> {
  try {
    const token = getToken()

    const response = await fetch(buildApiUrl(`/pacientes/${id}`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    if (!response.ok) {
      console.error(`Paciente ${id} nao encontrado`)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error(`Erro ao buscar paciente ${id}:`, error)
    return null
  }
}

// Compatibilidade com o uso atual na tela
export const listarPacientes = fetchPacientes
