// Acessa a variável de ambiente do Vite
// @ts-ignore
const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000'

export interface CIFReferencia {
    id: number
    tipoCIF: string
    codigo: string
    codigoPai?: string
    descricao: string
    categoria: string
    nivel: number
    capitulo?: number
    ordemExibicao?: number
}

export interface FetchReferencesResponse {
    data: CIFReferencia[]
    total: number
    limit: number
    offset: number
}

/**
 * Busca referências CIF do backend
 * @param categoria - Filtrar por categoria (opcional)
 * @param busca - Buscar por código ou descrição (opcional)
 * @param limit - Limite de resultados (default: 50)
 * @param offset - Offset para paginação (default: 0)
 * @returns Lista de referências CIF
 */
export async function fetchCIFReferences(
    categoria?: string,
    busca?: string,
    limit = 2000,
    offset = 0,
    tipoCIF?: string
): Promise<CIFReferencia[]> {
    try {
        const params = new URLSearchParams()

        if (categoria) params.append('categoria', categoria)
        if (busca) params.append('busca', busca)
        if (tipoCIF) params.append('tipoCIF', tipoCIF)
        params.append('limit', String(limit))
        params.append('offset', String(offset))

        const url = `${API_BASE}/api/v1/cif-referencias?${params.toString()}`
        console.log('Buscando CIF:', { categoria, busca, tipoCIF, url })

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Authorization será adicionado pelo interceptor se disponível
            },
        })

        if (!response.ok) return []

        const result = await response.json()
        return result.data
    } catch (error) {
        console.error('Erro ao conectar ao servidor CIF:', error)
        return []
    }
}

/**
 * Busca uma referência CIF específica pelo código
 * @param codigo - Código da referência (ex: 'b1', 's1.2')
 * @returns Referência CIF ou null
 */
export async function fetchCIFReferencePorCodigo(codigo: string): Promise<CIFReferencia | null> {
    try {
        const response = await fetch(`${API_BASE}/api/v1/cif-referencias/${codigo}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            console.error(`Referência CIF ${codigo} não encontrada`)
            return null
        }

        return await response.json()
    } catch (error) {
        console.error(`Erro ao buscar referência ${codigo}:`, error)
        return null
    }
}
